import { useState } from 'react'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragOverEvent,
  DragEndEvent,
  closestCorners,
} from '@dnd-kit/core'
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import AppShell from '@/components/layout/AppShell'
import { PageHeader, Button } from '@/components/ui'
import { useLeads, useUpdateLeadStatus } from '@/hooks/useData'
import type { Lead, LeadStatus } from '@/types'

const COLUMNS: { status: LeadStatus; label: string }[] = [
  { status: 'new',           label: 'New' },
  { status: 'contacted',     label: 'Contacted' },
  { status: 'proposal_sent', label: 'Proposal sent' },
  { status: 'negotiating',   label: 'Negotiating' },
  { status: 'booked',        label: 'Booked' },
]

function formatDate(dateStr?: string) {
  if (!dateStr) return null
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

// ── Lead card (used both in sortable context and drag overlay) ────

function LeadCardContent({ lead, isDragging = false }: { lead: Lead; isDragging?: boolean }) {
  return (
    <div
      className="rounded-xl p-4 space-y-3 transition-shadow"
      style={{
        background: 'white',
        border: '1px solid var(--color-navy-100)',
        boxShadow: isDragging ? '0 8px 24px rgba(13,21,37,0.15)' : undefined,
        opacity: isDragging ? 0.95 : 1,
        cursor: isDragging ? 'grabbing' : 'grab',
      }}
    >
      <div>
        <p className="font-medium text-sm" style={{ color: 'var(--color-navy-800)' }}>
          {lead.firstName} {lead.lastName}
          {lead.partnerName && (
            <span className="font-normal" style={{ color: 'var(--color-navy-400)' }}> & {lead.partnerName}</span>
          )}
        </p>
        {lead.weddingDate && (
          <p className="text-xs mt-0.5" style={{ color: 'var(--color-navy-400)' }}>{formatDate(lead.weddingDate)}</p>
        )}
      </div>
      {lead.venueName && <p className="text-xs" style={{ color: 'var(--color-navy-500)' }}>📍 {lead.venueName}</p>}
      {lead.budget && <p className="text-xs" style={{ color: 'var(--color-navy-500)' }}>💰 ${lead.budget.toLocaleString()} budget</p>}
      {lead.source && (
        <p className="text-xs" style={{ color: 'var(--color-navy-400)' }}>
          via {lead.source.replace(/_/g, ' ')}
          {lead.referralName && ` · ${lead.referralName}`}
        </p>
      )}
      {lead.notes && (
        <p className="text-xs italic line-clamp-2 pt-2" style={{ color: 'var(--color-navy-400)', borderTop: '1px solid var(--color-navy-100)' }}>
          {lead.notes}
        </p>
      )}
    </div>
  )
}

// ── Sortable lead card ────────────────────────────────────────────

function SortableLeadCard({ lead }: { lead: Lead }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: lead.id,
    data: { lead, type: 'lead' },
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
  }

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <LeadCardContent lead={lead} />
    </div>
  )
}

// ── Kanban column ─────────────────────────────────────────────────

function KanbanColumn({
  status,
  label,
  leads,
  isOver,
}: {
  status: LeadStatus
  label: string
  leads: Lead[]
  isOver: boolean
}) {
  return (
    <div className="flex-shrink-0 w-64">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-medium uppercase tracking-widest" style={{ color: 'var(--color-navy-500)' }}>
          {label}
        </span>
        <span className="text-xs rounded-full px-2 py-0.5" style={{ background: 'var(--color-navy-100)', color: 'var(--color-navy-500)' }}>
          {leads.length}
        </span>
      </div>

      <div
        className="min-h-32 rounded-xl transition-colors duration-150 p-1 -m-1"
        style={{ background: isOver ? 'var(--color-navy-50)' : 'transparent' }}
      >
        <SortableContext items={leads.map(l => l.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-3">
            {leads.length === 0 ? (
              <div
                className="rounded-xl h-24 flex items-center justify-center transition-colors"
                style={{
                  border: `2px dashed ${isOver ? 'var(--color-steel-400)' : 'var(--color-navy-200)'}`,
                  background: isOver ? 'var(--color-navy-50)' : 'transparent',
                }}
              >
                <span className="text-xs" style={{ color: isOver ? 'var(--color-steel-500)' : 'var(--color-navy-300)' }}>
                  {isOver ? 'Drop here' : 'empty'}
                </span>
              </div>
            ) : (
              leads.map(lead => <SortableLeadCard key={lead.id} lead={lead} />)
            )}
          </div>
        </SortableContext>
      </div>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────

export default function LeadsPage() {
  const { data: leads = [], isLoading } = useLeads()
  const updateStatus = useUpdateLeadStatus()
  const [showLost, setShowLost] = useState(false)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [overId, setOverId] = useState<LeadStatus | null>(null)

  // Local status overrides for optimistic updates during drag
  const [localStatuses, setLocalStatuses] = useState<Record<string, LeadStatus>>({})

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  )

  const getLeadStatus = (lead: Lead): LeadStatus =>
    localStatuses[lead.id] ?? lead.status

  const activeLead = activeId ? leads.find(l => l.id === activeId) : null

  // Figure out which column a dragged item is currently over
  const getColumnForItem = (itemId: string): LeadStatus | null => {
    const lead = leads.find(l => l.id === itemId)
    if (!lead) return null
    return getLeadStatus(lead)
  }

  function handleDragStart(event: DragStartEvent) {
    setActiveId(event.active.id as string)
  }

  function handleDragOver(event: DragOverEvent) {
    const { active, over } = event
    if (!over) { setOverId(null); return }

    const activeLeadId = active.id as string

    // Are we over a column id or another lead id?
    const overColumn = COLUMNS.find(c => c.status === over.id)
    if (overColumn) {
      setOverId(overColumn.status)
      setLocalStatuses(prev => ({ ...prev, [activeLeadId]: overColumn.status }))
      return
    }

    // We're over another lead — find its column
    const overLead = leads.find(l => l.id === over.id)
    if (overLead) {
      const targetStatus = getLeadStatus(overLead)
      setOverId(targetStatus)
      setLocalStatuses(prev => ({ ...prev, [activeLeadId]: targetStatus }))
    }
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active } = event
    const leadId = active.id as string
    const newStatus = localStatuses[leadId]

    if (newStatus) {
      const original = leads.find(l => l.id === leadId)
      if (original && original.status !== newStatus) {
        updateStatus.mutate({ id: leadId, status: newStatus })
      }
    }

    setActiveId(null)
    setOverId(null)
    setLocalStatuses({})
  }

  function handleDragCancel() {
    setActiveId(null)
    setOverId(null)
    setLocalStatuses({})
  }

  const getColumnLeads = (status: LeadStatus) =>
    leads
      .filter(l => l.status !== 'lost' || showLost)
      .filter(l => getLeadStatus(l) === status)

  return (
    <AppShell>
      <div className="px-10 py-10">
        <PageHeader
          title="Lead pipeline"
          subtitle={`${leads.filter(l => l.status !== 'lost').length} active leads`}
          action={
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowLost(!showLost)}
                className="text-xs transition-colors hover:opacity-70"
                style={{ color: 'var(--color-navy-400)' }}
              >
                {showLost ? 'Hide lost' : 'Show lost'}
              </button>
              <Button size="sm">+ New lead</Button>
            </div>
          }
        />

        {isLoading ? (
          <div className="text-sm" style={{ color: 'var(--color-navy-400)' }}>Loading...</div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
            onDragCancel={handleDragCancel}
          >
            <div className="flex gap-4 overflow-x-auto pb-6">
              {COLUMNS.map(col => (
                <KanbanColumn
                  key={col.status}
                  status={col.status}
                  label={col.label}
                  leads={getColumnLeads(col.status)}
                  isOver={overId === col.status}
                />
              ))}

              {showLost && (
                <div className="flex-shrink-0 w-64 opacity-50">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-medium uppercase tracking-widest" style={{ color: 'var(--color-navy-400)' }}>Lost</span>
                    <span className="text-xs rounded-full px-2 py-0.5" style={{ background: 'var(--color-navy-100)', color: 'var(--color-navy-400)' }}>
                      {leads.filter(l => l.status === 'lost').length}
                    </span>
                  </div>
                  <div className="space-y-3">
                    {leads.filter(l => l.status === 'lost').map(lead => (
                      <LeadCardContent key={lead.id} lead={lead} />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Drag overlay - renders the card being dragged */}
            <DragOverlay dropAnimation={{ duration: 150, easing: 'ease' }}>
              {activeLead && <LeadCardContent lead={activeLead} isDragging />}
            </DragOverlay>
          </DndContext>
        )}
      </div>
    </AppShell>
  )
}