import { useState, useRef } from 'react'
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragOverEvent,
  DragEndEvent,
  closestCorners,
  UniqueIdentifier,
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
import { useDeleteShotGroup, useDeleteShotItem, useAddShotItem, useUpdateShotItem } from '@/hooks/useData'
import type { ShotListGroup, ShotListItem } from '@/types'

function TrashIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M1.75 3.5h10.5M5.25 3.5V2.333a.583.583 0 0 1 .583-.583h2.334a.583.583 0 0 1 .583.583V3.5M11.083 3.5l-.583 7.583a.583.583 0 0 1-.583.584H4.083a.583.583 0 0 1-.583-.584L2.917 3.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

function ShotItemContent({
  item,
  bookingId,
  isDragging,
}: {
  item: ShotListItem
  bookingId: string
  isDragging: boolean
}) {
  const deleteItem = useDeleteShotItem()
  const updateItem = useUpdateShotItem()
  const [editing, setEditing] = useState(false)
  const [editVal, setEditVal] = useState(item.description)

  function handleDelete(e: React.MouseEvent) {
    e.stopPropagation()
    if (!confirm(`Delete "${item.description}"?`)) return
    deleteItem.mutate({ bookingId, groupId: item.groupId, itemId: item.id })
  }

  function handleEditCommit() {
    if (editVal.trim() && editVal.trim() !== item.description) {
      updateItem.mutate({ bookingId, groupId: item.groupId, itemId: item.id, description: editVal.trim() })
    }
    setEditing(false)
  }

  if (editing) {
    return (
      <div className="flex items-center gap-2 px-5 py-2" style={{ background: 'var(--color-navy-50)' }}
        onPointerDown={e => e.stopPropagation()}>
        <input
          value={editVal}
          onChange={e => setEditVal(e.target.value)}
          onBlur={handleEditCommit}
          onKeyDown={e => { if (e.key === 'Enter') handleEditCommit(); if (e.key === 'Escape') setEditing(false) }}
          autoFocus
          style={{
            flex: 1, fontSize: '13px', border: 'none', borderBottom: '1px solid var(--color-navy-300)',
            outline: 'none', background: 'transparent', fontFamily: 'inherit',
            color: 'var(--color-navy-800)', padding: '4px 0',
          }}
        />
        <button onClick={handleEditCommit} style={{ fontSize: '11px', color: 'var(--color-steel-500)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>Save</button>
        <button onClick={() => setEditing(false)} style={{ fontSize: '11px', color: 'var(--color-navy-400)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
      </div>
    )
  }

  return (
    <div
      className="flex items-center gap-3 px-5 py-3 transition-colors group"
      style={{ background: 'white', cursor: isDragging ? 'grabbing' : 'grab' }}
    >
      <div className="flex flex-col gap-0.5 shrink-0 opacity-30">
        <div className="w-3 h-px rounded" style={{ background: 'var(--color-navy-500)' }} />
        <div className="w-3 h-px rounded" style={{ background: 'var(--color-navy-500)' }} />
        <div className="w-3 h-px rounded" style={{ background: 'var(--color-navy-500)' }} />
      </div>
      <input
        type="checkbox"
        checked={item.completed}
        onChange={() => {}}
        onClick={e => e.stopPropagation()}
        className="w-4 h-4 rounded shrink-0"
      />
      <span
        className="text-sm flex-1"
        onDoubleClick={e => { e.stopPropagation(); setEditing(true); setEditVal(item.description) }}
        style={{
          color: item.completed ? 'var(--color-navy-400)' : 'var(--color-navy-700)',
          textDecoration: item.completed ? 'line-through' : 'none',
        }}
      >
        {item.description}
      </span>
      {item.notes && (
        <span className="text-xs italic shrink-0" style={{ color: 'var(--color-navy-400)' }}>{item.notes}</span>
      )}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
        <button
          onClick={e => { e.stopPropagation(); setEditing(true); setEditVal(item.description) }}
          onPointerDown={e => e.stopPropagation()}
          className="p-1 rounded text-xs hover:bg-gray-50"
          style={{ color: 'var(--color-navy-400)' }}
          title="Edit shot"
        >
          Edit
        </button>
        <button
          onClick={handleDelete}
          onPointerDown={e => e.stopPropagation()}
          className="p-1 rounded hover:bg-red-50"
          style={{ color: 'var(--color-navy-300)' }}
          title="Delete shot"
        >
          <TrashIcon />
        </button>
      </div>
    </div>
  )
}

function SortableShotItem({ item, bookingId }: { item: ShotListItem; bookingId: string }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
    data: { item, type: 'item', groupId: item.groupId },
  })

  return (
    <div
      ref={setNodeRef}
      style={{
        transition,
        opacity: isDragging ? 0.4 : 1,
        transform: isDragging ? CSS.Transform.toString(transform) + ' scale(1.02)' : CSS.Transform.toString(transform),
      }}
      {...attributes}
      {...listeners}
    >
      <ShotItemContent item={item} bookingId={bookingId} isDragging={isDragging} />
    </div>
  )
}

function ShotGroup({
  group,
  bookingId,
  isOver,
}: {
  group: ShotListGroup
  bookingId: string
  isOver: boolean
}) {
  const deleteGroup = useDeleteShotGroup()
  const addItem = useAddShotItem()
  const [showAddItem, setShowAddItem] = useState(false)
  const [newItemVal, setNewItemVal] = useState('')

  function handleDeleteGroup(e: React.MouseEvent) {
    e.stopPropagation()
    if (!confirm(`Delete group "${group.name}" and all its shots?`)) return
    deleteGroup.mutate({ bookingId, groupId: group.id })
  }

  function handleAddItem() {
    if (!newItemVal.trim()) return
    addItem.mutate({ bookingId, groupId: group.id, description: newItemVal.trim() }, {
      onSuccess: () => { setNewItemVal(''); setShowAddItem(false) }
    })
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-xs uppercase tracking-widest" style={{ color: 'var(--color-navy-400)' }}>
          {group.name}
        </h3>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAddItem(s => !s)}
            className="text-xs opacity-40 hover:opacity-100 transition-opacity px-2 py-1 rounded hover:bg-gray-50"
            style={{ color: 'var(--color-navy-500)', fontFamily: 'inherit' }}
          >
            + Add shot
          </button>
          <button
            onClick={handleDeleteGroup}
            className="p-1 rounded opacity-40 hover:opacity-100 hover:bg-red-50 transition-opacity"
            style={{ color: 'var(--color-navy-400)' }}
            title="Delete group"
          >
            <TrashIcon />
          </button>
        </div>
      </div>
      <Card>
        <div
          className="min-h-12 transition-colors rounded-xl overflow-hidden"
          style={{ background: isOver ? 'var(--color-navy-50)' : 'transparent' }}
        >
          <SortableContext items={group.items.map(i => i.id)} strategy={verticalListSortingStrategy}>
            {group.items.length === 0 ? (
              <div className="flex items-center justify-center h-12" style={{ color: isOver ? 'var(--color-steel-500)' : 'var(--color-navy-300)' }}>
                <span className="text-xs">{isOver ? 'Drop here' : 'No shots yet'}</span>
              </div>
            ) : (
              <div>
                {group.items.map((item, i) => (
                  <div key={item.id} style={{ borderTop: i === 0 ? 'none' : '1px solid var(--color-navy-100)' }}>
                    <SortableShotItem item={item} bookingId={bookingId} />
                  </div>
                ))}
              </div>
            )}
          </SortableContext>
        </div>
        {showAddItem && (
          <div className="flex items-center gap-2 px-4 py-2 border-t" style={{ borderColor: 'var(--color-navy-100)', background: 'var(--color-navy-50)' }}>
            <input
              value={newItemVal}
              onChange={e => setNewItemVal(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleAddItem(); if (e.key === 'Escape') setShowAddItem(false) }}
              placeholder="Shot description..."
              autoFocus
              style={{
                flex: 1, fontSize: '13px', border: 'none', borderBottom: '1px solid var(--color-navy-300)',
                outline: 'none', background: 'transparent', fontFamily: 'inherit',
                color: 'var(--color-navy-800)', padding: '4px 0',
              }}
            />
            <button
              onClick={handleAddItem}
              disabled={addItem.isPending || !newItemVal.trim()}
              style={{ fontSize: '12px', fontWeight: 600, color: 'white', background: 'var(--color-navy-800)', border: 'none', borderRadius: '6px', padding: '4px 12px', cursor: 'pointer', fontFamily: 'inherit' }}
            >
              {addItem.isPending ? '...' : 'Add'}
            </button>
            <button onClick={() => setShowAddItem(false)} style={{ fontSize: '12px', color: 'var(--color-navy-400)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
          </div>
        )}
      </Card>
    </div>
  )
}

interface ShotListTabProps {
  bookingId: string
  initialGroups: ShotListGroup[]
  onAddGroup?: () => void
}

export default function ShotListTab({ bookingId, initialGroups, onAddGroup }: ShotListTabProps) {
  // draggingGroups is only non-null while a drag is in progress.
  // Otherwise we fall through to initialGroups (the live TanStack Query data),
  // so newly added groups appear without a refresh.
  const updateItemOrder = useUpdateShotItem()
  const [draggingGroups, setDraggingGroups] = useState<ShotListGroup[] | null>(null)
  const [activeItemId, setActiveItemId] = useState<UniqueIdentifier | null>(null)
  const [overGroupId, setOverGroupId] = useState<string | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const groups = draggingGroups ?? initialGroups

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  )

  function findGroupByItemId(itemId: UniqueIdentifier): ShotListGroup | undefined {
    return groups.find(g => g.items.some(i => i.id === itemId))
  }

  function handleDragStart(event: DragStartEvent) {
    // Snapshot current data into draggingGroups so we can mutate it freely
    setDraggingGroups(initialGroups)
    setActiveItemId(event.active.id)
  }

  function handleDragOver(event: DragOverEvent) {
    const { active, over } = event
    if (!over) { setOverGroupId(null); return }

    const activeGroup = findGroupByItemId(active.id)
    if (!activeGroup) return

    const overGroup = groups.find(g => g.id === over.id)
    if (overGroup) {
      setOverGroupId(overGroup.id)
      if (overGroup.id === activeGroup.id) return
      setDraggingGroups(prev => {
        const src = (prev ?? initialGroups)
        const item = activeGroup.items.find(i => i.id === active.id)!
        return src.map(g => {
          if (g.id === activeGroup.id) return { ...g, items: g.items.filter(i => i.id !== active.id) }
          if (g.id === overGroup.id) return { ...g, items: [...g.items, { ...item, groupId: g.id }] }
          return g
        })
      })
      return
    }

    const overGroup2 = findGroupByItemId(over.id)
    if (!overGroup2) return
    setOverGroupId(overGroup2.id)

    if (activeGroup.id === overGroup2.id) {
      setDraggingGroups(prev => (prev ?? initialGroups).map(g => {
        if (g.id !== activeGroup.id) return g
        const oldIndex = g.items.findIndex(i => i.id === active.id)
        const newIndex = g.items.findIndex(i => i.id === over.id)
        return { ...g, items: arrayMove(g.items, oldIndex, newIndex) }
      }))
    } else {
      setDraggingGroups(prev => {
        const src = prev ?? initialGroups
        const item = activeGroup.items.find(i => i.id === active.id)!
        const updatedItem = { ...item, groupId: overGroup2.id }
        return src.map(g => {
          if (g.id === activeGroup.id) return { ...g, items: g.items.filter(i => i.id !== active.id) }
          if (g.id === overGroup2.id) {
            const overIndex = g.items.findIndex(i => i.id === over.id)
            const newItems = [...g.items]
            newItems.splice(overIndex, 0, updatedItem)
            return { ...g, items: newItems }
          }
          return g
        })
      })
    }
  }

  function handleDragEnd(_event: DragEndEvent) {
    if (draggingGroups) {
      const mutations: Promise<any>[] = []

      draggingGroups.forEach(group => {
        group.items.forEach((item, idx) => {
          const originalGroup = initialGroups.find(g => g.items.some(i => i.id === item.id))
          const originalIdx = originalGroup?.items.findIndex(i => i.id === item.id) ?? -1
          const movedGroup = originalGroup?.id !== group.id
          const movedPosition = originalIdx !== idx

          if (movedGroup || movedPosition) {
            mutations.push(
              updateItemOrder.mutateAsync({
                bookingId,
                groupId: group.id,
                itemId: item.id,
                sortOrder: idx,
                ...(movedGroup && { newGroupId: group.id }),
              })
            )
          }
        })
      })

      // Only clear draggingGroups after all saves complete so UI doesn't snap back
      Promise.all(mutations).finally(() => {
        setDraggingGroups(null)
        setActiveItemId(null)
        setOverGroupId(null)
      })
    } else {
      setDraggingGroups(null)
      setActiveItemId(null)
      setOverGroupId(null)
    }
  }

  function handleDragCancel() {
    setDraggingGroups(null)
    setActiveItemId(null)
    setOverGroupId(null)
  }

  const total = groups.flatMap(g => g.items).length
  const done = groups.flatMap(g => g.items).filter(i => i.completed).length

  if (groups.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="font-display italic text-lg" style={{ color: 'var(--color-navy-400)' }}>No shot list yet</p>
        <Button className="mt-4" size="sm" onClick={onAddGroup}>+ Add group</Button>
      </div>
    )
  }

  return (
    <div ref={containerRef}>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        measuring={{ droppable: { strategy: MeasuringStrategy.Always } }}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        <div className="space-y-4">
          <div className="flex items-center gap-3 text-sm" style={{ color: 'var(--color-navy-500)' }}>
            <span>{total} shots across {groups.length} groups</span>
            {done > 0 && <span style={{ color: '#276840' }}>· {done} captured</span>}
          </div>

          {groups.map(group => (
            <ShotGroup key={group.id} group={group} bookingId={bookingId} isOver={overGroupId === group.id} />
          ))}
        </div>
      </DndContext>

      <div className="mt-4">
        <Button variant="secondary" size="sm" onClick={onAddGroup}>+ Add group</Button>
      </div>
    </div>
  )
}