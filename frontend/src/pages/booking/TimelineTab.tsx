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
import { useAddTimelineBlock, useUpdateTimelineBlock, useDeleteTimelineBlock } from '@/hooks/useData'
import type { Timeline, TimelineBlock } from '@/types'

function to12h(hhmm: string): string {
  if (!hhmm) return hhmm
  const [h, m] = hhmm.split(':').map(Number)
  const ampm = h < 12 ? 'am' : 'pm'
  const hour = h % 12 === 0 ? 12 : h % 12
  return `${hour}:${String(m).padStart(2, '0')}${ampm}`
}

function addMinutes(hhmm: string, minutes: number): string {
  if (!hhmm) return ''
  const [h, m] = hhmm.split(':').map(Number)
  const total = h * 60 + m + minutes
  const hh = Math.floor(total / 60) % 24
  const mm = total % 60
  return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`
}

type BlockTheme = 'ceremony' | 'reception' | 'golden' | 'default'

function getTheme(title: string): BlockTheme {
  const t = title.toLowerCase()
  if (t.includes('golden') || t.includes('sunset')) return 'golden'
  if (t.includes('ceremony')) return 'ceremony'
  if (t.includes('reception')) return 'reception'
  return 'default'
}

const THEME_STYLES: Record<BlockTheme, { bg: string; titleColor: string; pill: string; pillText: string }> = {
  golden:    { bg: 'var(--color-gold-pale)',   titleColor: 'var(--color-gold-warm)',  pill: 'rgba(180,130,40,0.12)',  pillText: 'var(--color-gold-warm)'  },
  ceremony:  { bg: 'rgba(139,111,171,0.07)',   titleColor: '#6b48a0',                 pill: 'rgba(139,111,171,0.15)', pillText: '#6b48a0'                  },
  reception: { bg: 'rgba(30,100,160,0.06)',    titleColor: 'var(--color-steel-600)',  pill: 'rgba(30,100,160,0.12)', pillText: 'var(--color-steel-600)'  },
  default:   { bg: 'transparent',             titleColor: 'var(--color-navy-800)',   pill: 'var(--color-navy-100)', pillText: 'var(--color-navy-500)'   },
}

// ── Location combo input ──────────────────────────────────────────

interface LocationInputProps {
  value: string
  onChange: (v: string) => void
  suggestions: string[]
  inputStyle: React.CSSProperties
}

function LocationInput({ value, onChange, suggestions, inputStyle }: LocationInputProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const filtered = suggestions.filter(s =>
    s.toLowerCase().includes(value.toLowerCase()) && s !== value
  )
  const showDropdown = open && filtered.length > 0

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <input
        value={value}
        onChange={e => { onChange(e.target.value); setOpen(true) }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        placeholder="e.g. Outdoor chapel, Grand ballroom"
        style={inputStyle}
      />
      {showDropdown && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            left: 0,
            right: 0,
            background: 'white',
            border: '1px solid var(--color-navy-100)',
            borderRadius: '8px',
            boxShadow: '0 4px 16px rgba(13,21,37,0.1)',
            zIndex: 50,
            overflow: 'hidden',
          }}
        >
          {filtered.map(s => (
            <button
              key={s}
              onMouseDown={() => { onChange(s); setOpen(false) }}
              style={{
                display: 'block',
                width: '100%',
                textAlign: 'left',
                padding: '8px 12px',
                fontSize: '13px',
                color: 'var(--color-navy-700)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                borderBottom: '1px solid var(--color-navy-50)',
                fontFamily: 'inherit',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-navy-50)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'none')}
            >
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Block form ────────────────────────────────────────────────────

interface BlockFormProps {
  initial?: Partial<TimelineBlock>
  knownLocations: string[]
  defaultLocation?: string
  onSave: (block: Omit<TimelineBlock, 'id' | 'timelineId' | 'sortOrder'>) => void
  onCancel: () => void
  saving?: boolean
}

function BlockForm({ initial, knownLocations, defaultLocation, onSave, onCancel, saving }: BlockFormProps) {
  const [title, setTitle]         = useState(initial?.title ?? '')
  const [startTime, setStartTime] = useState(initial?.startTime ?? '')
  const [duration, setDuration]   = useState(String(initial?.durationMinutes ?? 60))
  const [location, setLocation]   = useState(initial?.location ?? defaultLocation ?? '')
  const [notes, setNotes]         = useState(initial?.notes ?? '')

  const endTime = startTime && duration ? addMinutes(startTime, parseInt(duration) || 0) : null

  const inputStyle: React.CSSProperties = {
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
        {endTime && (
          <div className="col-span-2">
            <p className="text-xs" style={{ color: 'var(--color-navy-400)' }}>
              Ends at <span style={{ color: 'var(--color-navy-600)', fontWeight: 500 }}>{to12h(endTime)}</span>
            </p>
          </div>
        )}
        <div className="col-span-2">
          <label className="text-xs uppercase tracking-widest mb-1 block" style={{ color: 'var(--color-navy-400)' }}>
            Location
            {knownLocations.length > 0 && (
              <span className="ml-2 normal-case tracking-normal font-normal" style={{ color: 'var(--color-navy-300)' }}>
                — type to filter or pick from previous
              </span>
            )}
          </label>
          <LocationInput
            value={location}
            onChange={setLocation}
            suggestions={knownLocations}
            inputStyle={inputStyle}
          />
        </div>
        <div className="col-span-2">
          <label className="text-xs uppercase tracking-widest mb-1 block" style={{ color: 'var(--color-navy-400)' }}>Notes</label>
          <input value={notes} onChange={e => setNotes(e.target.value)} placeholder="Any notes for this block" style={inputStyle} />
        </div>
      </div>
      <div className="flex gap-2 pt-1">
        <Button size="sm" onClick={() => {
          if (!title.trim() || !startTime) return
          onSave({
            title: title.trim(),
            startTime,
            durationMinutes: parseInt(duration) || 60,
            location: location.trim() || undefined,
            notes: notes.trim() || undefined,
          })
        }} disabled={!title.trim() || !startTime || saving}>
          {saving ? 'Saving…' : 'Save block'}
        </Button>
        <Button size="sm" variant="ghost" onClick={onCancel}>Cancel</Button>
      </div>
    </div>
  )
}

// ── Block display ─────────────────────────────────────────────────

function BlockContent({ block, onEdit, onDelete, deleting }: {
  block: TimelineBlock
  onEdit?: () => void
  onDelete?: () => void
  deleting?: boolean
}) {
  const theme = getTheme(block.title)
  const styles = THEME_STYLES[theme]
  const endTime = block.startTime && block.durationMinutes
    ? addMinutes(block.startTime, block.durationMinutes)
    : null

  return (
    <div
      className="flex items-start gap-5 px-6 py-4 group transition-opacity"
      style={{ background: styles.bg, cursor: 'grab', opacity: deleting ? 0.4 : 1 }}
    >
      <div className="flex flex-col gap-0.5 shrink-0 mt-1.5 opacity-20 group-hover:opacity-50 transition-opacity">
        <div className="w-3 h-px rounded" style={{ background: 'var(--color-navy-500)' }} />
        <div className="w-3 h-px rounded" style={{ background: 'var(--color-navy-500)' }} />
        <div className="w-3 h-px rounded" style={{ background: 'var(--color-navy-500)' }} />
      </div>
      <div className="w-20 shrink-0 text-right flex flex-col gap-0.5">
        <span className="text-sm font-medium" style={{ color: 'var(--color-navy-600)' }}>{to12h(block.startTime)}</span>
        {endTime && <span className="text-xs" style={{ color: 'var(--color-navy-400)' }}>– {to12h(endTime)}</span>}
      </div>
      <div className="w-px self-stretch shrink-0" style={{ background: 'var(--color-navy-200)' }} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium" style={{ color: styles.titleColor }}>{block.title}</p>
        <div className="flex items-center gap-2 mt-1 flex-wrap">
          <span className="text-xs rounded-full px-2 py-0.5" style={{ background: styles.pill, color: styles.pillText }}>
            {block.durationMinutes} min
          </span>
          {block.location && <span className="text-xs" style={{ color: 'var(--color-navy-400)' }}>· {block.location}</span>}
        </div>
        {block.notes && <p className="text-xs italic mt-1" style={{ color: 'var(--color-navy-400)' }}>{block.notes}</p>}
      </div>
      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
        <button onClick={e => { e.stopPropagation(); onEdit?.() }} className="text-xs hover:opacity-70 transition-opacity" style={{ color: 'var(--color-navy-400)' }}>Edit</button>
        <button onClick={e => { e.stopPropagation(); onDelete?.() }} className="text-xs hover:opacity-70 transition-opacity" style={{ color: '#b91c1c' }}>Remove</button>
      </div>
    </div>
  )
}

function SortableBlock({ block, onEdit, onDelete, deleting }: {
  block: TimelineBlock; onEdit: () => void; onDelete: () => void; deleting: boolean
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: block.id })
  return (
    <div ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.3 : 1 }} {...attributes} {...listeners}>
      <BlockContent block={block} onEdit={onEdit} onDelete={onDelete} deleting={deleting} />
    </div>
  )
}

// ── Tab ───────────────────────────────────────────────────────────

interface TimelineTabProps {
  bookingId: string
  initialTimeline?: Timeline
}

export default function TimelineTab({ bookingId, initialTimeline }: TimelineTabProps) {
  const [showAddForm, setShowAddForm]       = useState(false)
  const [editingId, setEditingId]           = useState<string | null>(null)
  const [deletingId, setDeletingId]         = useState<string | null>(null)
  const [draggingBlocks, setDraggingBlocks] = useState<TimelineBlock[] | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const addBlock    = useAddTimelineBlock()
  const updateBlock = useUpdateTimelineBlock()
  const deleteBlock = useDeleteTimelineBlock()

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }))

  const liveBlocks   = initialTimeline?.blocks ?? []
  const blocks       = draggingBlocks ?? liveBlocks
  const sortedBlocks = [...blocks].sort((a, b) => a.startTime.localeCompare(b.startTime))

  // Deduplicated list of locations used in this booking's timeline
  const knownLocations = Array.from(
    new Set(liveBlocks.map(b => b.location).filter((l): l is string => !!l?.trim()))
  )
  // Default for a new block = location of the most recently added block (last in sort order)
  const lastLocation = liveBlocks.length > 0
    ? liveBlocks[liveBlocks.length - 1].location
    : undefined

  function handleDragStart(_e: DragStartEvent) {
    setDraggingBlocks(liveBlocks)
    setEditingId(null)
  }

  function handleDragEnd(e: DragEndEvent) {
    const { active, over } = e
    if (over && active.id !== over.id) {
      const oldIndex = sortedBlocks.findIndex(b => b.id === active.id)
      const newIndex = sortedBlocks.findIndex(b => b.id === over.id)
      const reordered = arrayMove(sortedBlocks, oldIndex, newIndex)
      reordered.forEach((b, i) => {
        if (b.sortOrder !== i) updateBlock.mutate({ bookingId, blockId: b.id, sortOrder: i })
      })
    }
    setDraggingBlocks(null)
  }

  async function handleAdd(data: Omit<TimelineBlock, 'id' | 'timelineId' | 'sortOrder'>) {
    await addBlock.mutateAsync({ bookingId, ...data })
    setShowAddForm(false)
  }

  async function handleEdit(blockId: string, data: Omit<TimelineBlock, 'id' | 'timelineId' | 'sortOrder'>) {
    await updateBlock.mutateAsync({ bookingId, blockId, ...data })
    setEditingId(null)
  }

  async function handleDelete(blockId: string) {
    setDeletingId(blockId)
    await deleteBlock.mutateAsync({ bookingId, blockId })
    setDeletingId(null)
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

      {liveBlocks.length === 0 && !showAddForm ? (
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
                        <BlockForm
                          initial={block}
                          knownLocations={knownLocations}
                          saving={updateBlock.isPending}
                          onSave={data => handleEdit(block.id, data)}
                          onCancel={() => setEditingId(null)}
                        />
                      </div>
                    ) : (
                      <SortableBlock
                        block={block}
                        deleting={deletingId === block.id}
                        onEdit={() => setEditingId(block.id)}
                        onDelete={() => handleDelete(block.id)}
                      />
                    )}
                  </div>
                ))}
              </div>
            </SortableContext>
          </Card>
        </DndContext>
      )}

      {showAddForm ? (
        <BlockForm
          knownLocations={knownLocations}
          defaultLocation={lastLocation}
          saving={addBlock.isPending}
          onSave={handleAdd}
          onCancel={() => setShowAddForm(false)}
        />
      ) : (
        liveBlocks.length > 0 && (
          <Button variant="secondary" size="sm" onClick={() => setShowAddForm(true)}>+ Add block</Button>
        )
      )}
    </div>
  )
}