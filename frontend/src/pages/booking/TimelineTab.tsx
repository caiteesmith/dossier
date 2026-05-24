import { useState, useRef } from 'react'
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
  closestCenter,
  MeasuringStrategy,
} from '@dnd-kit/core'
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Card, Button } from '@/components/ui'
function to12h(hhmm: string): string {
  if (!hhmm) return hhmm
  const [h, m] = hhmm.split(':').map(Number)
  const ampm = h < 12 ? 'am' : 'pm'
  const hour = h % 12 === 0 ? 12 : h % 12
  return `${hour}:${String(m).padStart(2, '0')}${ampm}`
}
import type { Timeline, TimelineBlock } from '@/types'

interface BlockFormProps {
  initial?: Partial<TimelineBlock>
  onSave: (block: Omit<TimelineBlock, 'id' | 'timelineId' | 'sortOrder'>) => void
  onCancel: () => void
}

function BlockForm({ initial, onSave, onCancel }: BlockFormProps) {
  const [title, setTitle] = useState(initial?.title ?? '')
  const [startTime, setStartTime] = useState(initial?.startTime ?? '')
  const [duration, setDuration] = useState(String(initial?.durationMinutes ?? 60))
  const [location, setLocation] = useState(initial?.location ?? '')
  const [notes, setNotes] = useState(initial?.notes ?? '')

  const inputStyle = {
    background: 'var(--color-fog)',
    border: '1px solid var(--color-navy-100)',
    borderRadius: '8px',
    padding: '7px 12px',
    fontSize: '13px',
    color: 'var(--color-navy-800)',
    outline: 'none',
    width: '100%',
  }

  return (
    <div className="rounded-xl p-4 space-y-3" style={{ background: 'var(--color-navy-50)', border: '1px solid var(--color-navy-100)' }}>
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <label className="text-xs uppercase tracking-widest mb-1 block" style={{ color: 'var(--color-navy-400)' }}>Event</label>
          <input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Bridal prep, Ceremony, Portraits" style={inputStyle} autoFocus />
        </div>
        <div>
          <label className="text-xs uppercase tracking-widest mb-1 block" style={{ color: 'var(--color-navy-400)' }}>Start time</label>
          <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} style={inputStyle} />
        </div>
        <div>
          <label className="text-xs uppercase tracking-widest mb-1 block" style={{ color: 'var(--color-navy-400)' }}>Duration (min)</label>
          <input type="number" value={duration} onChange={e => setDuration(e.target.value)} min={5} step={5} style={inputStyle} />
        </div>
        <div className="col-span-2">
          <label className="text-xs uppercase tracking-widest mb-1 block" style={{ color: 'var(--color-navy-400)' }}>Location</label>
          <input value={location} onChange={e => setLocation(e.target.value)} placeholder="e.g. Outdoor chapel, Grand ballroom" style={inputStyle} />
        </div>
        <div className="col-span-2">
          <label className="text-xs uppercase tracking-widest mb-1 block" style={{ color: 'var(--color-navy-400)' }}>Notes</label>
          <input value={notes} onChange={e => setNotes(e.target.value)} placeholder="Any notes for this block" style={inputStyle} />
        </div>
      </div>
      <div className="flex gap-2 pt-1">
        <Button size="sm" onClick={() => {
          if (!title.trim() || !startTime) return
          onSave({ title: title.trim(), startTime, durationMinutes: parseInt(duration) || 60, location: location.trim() || undefined, notes: notes.trim() || undefined })
        }} disabled={!title.trim() || !startTime}>
          Save block
        </Button>
        <Button size="sm" variant="ghost" onClick={onCancel}>Cancel</Button>
      </div>
    </div>
  )
}

function BlockContent({ block, isDragging = false, onEdit, onDelete }: {
  block: TimelineBlock
  isDragging?: boolean
  onEdit?: () => void
  onDelete?: () => void
}) {
  const isGolden = block.title.toLowerCase().includes('golden') || block.title.toLowerCase().includes('sunset')

  return (
    <div
      className="flex items-start gap-5 px-6 py-4 group"
      style={{
        background: isDragging ? 'white' : isGolden ? 'var(--color-gold-pale)' : 'transparent',
        boxShadow: isDragging ? '0 4px 20px rgba(13,21,37,0.15)' : undefined,
        borderRadius: isDragging ? '12px' : undefined,
        cursor: isDragging ? 'grabbing' : 'grab',
        width: isDragging ? '680px' : undefined,
      }}
    >
      <div className="flex flex-col gap-0.5 shrink-0 mt-1.5 opacity-20 group-hover:opacity-50 transition-opacity">
        <div className="w-3 h-px rounded" style={{ background: 'var(--color-navy-500)' }} />
        <div className="w-3 h-px rounded" style={{ background: 'var(--color-navy-500)' }} />
        <div className="w-3 h-px rounded" style={{ background: 'var(--color-navy-500)' }} />
      </div>
      <div className="w-14 shrink-0 text-right">
        <span className="text-sm font-medium" style={{ color: 'var(--color-navy-600)' }}>{to12h(block.startTime)}</span>
      </div>
      <div className="w-px self-stretch shrink-0" style={{ background: 'var(--color-navy-200)' }} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium" style={{ color: isGolden ? 'var(--color-gold-warm)' : 'var(--color-navy-800)' }}>
          {block.title}
        </p>
        <div className="flex items-center gap-3 mt-0.5 flex-wrap">
          <span className="text-xs" style={{ color: 'var(--color-navy-400)' }}>{block.durationMinutes} min</span>
          {block.location && <span className="text-xs" style={{ color: 'var(--color-navy-400)' }}>· {block.location}</span>}
        </div>
        {block.notes && <p className="text-xs italic mt-1" style={{ color: 'var(--color-navy-400)' }}>{block.notes}</p>}
      </div>
      {!isDragging && (
        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
          <button onClick={e => { e.stopPropagation(); onEdit?.() }} className="text-xs hover:opacity-70 transition-opacity" style={{ color: 'var(--color-navy-400)' }}>Edit</button>
          <button onClick={e => { e.stopPropagation(); onDelete?.() }} className="text-xs hover:opacity-70 transition-opacity" style={{ color: '#b91c1c' }}>Remove</button>
        </div>
      )}
    </div>
  )
}

function SortableBlock({ block, onEdit, onDelete }: { block: TimelineBlock; onEdit: () => void; onDelete: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: block.id })
  return (
    <div ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.3 : 1 }} {...attributes} {...listeners}>
      <BlockContent block={block} onEdit={onEdit} onDelete={onDelete} />
    </div>
  )
}

interface TimelineTabProps {
  bookingId: string
  initialTimeline?: Timeline
}

export default function TimelineTab({ initialTimeline }: TimelineTabProps) {
  const [blocks, setBlocks] = useState<TimelineBlock[]>(initialTimeline?.blocks ?? [])
  const [activeId, setActiveId] = useState<string | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  )

  const sortedBlocks = [...blocks].sort((a, b) => a.startTime.localeCompare(b.startTime))

  function handleDragStart(event: DragStartEvent) { setActiveId(event.active.id as string) }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (over && active.id !== over.id) {
      setBlocks(prev => {
        const oldIndex = prev.findIndex(b => b.id === active.id)
        const newIndex = prev.findIndex(b => b.id === over.id)
        return arrayMove(prev, oldIndex, newIndex)
      })
    }
    setActiveId(null)
  }

  function handleAdd(blockData: Omit<TimelineBlock, 'id' | 'timelineId' | 'sortOrder'>) {
    setBlocks(prev => [...prev, { ...blockData, id: `block-${Date.now()}`, timelineId: initialTimeline?.id ?? '', sortOrder: prev.length }])
    setShowAddForm(false)
  }

  function handleEdit(id: string, blockData: Omit<TimelineBlock, 'id' | 'timelineId' | 'sortOrder'>) {
    setBlocks(prev => prev.map(b => b.id === id ? { ...b, ...blockData } : b))
    setEditingId(null)
  }

  function handleDelete(id: string) {
    setBlocks(prev => prev.filter(b => b.id !== id))
  }

  return (
    <div ref={containerRef} className="space-y-4">
      {initialTimeline?.sunsetTime && (
        <div className="flex items-center gap-4 text-sm rounded-xl px-5 py-3" style={{ background: 'var(--color-gold-pale)', color: 'var(--color-gold-warm)' }}>
          <span>🌅 Sunset {to12h(initialTimeline.sunsetTime ?? '')}</span>
          <span>·</span>
          <span>✨ Golden hour {to12h(initialTimeline.goldenHourTime ?? '')}</span>
        </div>
      )}

      {blocks.length === 0 && !showAddForm ? (
        <div className="text-center py-16">
          <p className="font-display italic text-lg" style={{ color: 'var(--color-navy-400)' }}>No timeline yet</p>
          <p className="text-sm mt-1" style={{ color: 'var(--color-navy-300)' }}>Build the wedding day schedule block by block.</p>
          <Button className="mt-4" size="sm" onClick={() => setShowAddForm(true)}>+ Add first block</Button>
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          measuring={{ droppable: { strategy: MeasuringStrategy.Always } }}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <Card>
            <SortableContext items={sortedBlocks.map(b => b.id)} strategy={verticalListSortingStrategy}>
              <div>
                {sortedBlocks.map((block, i) => (
                  <div key={block.id} style={{ borderTop: i === 0 ? 'none' : '1px solid var(--color-navy-100)' }}>
                    {editingId === block.id ? (
                      <div className="p-4">
                        <BlockForm initial={block} onSave={data => handleEdit(block.id, data)} onCancel={() => setEditingId(null)} />
                      </div>
                    ) : (
                      <SortableBlock block={block} onEdit={() => setEditingId(block.id)} onDelete={() => handleDelete(block.id)} />
                    )}
                  </div>
                ))}
              </div>
            </SortableContext>
          </Card>

        </DndContext>
      )}

      {showAddForm ? (
        <BlockForm onSave={handleAdd} onCancel={() => setShowAddForm(false)} />
      ) : (
        blocks.length > 0 && (
          <Button variant="secondary" size="sm" onClick={() => setShowAddForm(true)}>+ Add block</Button>
        )
      )}
    </div>
  )
}