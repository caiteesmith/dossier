import { Link } from 'react-router-dom'
import AppShell from '@/components/layout/AppShell'
import { Card, Badge, PageHeader, Button, EmptyState } from '@/components/ui'
import { TasksSnapshot } from '@/components/ui/TasksSnapshot'
import { useBookings, useAllBookingDetails } from '@/hooks/useData'

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
}

function daysUntil(dateStr: string) {
  const diff = new Date(dateStr).getTime() - new Date().getTime()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

export default function BookingsPage() {
  const { data: bookings = [], isLoading } = useBookings()
  const { data: allDetails = {} } = useAllBookingDetails()

  const sorted = [...bookings].sort((a, b) =>
    new Date(a.weddingDate).getTime() - new Date(b.weddingDate).getTime()
  )

  return (
    <AppShell>
      <div className="px-10 py-10 max-w-4xl">
        <PageHeader
          title="Bookings"
          subtitle={`${bookings.length} weddings on the books`}
          action={<Button size="sm">+ New booking</Button>}
        />
        {isLoading ? (
          <div className="text-sm" style={{ color: 'var(--color-navy-400)' }}>Loading...</div>
        ) : bookings.length === 0 ? (
          <EmptyState icon="◉" title="No bookings yet" body="Convert a lead to create your first booking." />
        ) : (
          <Card>
            <div className="stagger-children">
              {sorted.map((booking, i) => {
                const days = daysUntil(booking.weddingDate)
                const isPast = days < 0
                const detail = allDetails[booking.id]
                const tasks = detail?.tasks ?? []

                return (
                  <div
                    key={booking.id}
                    style={{ borderTop: i === 0 ? 'none' : '1px solid var(--color-navy-100)' }}
                  >
                    <Link
                      to={"/bookings/" + booking.id}
                      className="flex items-center justify-between px-6 py-4 transition-colors"
                      style={{ color: 'inherit' }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-fog)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    >
                      <div className="flex items-center gap-5">
                        <div className="text-center w-12 shrink-0">
                          <p className="text-xs uppercase tracking-wide" style={{ color: 'var(--color-navy-400)' }}>
                            {new Date(booking.weddingDate).toLocaleDateString('en-US', { month: 'short' })}
                          </p>
                          <p className="font-display text-2xl italic leading-none" style={{ color: 'var(--color-navy-800)' }}>
                            {new Date(booking.weddingDate).getDate()}
                          </p>
                        </div>
                        <div className="w-px h-10" style={{ background: 'var(--color-navy-100)' }} />
                        <div>
                          <p className="font-medium text-sm" style={{ color: 'var(--color-navy-800)' }}>
                            {booking.partnerOneName} & {booking.partnerTwoName}
                          </p>
                          <p className="text-xs mt-0.5" style={{ color: 'var(--color-navy-400)' }}>
                            {booking.venueName}
                            {booking.packageName && <span style={{ color: 'var(--color-navy-300)' }}> · {booking.packageName}</span>}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        {!isPast && (
                          <span className="text-xs" style={{ color: 'var(--color-navy-400)' }}>
                            {days === 0 ? 'Today!' : days + ' days'}
                          </span>
                        )}
                        {booking.packagePrice && (
                          <span className="text-xs font-medium" style={{ color: 'var(--color-navy-600)' }}>
                            ${booking.packagePrice.toLocaleString()}
                          </span>
                        )}
                        <Badge status={booking.status} />
                        <span style={{ color: 'var(--color-navy-300)' }}>→</span>
                      </div>
                    </Link>

                    {/* Tasks snapshot row */}
                    {tasks.length > 0 && (
                      <div className="px-6 pb-3" style={{ paddingLeft: '92px' }}>
                        <TasksSnapshot bookingId={booking.id} tasks={tasks} />
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </Card>
        )}
      </div>
    </AppShell>
  )
}