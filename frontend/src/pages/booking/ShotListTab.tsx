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
import type { ShotListGroup, ShotListItem } from '@/types'

function ShotItemContent({ item }: { item: ShotListItem }) {
  return (
    <div
      className="flex items-center gap-3 px-5 py-3 transition-colors"
      style={{
        background: 'white',
        cursor: 'grab',
      }}
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
      <span className="text-sm flex-1" style={{
        color: item.completed ? 'var(--color-navy-400)' : 'var(--color-navy-700)',
        textDecoration: item.completed ? 'line-through' : 'none',
      }}>
        {item.description}
      </span>
      {item.notes && (
        <span className="text-xs italic shrink-0" style={{ color: 'var(--color-navy-400)' }}>{item.notes}</span>
      )}
    </div>
  )
}

function SortableShotItem({ item }: { item: ShotListItem }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
    data: { item, type: 'item', groupId: item.groupId },
  })

  return (
    <div
      ref={setNodeRef}
      style={{
        // transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.4 : 1,
        transform: isDragging ? CSS.Transform.toString(transform) + ' scale(1.02)' : CSS.Transform.toString(transform),
      }}
      {...attributes}
      {...listeners}
    >
      <ShotItemContent item={item} />
    </div>
  )
}

function ShotGroup({ group, isOver }: { group: ShotListGroup; isOver: boolean }) {
  return (
    <div>
      <h3 className="text-xs uppercase tracking-widest mb-2" style={{ color: 'var(--color-navy-400)' }}>
        {group.name}
      </h3>
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
                    <SortableShotItem item={item} />
                  </div>
                ))}
              </div>
            )}
          </SortableContext>
        </div>
      </Card>
    </div>
  )
}

interface ShotListTabProps {
  bookingId: string
  initialGroups: ShotListGroup[]
}

export default function ShotListTab({ initialGroups }: ShotListTabProps) {
  const [groups, setGroups] = useState<ShotListGroup[]>(initialGroups)
  const [activeItemId, setActiveItemId] = useState<UniqueIdentifier | null>(null)
  const [overGroupId, setOverGroupId] = useState<string | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  )

  function findGroupByItemId(itemId: UniqueIdentifier): ShotListGroup | undefined {
    return groups.find(g => g.items.some(i => i.id === itemId))
  }

  function handleDragStart(event: DragStartEvent) {
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
      setGroups(prev => {
        const item = activeGroup.items.find(i => i.id === active.id)!
        return prev.map(g => {
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
      setGroups(prev => prev.map(g => {
        if (g.id !== activeGroup.id) return g
        const oldIndex = g.items.findIndex(i => i.id === active.id)
        const newIndex = g.items.findIndex(i => i.id === over.id)
        return { ...g, items: arrayMove(g.items, oldIndex, newIndex) }
      }))
    } else {
      setGroups(prev => {
        const item = activeGroup.items.find(i => i.id === active.id)!
        const updatedItem = { ...item, groupId: overGroup2.id }
        return prev.map(g => {
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

  function handleDragEnd() {
    setActiveItemId(null)
    setOverGroupId(null)
  }

  function handleDragCancel() {
    setActiveItemId(null)
    setOverGroupId(null)
  }

  const total = groups.flatMap(g => g.items).length
  const done = groups.flatMap(g => g.items).filter(i => i.completed).length

  if (groups.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="font-display italic text-lg" style={{ color: 'var(--color-navy-400)' }}>No shot list yet</p>
        <Button className="mt-4" size="sm">+ Add group</Button>
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
            <ShotGroup key={group.id} group={group} isOver={overGroupId === group.id} />
          ))}
        </div>

      </DndContext>

      <div className="mt-4">
        <Button variant="secondary" size="sm">+ Add group</Button>
      </div>
    </div>
  )
}