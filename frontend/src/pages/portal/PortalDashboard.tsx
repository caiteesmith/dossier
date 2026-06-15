import type { BookingDetail } from '@/types'

interface Props {
  booking: BookingDetail
  onNavigate: (tab: string) => void
}

function formatDate(dateStr: string) {
  const [year, month, day] = dateStr.split('-').map(Number)
  return new Date(year, month - 1, day).toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
  })
}

function daysUntil(dateStr: string) {
  const [year, month, day] = dateStr.split('-').map(Number)
  return Math.ceil((new Date(year, month - 1, day).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
}

function to12h(hhmm: string): string {
  if (!hhmm) return hhmm
  const [h, m] = hhmm.split(':').map(Number)
  const ampm = h < 12 ? 'am' : 'pm'
  const hour = h % 12 === 0 ? 12 : h % 12
  return `${hour}:${String(m).padStart(2, '0')}${ampm}`
}

function addMinutes(hhmm: string, minutes: number): string {
  const [h, m] = hhmm.split(':').map(Number)
  const total = h * 60 + m + minutes
  return `${String(Math.floor(total / 60) % 24).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`
}

function addDays(dateStr: string, days: number) {
  const [y, m, d] = dateStr.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  date.setDate(date.getDate() + days)
  return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
}

const card: React.CSSProperties = {
  background: 'white',
  borderRadius: '14px',
  border: '1px solid #e8e4de',
  overflow: 'hidden',
}

const sectionTitle: React.CSSProperties = {
  fontFamily: 'Georgia, serif',
  fontSize: '18px',
  fontStyle: 'italic',
  color: '#1a1a2e',
  marginBottom: '2px',
}

const sectionHint: React.CSSProperties = {
  fontSize: '12px',
  color: '#aaa',
  marginBottom: '14px',
}

const viewAll: React.CSSProperties = {
  fontSize: '12px',
  color: '#5483a8',
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  fontFamily: 'inherit',
  padding: 0,
  textDecoration: 'none',
}

export default function PortalDashboard({ booking, onNavigate }: Props) {
  const days = daysUntil(booking.weddingDate)
  const isPast = days < 0

  const completedTasks = booking.tasks.filter(t => t.completed).length
  const totalTasks = booking.tasks.length
  const clientTasks = booking.tasks.filter(t => t.category === 'client' && !t.completed)
  const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

  const upcomingBlocks = booking.timeline?.blocks
    .filter(b => b.startTime)
    .sort((a, b) => a.startTime.localeCompare(b.startTime))
    .slice(0, 4) ?? []

  const keyMoments = ['ceremony', 'reception', 'cocktail', 'first dance', 'dinner', 'cake']
  const highlightBlocks = upcomingBlocks.filter(b =>
    keyMoments.some(k => b.title.toLowerCase().includes(k))
  ).slice(0, 3)
  const timelinePreview = highlightBlocks.length > 0 ? highlightBlocks : upcomingBlocks.slice(0, 3)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

      {/* ── Countdown hero ──────────────────────────────────────── */}
      <div style={{
        ...card,
        background: '#0d1525',
        padding: '28px 28px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '24px',
      }}>
        <div>
          <p style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.4)', marginBottom: '6px' }}>
            {isPast ? 'You were married on' : 'Your wedding day'}
          </p>
          <p style={{ fontFamily: 'Georgia, serif', fontSize: '20px', fontStyle: 'italic', color: 'white', marginBottom: '4px' }}>
            {formatDate(booking.weddingDate)}
          </p>
          <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)' }}>
            📍 {booking.venueName}{booking.venueAddress ? ` · ${booking.venueAddress}` : ''}
          </p>
        </div>
        {!isPast && (
          <div style={{ textAlign: 'center', flexShrink: 0 }}>
            <p style={{ fontFamily: 'Georgia, serif', fontSize: '48px', fontStyle: 'italic', color: '#f5c842', lineHeight: 1, marginBottom: '4px' }}>
              {days === 0 ? '🎉' : days}
            </p>
            <p style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.4)' }}>
              {days === 0 ? 'Today!' : days === 1 ? 'day to go' : 'days to go'}
            </p>
          </div>
        )}
      </div>

      {/* ── Package details ─────────────────────────────────────── */}
      {(booking.packageName || booking.hoursCovered || booking.packagePrice) && (
        <div style={{ ...card, padding: '20px 24px' }}>
          <p style={sectionTitle}>Your package</p>
          <p style={sectionHint}>What's included in your booking</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '16px' }}>
            {booking.packageName && (
              <div>
                <p style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#aaa', marginBottom: '4px' }}>Package</p>
                <p style={{ fontSize: '15px', fontWeight: 600, color: '#1a1a2e' }}>{booking.packageName}</p>
              </div>
            )}
            {booking.hoursCovered && (
              <div>
                <p style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#aaa', marginBottom: '4px' }}>Coverage</p>
                <p style={{ fontSize: '15px', fontWeight: 600, color: '#1a1a2e' }}>{booking.hoursCovered} hours</p>
              </div>
            )}
            {booking.packagePrice && (
              <div>
                <p style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#aaa', marginBottom: '4px' }}>Investment</p>
                <p style={{ fontSize: '15px', fontWeight: 600, color: '#1a1a2e' }}>${booking.packagePrice.toLocaleString()}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Action items ─────────────────────────────────────────── */}
      {clientTasks.length > 0 && (
        <div style={card}>
          <div style={{ padding: '18px 20px 14px', borderBottom: '1px solid #f0ede8', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={sectionTitle}>Action needed</p>
              <p style={{ fontSize: '12px', color: '#e57f2f', marginTop: '2px' }}>
                {clientTasks.length} item{clientTasks.length !== 1 ? 's' : ''} waiting on you
              </p>
            </div>
            <button onClick={() => onNavigate('checklist')} style={viewAll}>View all →</button>
          </div>
          <div>
            {clientTasks.slice(0, 4).map((task, i) => (
              <div key={task.id} style={{
                padding: '12px 20px',
                borderTop: i === 0 ? 'none' : '1px solid #f7f5f2',
                display: 'flex', alignItems: 'center', gap: '10px',
              }}>
                <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#e57f2f', flexShrink: 0 }} />
                <p style={{ fontSize: '14px', color: '#1a1a2e' }}>{task.title}</p>
              </div>
            ))}
            {clientTasks.length > 4 && (
              <div style={{ padding: '10px 20px', borderTop: '1px solid #f7f5f2' }}>
                <button onClick={() => onNavigate('checklist')} style={{ ...viewAll, fontSize: '13px' }}>
                  +{clientTasks.length - 4} more items →
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Progress ─────────────────────────────────────────────── */}
      {totalTasks > 0 && (
        <div style={{ ...card, padding: '20px 24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <p style={sectionTitle}>Planning progress</p>
            <button onClick={() => onNavigate('checklist')} style={viewAll}>See checklist →</button>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ flex: 1, background: '#f0ede8', borderRadius: '999px', height: '8px' }}>
              <div style={{
                background: progress === 100 ? '#4ade80' : '#0d1525',
                height: '100%',
                width: `${progress}%`,
                borderRadius: '999px',
                transition: 'width 0.5s ease',
              }} />
            </div>
            <span style={{ fontSize: '13px', fontWeight: 500, color: '#1a1a2e', flexShrink: 0 }}>
              {completedTasks}/{totalTasks}
            </span>
          </div>
          <p style={{ fontSize: '12px', color: '#aaa', marginTop: '8px' }}>
            {progress === 100 ? '🎉 All done!' : `${100 - progress}% left to complete`}
          </p>
        </div>
      )}

      {/* ── Timeline preview ─────────────────────────────────────── */}
      {timelinePreview.length > 0 && (
        <div style={card}>
          <div style={{ padding: '18px 20px 14px', borderBottom: '1px solid #f0ede8', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={sectionTitle}>Day-of schedule</p>
              <p style={{ fontSize: '12px', color: '#aaa', marginTop: '2px' }}>Key moments from your timeline</p>
            </div>
            <button onClick={() => onNavigate('timeline')} style={viewAll}>Full timeline →</button>
          </div>
          <div>
            {timelinePreview.map((block, i) => {
              const endTime = block.durationMinutes ? addMinutes(block.startTime, block.durationMinutes) : null
              const isCeremony = block.title.toLowerCase().includes('ceremony')
              const isReception = block.title.toLowerCase().includes('reception')
              const accent = isCeremony ? '#6b48a0' : isReception ? '#2563a8' : '#1a1a2e'
              return (
                <div key={block.id} style={{
                  padding: '14px 20px',
                  borderTop: i === 0 ? 'none' : '1px solid #f7f5f2',
                  display: 'flex', alignItems: 'center', gap: '16px',
                }}>
                  <div style={{ width: '64px', flexShrink: 0, textAlign: 'right' }}>
                    <p style={{ fontSize: '13px', fontWeight: 500, color: '#555' }}>{to12h(block.startTime)}</p>
                    {endTime && <p style={{ fontSize: '11px', color: '#bbb' }}>– {to12h(endTime)}</p>}
                  </div>
                  <div style={{ width: '3px', alignSelf: 'stretch', background: accent, borderRadius: '2px', flexShrink: 0, opacity: 0.4 }} />
                  <div>
                    <p style={{ fontSize: '14px', fontWeight: 500, color: accent }}>{block.title}</p>
                    {block.location && <p style={{ fontSize: '12px', color: '#aaa', marginTop: '2px' }}>📍 {block.location}</p>}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── Key dates & milestones ───────────────────────────── */}
      <div style={card}>
        <div style={{ padding: '18px 20px 14px', borderBottom: '1px solid #f0ede8' }}>
          <p style={sectionTitle}>Key dates</p>
          <p style={{ fontSize: '12px', color: '#aaa', marginTop: '2px' }}>Important milestones for your wedding photography</p>
        </div>
        <div>
          {[
            {
              icon: '📋',
              label: 'Questionnaire due',
              detail: '2 weeks before your wedding',
              date: addDays(booking.weddingDate, -14),
              action: () => onNavigate('questionnaire'),
              actionLabel: 'Fill out →',
            },
            {
              icon: '💰',
              label: 'Final payment due',
              detail: '30 days before your wedding',
              date: addDays(booking.weddingDate, -30),
              action: () => onNavigate('documents'),
              actionLabel: 'View →',
            },
            {
              icon: '📷',
              label: 'Your wedding day',
              detail: booking.venueName,
              date: formatDate(booking.weddingDate),
              action: null,
              actionLabel: null,
            },
            {
              icon: '🖼️',
              label: 'Gallery delivery',
              detail: `${booking.photographer?.galleryDeliveryWeeks ?? 8} weeks after your wedding`,
              date: addDays(booking.weddingDate, (booking.photographer?.galleryDeliveryWeeks ?? 8) * 7),
              action: null,
              actionLabel: null,
            },
          ].map((item, i) => (
            <div key={i} style={{
              padding: '14px 20px',
              borderTop: i === 0 ? 'none' : '1px solid #f7f5f2',
              display: 'flex', alignItems: 'center', gap: '14px',
            }}>
              <span style={{ fontSize: '20px', flexShrink: 0 }}>{item.icon}</span>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: '14px', fontWeight: 500, color: '#1a1a2e' }}>{item.label}</p>
                <p style={{ fontSize: '12px', color: '#aaa', marginTop: '1px' }}>{item.date} · {item.detail}</p>
              </div>
              {item.action && item.actionLabel && (
                <button onClick={item.action} style={viewAll}>{item.actionLabel}</button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ── Questionnaire CTA ────────────────────────────────────── */}
      <div style={{
        ...card,
        padding: '22px 24px',
        background: 'linear-gradient(135deg, #faf9f7 0%, #f0ede8 100%)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px',
      }}>
        <div>
          <p style={sectionTitle}>Wedding questionnaire</p>
          <p style={{ fontSize: '13px', color: '#888', marginTop: '4px', maxWidth: '380px', lineHeight: 1.5 }}>
            Help your photographer understand your vision, must-have shots, and all the details that make your day unique.
          </p>
        </div>
        <button
          onClick={() => onNavigate('questionnaire')}
          style={{
            padding: '10px 20px', borderRadius: '8px', fontSize: '13px', fontWeight: 500,
            background: '#0d1525', color: 'white', border: 'none', cursor: 'pointer',
            fontFamily: 'inherit', whiteSpace: 'nowrap', flexShrink: 0,
          }}
        >
          Fill out →
        </button>
      </div>

      {/* ── Photographer card ────────────────────────────────────── */}
      {booking.photographer && (
        <div style={{ ...card, background: '#0d1525', padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px' }}>
          <div>
            <p style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgba(255,255,255,0.4)', marginBottom: '6px' }}>Your photographer</p>
            <p style={{ fontSize: '16px', fontWeight: 500, color: 'white' }}>{booking.photographer.fullName}</p>
            {booking.photographer.businessName && (
              <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', marginTop: '2px' }}>{booking.photographer.businessName}</p>
            )}
          </div>
          <div style={{ textAlign: 'right' }}>
            {booking.photographer.phone && (
              <a href={`tel:${booking.photographer.phone}`} style={{ display: 'block', fontSize: '14px', color: '#f5c842', textDecoration: 'none', fontWeight: 500 }}>
                📞 {booking.photographer.phone}
              </a>
            )}
            {booking.photographer.email && (
              <a href={`mailto:${booking.photographer.email}`} style={{ display: 'block', fontSize: '12px', color: 'rgba(255,255,255,0.5)', textDecoration: 'none', marginTop: '4px' }}>
                {booking.photographer.email}
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  )
}