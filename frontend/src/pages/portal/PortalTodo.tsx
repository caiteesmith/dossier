import type { BookingDetail } from '@/types'

interface Props { booking: BookingDetail }

export default function PortalTodo({ booking }: Props) {
  const { tasks } = booking

  // Only show tasks meant for the couple
  const clientTasks = tasks.filter(t => t.category === 'client')
  const completed = clientTasks.filter(t => t.completed).length
  const total = clientTasks.length
  const progress = total > 0 ? Math.round((completed / total) * 100) : 0

  return (
    <div>
      <div style={{ marginBottom: '28px' }}>
        <h2 style={{ fontFamily: 'Georgia, serif', fontSize: '22px', fontStyle: 'italic', color: '#1a1a2e', marginBottom: '6px' }}>
          Wedding checklist
        </h2>
        <p style={{ fontSize: '13px', color: '#888', lineHeight: '1.5' }}>
          Items that need your attention before the wedding day.
        </p>
      </div>

      {/* Progress bar */}
      <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e8e4de', padding: '20px 24px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <span style={{ fontSize: '13px', fontWeight: 500, color: '#333' }}>Your progress</span>
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
            🎉 You're all set — everything is taken care of!
          </p>
        )}
      </div>

      {/* Task list */}
      {clientTasks.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px 0' }}>
          <p style={{ fontFamily: 'Georgia, serif', fontSize: '18px', fontStyle: 'italic', color: '#aaa' }}>
            Nothing to do yet
          </p>
          <p style={{ fontSize: '13px', color: '#bbb', marginTop: '8px' }}>
            Your photographer will add items here as your wedding approaches.
          </p>
        </div>
      ) : (
        <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #c5d0e8', overflow: 'hidden' }}>
          {clientTasks.map((task, i) => (
            <div
              key={task.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '14px 20px',
                borderTop: i === 0 ? 'none' : '1px solid #f0ede8',
                background: !task.completed ? '#fafbff' : 'transparent',
              }}
            >
              <div style={{
                width: '20px',
                height: '20px',
                borderRadius: '50%',
                border: `2px solid ${task.completed ? '#276840' : '#5483a8'}`,
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
              {task.completed
                ? <span style={{ fontSize: '11px', color: '#276840', flexShrink: 0 }}>Done ✓</span>
                : <span style={{ fontSize: '11px', color: '#5483a8', flexShrink: 0 }}>Pending</span>
              }
            </div>
          ))}
        </div>
      )}
    </div>
  )
}