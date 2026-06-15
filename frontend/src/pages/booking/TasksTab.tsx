import { useState } from 'react'
import { Card } from '@/components/ui'
import { useBookingDetail, useToggleTask, useUpdateTask, useDeleteTask } from '@/hooks/useData'
import AddTaskForm from '@/components/forms/AddTaskForm'
import type { TaskCategory } from '@/types'

const CATEGORIES: { value: TaskCategory; label: string }[] = [
  { value: 'admin',        label: 'Studio admin' },
  { value: 'client',       label: 'Client action' },
  { value: 'day_of',       label: 'Day of' },
  { value: 'post_wedding', label: 'Post-wedding' },
  { value: 'manual',       label: 'Other' },
]

const taskInputStyle = {
  background: 'var(--color-fog)',
  border: '1px solid var(--color-navy-100)',
  borderRadius: '6px',
  padding: '5px 8px',
  fontSize: '13px',
  color: 'var(--color-navy-800)',
  outline: 'none',
  fontFamily: 'inherit',
  width: '100%',
  boxSizing: 'border-box' as const,
}

function EditTaskForm({ task, bookingId, onClose }: {
  task: { id: string; title: string; category: string; dueDate?: string | null }
  bookingId: string
  onClose: () => void
}) {
  const updateTask = useUpdateTask()
  const [title, setTitle] = useState(task.title)
  const [category, setCategory] = useState(task.category as TaskCategory)
  const [dueDate, setDueDate] = useState(task.dueDate ?? '')

  function handleSave() {
    if (!title.trim()) return
    updateTask.mutate(
      { bookingId, taskId: task.id, title: title.trim(), category, dueDate: dueDate || null },
      { onSuccess: onClose }
    )
  }

  return (
    <div className="flex items-center gap-2 px-5 py-2" style={{ background: 'var(--color-navy-50)' }}>
      <input
        value={title}
        onChange={e => setTitle(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') onClose() }}
        style={{ ...taskInputStyle, flex: 1 }}
        autoFocus
      />
      <select
        value={category}
        onChange={e => setCategory(e.target.value as TaskCategory)}
        style={{ ...taskInputStyle, width: 'auto', cursor: 'pointer' }}
      >
        {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
      </select>
      <input
        type="date"
        value={dueDate}
        onChange={e => setDueDate(e.target.value)}
        style={{ ...taskInputStyle, width: 'auto' }}
      />
      <button
        onClick={handleSave}
        disabled={updateTask.isPending}
        style={{ fontSize: '12px', fontWeight: 600, color: 'white', background: 'var(--color-navy-800)', border: 'none', borderRadius: '6px', padding: '5px 12px', cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}
      >
        {updateTask.isPending ? 'Saving…' : 'Save'}
      </button>
      <button
        onClick={onClose}
        style={{ fontSize: '12px', color: 'var(--color-navy-400)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
      >
        Cancel
      </button>
    </div>
  )
}

export function TasksTab({ bookingId }: { bookingId: string }) {
  const { data } = useBookingDetail(bookingId)
  const toggleTask = useToggleTask()
  const deleteTask = useDeleteTask()
  const [showAdd, setShowAdd] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  if (!data) return null

  const categoryOrder = ['admin', 'client', 'day_of', 'post_wedding', 'manual'] as const
  const categoryLabels: Record<string, string> = {
    admin: 'Studio admin', client: 'Client action', day_of: 'Day of',
    post_wedding: 'Post-wedding', manual: 'Other',
  }

  async function handleDelete(taskId: string) {
    setDeletingId(taskId)
    await deleteTask.mutateAsync({ bookingId, taskId })
    setDeletingId(null)
  }

  return (
    <div className="space-y-6">
      {categoryOrder.map(cat => {
        const tasks = data.tasks.filter(t => t.category === cat)
        if (tasks.length === 0) return null
        return (
          <div key={cat}>
            <h3 className="text-xs uppercase tracking-widest mb-3" style={{ color: 'var(--color-navy-400)' }}>
              {categoryLabels[cat]}
            </h3>
            <Card>
              <div>
                {tasks.map((task, i) => (
                  <div key={task.id} style={{ borderTop: i === 0 ? 'none' : '1px solid var(--color-navy-100)' }}>
                    {editingId === task.id ? (
                      <EditTaskForm
                        task={task}
                        bookingId={bookingId}
                        onClose={() => setEditingId(null)}
                      />
                    ) : (
                      <div
                        className="flex items-center gap-3 px-5 py-3.5 group transition-opacity"
                        style={{ opacity: deletingId === task.id ? 0.4 : 1 }}
                      >
                        <input
                          type="checkbox"
                          checked={task.completed}
                          onChange={e => toggleTask.mutate({ bookingId, taskId: task.id, completed: e.target.checked })}
                          className="w-4 h-4 rounded shrink-0"
                        />
                        <span
                          className="text-sm flex-1"
                          style={{
                            color: task.completed ? 'var(--color-navy-400)' : 'var(--color-navy-800)',
                            textDecoration: task.completed ? 'line-through' : 'none',
                          }}
                        >
                          {task.title}
                        </span>
                        {task.dueDate && (
                          <span className="text-xs shrink-0" style={{ color: 'var(--color-navy-400)' }}>
                            due {new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </span>
                        )}
                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                          <button
                            onClick={() => setEditingId(task.id)}
                            className="text-xs hover:opacity-70 transition-opacity"
                            style={{ color: 'var(--color-navy-400)' }}
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(task.id)}
                            className="text-xs hover:opacity-70 transition-opacity"
                            style={{ color: '#b91c1c' }}
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )
      })}
      {showAdd
        ? <AddTaskForm bookingId={bookingId} onClose={() => setShowAdd(false)} />
        : <button onClick={() => setShowAdd(true)} style={{ fontSize: '13px', color: 'var(--color-navy-400)', background: 'none', border: '1px dashed var(--color-navy-200)', borderRadius: '8px', padding: '8px 16px', cursor: 'pointer', fontFamily: 'inherit', width: '100%' }}>+ Add task</button>
      }
    </div>
  )
}