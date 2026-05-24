import type { BookingDetail } from '@/types'

interface Props { booking: BookingDetail }

const categoryLabels: Record<string, string> = {
  admin: 'Studio',
  client: 'Your action needed',
  day_of: 'Day of',
  post_wedding: 'After the wedding',
  manual: 'Other',
}

const categoryOrder = ['client', 'admin', 'day_of', 'post_wedding', 'manual']

export default function PortalTodo({ booking }: Props) {
  const { tasks } = booking

  const completed = tasks.filter(t => t.completed).length
  const total = tasks.length
  const progress = total > 0 ? Math.round((completed / total) * 100) : 0

  const grouped = categoryOrder.reduce((acc, cat) => {
    const catTasks = tasks.filter(t => t.category === cat)
    if (catTasks.length > 0) acc[cat] = catTasks
    return acc
  }, {} as Record<string, typeof tasks>)

  return (
    <div>
      <div style={{ marginBottom: '28px' }}>
        <h2 style={{ fontFamily: 'Georgia, serif', fontSize: '22px', fontStyle: 'italic', color: '#1a1a2e', marginBottom: '6px' }}>
          Wedding checklist
        </h2>
        <p style={{ fontSize: '13px', color: '#888', lineHeight: '1.5' }}>
          Here's where things stand for your wedding. Tasks marked as "Your action needed" are waiting on you — everything else your photographer is handling behind the scenes.
        </p>
      </div>

      {/* Progress bar */}
      <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e8e4de', padding: '20px 24px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <span style={{ fontSize: '13px', fontWeight: 500, color: '#333' }}>Overall progress</span>
          <span style={{ fontSize: '13px', color: '#888' }}>{completed} of {total} complete</span>
        </div>
        <div style={{ background: '#f0ede8', borderRadius: '999px', height: '6px', overflow: 'hidden' }}>
          <div style={{
            background: progress === 100 ? '#276840' : '#0d1525',
            height: '100%',
            width: `${progress}%`,
            borderRadius: '999px',
            transition: 'width 0.5s ease',
          }} />
        </div>
        {progress === 100 && (
          <p style={{ fontSize: '12px', color: '#276840', marginTop: '8px', fontWeight: 500 }}>
            🎉 Everything is taken care of — you're all set!
          </p>
        )}
      </div>

      {/* Task groups */}
      {Object.entries(grouped).map(([cat, catTasks]) => (
        <div key={cat} style={{ marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <h3 style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em', color: cat === 'client' ? '#3a5278' : '#aaa', fontWeight: 600, margin: 0 }}>
              {categoryLabels[cat]}
            </h3>
            {cat === 'client' && (
              <span style={{ fontSize: '10px', background: '#e8ecf3', color: '#3a5278', padding: '2px 8px', borderRadius: '20px', fontWeight: 500 }}>
                Action needed
              </span>
            )}
          </div>
          <div style={{ background: 'white', borderRadius: '12px', border: `1px solid ${cat === 'client' ? '#c5d0e8' : '#e8e4de'}`, overflow: 'hidden' }}>
            {catTasks.map((task, i) => (
              <div
                key={task.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '14px 20px',
                  borderTop: i === 0 ? 'none' : '1px solid #f0ede8',
                  background: cat === 'client' && !task.completed ? '#fafbff' : 'transparent',
                }}
              >
                <div style={{
                  width: '20px',
                  height: '20px',
                  borderRadius: '50%',
                  border: `2px solid ${task.completed ? '#276840' : cat === 'client' ? '#5483a8' : '#ddd'}`,
                  background: task.completed ? '#276840' : 'transparent',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  {task.completed && (
                    <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                      <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </div>
                <div style={{ flex: 1 }}>
                  <span style={{
                    fontSize: '14px',
                    color: task.completed ? '#aaa' : '#1a1a2e',
                    textDecoration: task.completed ? 'line-through' : 'none',
                  }}>
                    {task.title}
                  </span>
                  {task.dueDate && !task.completed && (
                    <span style={{ fontSize: '12px', color: new Date(task.dueDate) < new Date() ? '#b91c1c' : '#aaa', marginLeft: '8px' }}>
                      due {new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                  )}
                </div>
                {task.completed && task.completedAt && (
                  <span style={{ fontSize: '11px', color: '#276840', flexShrink: 0 }}>Done ✓</span>
                )}
                {!task.completed && cat === 'client' && (
                  <span style={{ fontSize: '11px', color: '#5483a8', flexShrink: 0 }}>Pending</span>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}