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
  useDroppable
} from '@dnd-kit/core'
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import AppShell from '@/components/layout/AppShell'
import NewLeadModal from '@/components/forms/NewLeadModal'
import NewBookingModal from '@/components/forms/NewBookingModal'
import { PageHeader, Button } from '@/components/ui'
import { useLeads, useUpdateLeadStatus, useDeleteLead } from '@/hooks/useData'
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

// ── Lead card ─────────────────────────────────────────────────────

function LeadCardContent({
  lead,
  isDragging = false,
  onConvert,
  onDelete,
}: {
  lead: Lead
  isDragging?: boolean
  onConvert?: (lead: Lead) => void
  onDelete?: (id: string) => void
}) {
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
      {!isDragging && (onConvert || onDelete) && (
        <div style={{ borderTop: '1px solid var(--color-navy-100)', paddingTop: '8px', marginTop: '4px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {onConvert && lead.status !== 'booked' && lead.status !== 'lost' && (
            <button
              onClick={e => { e.stopPropagation(); onConvert(lead) }}
              style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-steel-600)', background: 'var(--color-navy-50)', border: '1px solid var(--color-navy-200)', borderRadius: '6px', padding: '4px 10px', cursor: 'pointer', fontFamily: 'inherit', width: '100%' }}
            >
              Convert to booking →
            </button>
          )}
          {onDelete && (
            <button
              onClick={e => { e.stopPropagation(); onDelete(lead.id) }}
              style={{ fontSize: '11px', color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', padding: '2px 0', textAlign: 'left' }}
            >
              Delete lead
            </button>
          )}
        </div>
      )}
    </div>
  )
}

// ── Sortable lead card ────────────────────────────────────────────

function SortableLeadCard({
  lead,
  onConvert,
  onDelete,
}: {
  lead: Lead
  onConvert?: (lead: Lead) => void
  onDelete?: (id: string) => void
}) {
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
      <LeadCardContent lead={lead} onConvert={onConvert} onDelete={onDelete} />
    </div>
  )
}

// ── Kanban column ─────────────────────────────────────────────────

function KanbanColumn({
  status,
  label,
  leads,
  isOver,
  onConvert,
  onDelete,
}: {
  status: LeadStatus
  label: string
  leads: Lead[]
  isOver: boolean
  onConvert?: (lead: Lead) => void
  onDelete?: (id: string) => void
}) {
  const { setNodeRef } = useDroppable({ id: status })

  return (
    <div className="shrink-0 w-64">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-medium uppercase tracking-widest" style={{ color: 'var(--color-navy-500)' }}>
          {label}
        </span>
        <span className="text-xs rounded-full px-2 py-0.5" style={{ background: 'var(--color-navy-100)', color: 'var(--color-navy-500)' }}>
          {leads.length}
        </span>
      </div>

      <div
        ref={setNodeRef}
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
              leads.map(lead => (
                <SortableLeadCard
                  key={lead.id}
                  lead={lead}
                  onConvert={onConvert}
                  onDelete={onDelete}
                />
              ))
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
  const deleteLead = useDeleteLead()
  const [showLost, setShowLost] = useState(false)
  const [showNewLead, setShowNewLead] = useState(false)
  const [convertLead, setConvertLead] = useState<Lead | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [overId, setOverId] = useState<LeadStatus | null>(null)
  const [localStatuses, setLocalStatuses] = useState<Record<string, LeadStatus>>({})

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  )

  const getLeadStatus = (lead: Lead): LeadStatus =>
    localStatuses[lead.id] ?? lead.status

  const activeLead = activeId ? leads.find(l => l.id === activeId) : null

  function handleDragStart(event: DragStartEvent) {
    setActiveId(event.active.id as string)
  }

  function handleDragOver(event: DragOverEvent) {
    const { active, over } = event
    if (!over) { setOverId(null); return }

    const activeLeadId = active.id as string

    const overColumn = COLUMNS.find(c => c.status === over.id)
    if (overColumn) {
      setOverId(overColumn.status)
      setLocalStatuses(prev => ({ ...prev, [activeLeadId]: overColumn.status }))
      return
    }

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
    setTimeout(() => setLocalStatuses({}), 300)
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
              <Button size="sm" onClick={() => setShowNewLead(true)}>+ New lead</Button>
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
                  onConvert={setConvertLead}
                  onDelete={setConfirmDelete}
                />
              ))}

              {showLost && (
                <div className="shrink-0 w-64 opacity-50">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-medium uppercase tracking-widest" style={{ color: 'var(--color-navy-400)' }}>Lost</span>
                    <span className="text-xs rounded-full px-2 py-0.5" style={{ background: 'var(--color-navy-100)', color: 'var(--color-navy-400)' }}>
                      {leads.filter(l => l.status === 'lost').length}
                    </span>
                  </div>
                  <div className="space-y-3">
                    {leads.filter(l => l.status === 'lost').map(lead => (
                      <LeadCardContent key={lead.id} lead={lead} onDelete={setConfirmDelete} />
                    ))}
                  </div>
                </div>
              )}
            </div>

            <DragOverlay dropAnimation={{ duration: 150, easing: 'ease' }}>
              {activeLead && <LeadCardContent lead={activeLead} isDragging />}
            </DragOverlay>
          </DndContext>
        )}
      </div>

      {showNewLead && <NewLeadModal onClose={() => setShowNewLead(false)} />}
      {convertLead && <NewBookingModal onClose={() => setConvertLead(null)} prefill={convertLead} leadId={convertLead.id} />}

      {/* Delete confirmation dialog */}
      {confirmDelete && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div style={{ background: 'white', borderRadius: '12px', padding: '24px', maxWidth: '360px', width: '90%', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
            <p className="font-medium text-sm mb-2" style={{ color: 'var(--color-navy-800)' }}>Delete lead?</p>
            <p className="text-xs mb-6" style={{ color: 'var(--color-navy-400)' }}>This cannot be undone.</p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setConfirmDelete(null)}
                style={{ fontSize: '13px', padding: '8px 16px', borderRadius: '8px', border: '1px solid var(--color-navy-200)', background: 'white', cursor: 'pointer', fontFamily: 'inherit' }}
              >
                Cancel
              </button>
              <button
                onClick={() => { deleteLead.mutate(confirmDelete); setConfirmDelete(null) }}
                style={{ fontSize: '13px', padding: '8px 16px', borderRadius: '8px', border: 'none', background: '#ef4444', color: 'white', cursor: 'pointer', fontFamily: 'inherit' }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  )
}