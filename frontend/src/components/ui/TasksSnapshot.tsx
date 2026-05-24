import type { Task } from '@/types'

interface TasksSnapshotProps {
  bookingId: string
  tasks: Task[]
}

export function TasksSnapshot({ tasks }: TasksSnapshotProps) {
  const outstanding = tasks.filter(t => !t.completed)
  const overdue = outstanding.filter(t => t.dueDate && new Date(t.dueDate) < new Date())

  if (outstanding.length === 0) {
    return (
      <span className="text-xs" style={{ color: '#276840' }}>
        ✓ All tasks complete
      </span>
    )
  }

  return (
    <div className="flex items-center gap-3 flex-wrap">
      {overdue.length > 0 && (
        <span
          className="text-[11px] font-medium px-2 py-0.5 rounded"
          style={{ background: '#fef3e2', color: 'var(--color-gold-warm)' }}
        >
          ⚠ {overdue.length} overdue
        </span>
      )}
      <span className="text-xs" style={{ color: 'var(--color-navy-400)' }}>
        {outstanding.length} task{outstanding.length !== 1 ? 's' : ''} remaining
      </span>
      <span style={{ color: 'var(--color-navy-200)' }}>·</span>
      {outstanding.slice(0, 2).map(task => (
        <span key={task.id} className="text-xs" style={{ color: 'var(--color-navy-500)' }}>
          {task.title}
          {task.dueDate && (
            <span style={{ color: 'var(--color-navy-300)' }}>
              {' '}due {new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </span>
          )}
        </span>
      ))}
      {outstanding.length > 2 && (
        <span className="text-xs" style={{ color: 'var(--color-navy-300)' }}>+{outstanding.length - 2} more</span>
      )}
    </div>
  )
}