import { Link } from 'react-router-dom'
import AppShell from '@/components/layout/AppShell'
import { Card, StatCard, Badge, PageHeader } from '@/components/ui'
import { TasksSnapshot } from '@/components/ui/TasksSnapshot'
import { WeatherWidget } from '@/components/ui/WeatherWidget'
import { useBookings, useLeads, useAllBookingDetails } from '@/hooks/useData'

function parseLocalDate(dateStr: string) {
  const [year, month, day] = dateStr.split('-').map(Number)
  return new Date(year, month - 1, day)
}

function daysUntil(dateStr: string) {
  const diff = parseLocalDate(dateStr).getTime() - new Date().getTime()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

function formatDate(dateStr: string) {
  return parseLocalDate(dateStr).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
}

function getGreeting(name: string) {
  const hour = new Date().getHours()
  const suffix = name ? `, ${name}.` : '.'
  if (hour < 12) return `Good morning${suffix}`
  if (hour < 17) return `Good afternoon${suffix}`
  return `Good evening${suffix}`
}

export default function DashboardPage() {
  const { data: bookings = [] } = useBookings()
  const { data: leads = [] } = useLeads()
  const { data: allDetails = {} } = useAllBookingDetails()

  const nickname = localStorage.getItem('dossier_nickname') ?? ''

  const upcoming = bookings
    .filter(b => b.status !== 'cancelled' && b.status !== 'completed')
    .sort((a, b) => parseLocalDate(a.weddingDate).getTime() - parseLocalDate(b.weddingDate).getTime())

  const nextWedding = upcoming[0]
  const activeLeads = leads.filter(l => l.status !== 'lost' && l.status !== 'booked')
  const revenue = bookings.filter(b => b.status === 'confirmed').reduce((sum, b) => sum + (b.packagePrice ?? 0), 0)

  return (
    <AppShell>
      <div className="px-10 py-10 max-w-5xl">
        <PageHeader title={getGreeting(nickname)} subtitle="Here's where things stand." />

        <div className="grid grid-cols-4 gap-4 mb-8 stagger-children">
          <StatCard label="This year" value={bookings.filter(b => b.weddingDate.startsWith('2026')).length} sub="weddings booked" />
          <StatCard label="Upcoming" value={upcoming.length} sub="confirmed dates" />
          <StatCard label="Active leads" value={activeLeads.length} sub="in pipeline" />
          <StatCard label="Revenue (confirmed)" value={"$" + (revenue / 1000).toFixed(0) + "k"} sub="2026 season" />
        </div>

        <div className="grid grid-cols-5 gap-6">
          <div className="col-span-3 space-y-4">
            <h2 className="text-xs uppercase tracking-widest" style={{ color: 'var(--color-navy-400)' }}>Next wedding</h2>
            {nextWedding ? (
              <Link to={"/bookings/" + nextWedding.id}>
                <Card className="p-6 hover:shadow-md transition-shadow group">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <p className="font-display text-xl italic group-hover:opacity-70 transition-opacity" style={{ color: 'var(--color-navy-900)' }}>
                        {nextWedding.partnerOneName} & {nextWedding.partnerTwoName}
                      </p>
                      <p className="text-sm mt-0.5" style={{ color: 'var(--color-navy-400)' }}>{nextWedding.venueName}</p>
                    </div>
                    <div className="text-right">
                      <div className="font-display text-3xl italic" style={{ color: 'var(--color-gold-warm)' }}>
                        {daysUntil(nextWedding.weddingDate) === 0 ? '🎉' : Math.abs(daysUntil(nextWedding.weddingDate))}
                      </div>
                      <p className="text-xs" style={{ color: 'var(--color-navy-300)' }}>
                        {daysUntil(nextWedding.weddingDate) === 0
                          ? 'Today!'
                          : daysUntil(nextWedding.weddingDate) === 1
                          ? 'day away'
                          : daysUntil(nextWedding.weddingDate) > 0
                          ? 'days away'
                          : daysUntil(nextWedding.weddingDate) === -1
                          ? 'day since'
                          : 'days since'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-xs mb-3" style={{ color: 'var(--color-navy-400)' }}>
                    <span>📅 {formatDate(nextWedding.weddingDate)}</span>
                    <span>📦 {nextWedding.packageName}</span>
                    <Badge status={String(nextWedding.status)} />
                  </div>
                  {allDetails[nextWedding.id]?.tasks && (
                    <div className="pt-3" style={{ borderTop: '1px solid var(--color-navy-100)' }}>
                      <TasksSnapshot bookingId={nextWedding.id} tasks={allDetails[nextWedding.id].tasks} />
                    </div>
                  )}
                  <div className="pt-3" style={{ borderTop: '1px solid var(--color-navy-100)' }}>
                    <WeatherWidget booking={nextWedding} compact />
                  </div>
                </Card>
              </Link>
            ) : (
              <Card className="p-6">
                <p className="text-sm italic" style={{ color: 'var(--color-navy-300)' }}>No upcoming weddings scheduled.</p>
              </Card>
            )}

            <h2 className="text-xs uppercase tracking-widest pt-2" style={{ color: 'var(--color-navy-400)' }}>All upcoming</h2>
            <Card>
              <div className="stagger-children">
                {upcoming.map((booking, i) => {
                  const tasks = allDetails[booking.id]?.tasks ?? []
                  const outstanding = tasks.filter(t => !t.completed)
                  return (
                    <div
                      key={booking.id}
                      style={{ borderTop: i === 0 ? 'none' : '1px solid var(--color-navy-100)' }}
                    >
                      <Link
                        to={"/bookings/" + booking.id}
                        className="flex items-center justify-between px-5 py-3.5 transition-colors"
                        style={{ color: 'inherit' }}
                        onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-fog)')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                      >
                        <div>
                          <p className="font-medium text-sm" style={{ color: 'var(--color-navy-800)' }}>
                            {booking.partnerOneName} & {booking.partnerTwoName}
                          </p>
                          <p className="text-xs mt-0.5" style={{ color: 'var(--color-navy-400)' }}>{booking.venueName}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-xs" style={{ color: 'var(--color-navy-400)' }}>{formatDate(booking.weddingDate)}</span>
                          {outstanding.length > 0 && (
                            <span className="text-xs px-2 py-0.5 rounded" style={{ background: 'var(--color-navy-50)', color: 'var(--color-navy-500)' }}>
                              {outstanding.length} tasks
                            </span>
                          )}
                          {outstanding.length === 0 && tasks.length > 0 && (
                            <span className="text-xs" style={{ color: '#276840' }}>✓ done</span>
                          )}
                          <Badge status={String(booking.status)} />
                          <span style={{ color: 'var(--color-navy-300)' }}>→</span>
                        </div>
                      </Link>
                    </div>
                  )
                })}
              </div>
            </Card>
          </div>

          <div className="col-span-2 space-y-4">
            <h2 className="text-xs uppercase tracking-widest" style={{ color: 'var(--color-navy-400)' }}>Lead pipeline</h2>
            <Card>
              <div className="stagger-children">
                {leads.filter(l => l.status !== 'lost').slice(0, 6).map((lead, i) => (
                  <div key={lead.id} className="px-4 py-3" style={{ borderTop: i === 0 ? 'none' : '1px solid var(--color-navy-100)' }}>
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium" style={{ color: 'var(--color-navy-800)' }}>
                        {lead.firstName} {lead.lastName}
                      </p>
                      <Badge status={lead.status} />
                    </div>
                    {lead.weddingDate && (
                      <p className="text-xs mt-0.5" style={{ color: 'var(--color-navy-400)' }}>{formatDate(lead.weddingDate)}</p>
                    )}
                  </div>
                ))}
              </div>
              <div className="px-4 py-3" style={{ borderTop: '1px solid var(--color-navy-100)' }}>
                <Link to="/leads" className="text-xs transition-colors hover:opacity-70" style={{ color: 'var(--color-steel-500)' }}>
                  View all leads →
                </Link>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </AppShell>
  )
}