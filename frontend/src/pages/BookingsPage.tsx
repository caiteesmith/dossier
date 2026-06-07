import { Link } from 'react-router-dom'
import { useState } from 'react'
import AppShell from '@/components/layout/AppShell'
import NewBookingModal from '@/components/forms/NewBookingModal'
import { Card, Badge, PageHeader, Button, EmptyState } from '@/components/ui'
import { WorkflowBadge } from '@/components/ui/WorkflowBadge'
import { TasksSnapshot } from '@/components/ui/TasksSnapshot'
import { useBookings, useAllBookingDetails, useDeleteBooking } from '@/hooks/useData'

function parseLocalDate(dateStr: string) {
  const [year, month, day] = dateStr.split('-').map(Number)
  return new Date(year, month - 1, day)
}

function daysUntil(dateStr: string) {
  const diff = parseLocalDate(dateStr).getTime() - new Date().getTime()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

export default function BookingsPage() {
  const [showNew, setShowNew] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const [showPast, setShowPast] = useState(false)
  const { data: bookings = [], isLoading } = useBookings()
  const { data: allDetails = {} } = useAllBookingDetails()
  const deleteBooking = useDeleteBooking()

  const sorted = [...bookings].sort((a, b) =>
    parseLocalDate(a.weddingDate).getTime() - parseLocalDate(b.weddingDate).getTime()
  )

  const upcoming = sorted.filter(b => daysUntil(b.weddingDate) >= 0)
  const past     = sorted.filter(b => daysUntil(b.weddingDate) < 0).reverse()

  function BookingRow({ booking, i, dimmed }: { booking: typeof bookings[0]; i: number; dimmed?: boolean }) {
    const days = daysUntil(booking.weddingDate)
    const isPast = days < 0
    const detail = allDetails[booking.id]
    const tasks = detail?.tasks ?? []
    const date = parseLocalDate(booking.weddingDate)

    return (
      <div style={{ borderTop: i === 0 ? 'none' : '1px solid var(--color-navy-100)', position: 'relative', opacity: dimmed ? 0.6 : 1 }}>
        <Link
          to={"/bookings/" + booking.id}
          className="flex items-center justify-between px-6 py-4 transition-colors"
          style={{ color: 'inherit', paddingRight: '48px' }}
          onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-fog)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
        >
          <div className="flex items-center gap-5">
            <div className="text-center w-12 shrink-0">
              <p className="text-xs uppercase tracking-wide" style={{ color: 'var(--color-navy-400)' }}>
                {date.toLocaleDateString('en-US', { month: 'short' })}
              </p>
              <p className="font-display text-2xl italic leading-none" style={{ color: 'var(--color-navy-800)' }}>
                {date.getDate()}
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

          <div className="flex items-center gap-3">
            {!isPast && days === 0 && <span className="text-xs font-medium" style={{ color: 'var(--color-gold-warm)' }}>Today!</span>}
            {!isPast && days > 0 && <span className="text-xs" style={{ color: 'var(--color-navy-400)' }}>{days === 1 ? '1 day' : `${days} days`}</span>}
            {isPast && <span className="text-xs" style={{ color: 'var(--color-navy-300)' }}>{Math.abs(days) === 1 ? '1 day ago' : `${Math.abs(days)} days ago`}</span>}
            {booking.packagePrice && <span className="text-xs font-medium" style={{ color: 'var(--color-navy-600)' }}>${booking.packagePrice.toLocaleString()}</span>}
            <WorkflowBadge status={(booking as any).workflowStatus} />
            <Badge status={String(booking.status)} />
            <span style={{ color: 'var(--color-navy-300)' }}>→</span>
          </div>
        </Link>

        <button
          onClick={() => setConfirmDelete(booking.id)}
          style={{ position: 'absolute', top: '50%', right: '14px', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-navy-300)', fontSize: '14px', padding: '4px 6px', zIndex: 1, lineHeight: 1, borderRadius: '4px', transition: 'color 0.15s' }}
          onMouseEnter={e => (e.currentTarget.style.color = '#ef4444')}
          onMouseLeave={e => (e.currentTarget.style.color = 'var(--color-navy-300)')}
          title="Delete booking"
        >✕</button>

        {tasks.length > 0 && (
          <div className="px-6 pb-3" style={{ paddingLeft: '92px' }}>
            <TasksSnapshot bookingId={booking.id} tasks={tasks} />
          </div>
        )}
      </div>
    )
  }

  return (
    <AppShell>
      <div className="px-10 py-10 max-w-4xl">
        <PageHeader
          title="Bookings"
          subtitle={`${bookings.length} ${bookings.length === 1 ? 'wedding' : 'weddings'} on the books`}
          action={<Button size="sm" onClick={() => setShowNew(true)}>+ New booking</Button>}
        />

        {isLoading ? (
          <div className="text-sm" style={{ color: 'var(--color-navy-400)' }}>Loading...</div>
        ) : bookings.length === 0 ? (
          <EmptyState icon="◉" title="No bookings yet" body="Convert a lead to create your first booking." />
        ) : (
          <div className="space-y-8">
            <div>
              <h2 className="text-xs uppercase tracking-widest mb-3" style={{ color: 'var(--color-navy-400)' }}>Upcoming · {upcoming.length}</h2>
              {upcoming.length === 0 ? (
                <p className="text-sm italic" style={{ color: 'var(--color-navy-300)' }}>No upcoming weddings.</p>
              ) : (
                <Card>
                  <div className="stagger-children">
                    {upcoming.map((booking, i) => <BookingRow key={booking.id} booking={booking} i={i} />)}
                  </div>
                </Card>
              )}
            </div>

            {past.length > 0 && (
              <div>
                <button onClick={() => setShowPast(!showPast)}
                  className="text-xs uppercase tracking-widest mb-3 flex items-center gap-2 hover:opacity-70 transition-opacity"
                  style={{ color: 'var(--color-navy-400)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', padding: 0 }}>
                  Past · {past.length}
                  <span style={{ fontSize: '10px', transform: showPast ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s', display: 'inline-block' }}>▾</span>
                </button>
                {showPast && (
                  <Card>
                    <div>{past.map((booking, i) => <BookingRow key={booking.id} booking={booking} i={i} dimmed />)}</div>
                  </Card>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {showNew && <NewBookingModal onClose={() => setShowNew(false)} />}

      {confirmDelete && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div style={{ background: 'white', borderRadius: '12px', padding: '24px', maxWidth: '360px', width: '90%', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
            <p className="font-medium text-sm mb-2" style={{ color: 'var(--color-navy-800)' }}>Delete booking?</p>
            <p className="text-xs mb-6" style={{ color: 'var(--color-navy-400)' }}>This cannot be undone. All tasks, vendors, and timeline data will be removed.</p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setConfirmDelete(null)} style={{ fontSize: '13px', padding: '8px 16px', borderRadius: '8px', border: '1px solid var(--color-navy-200)', background: 'white', cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
              <button onClick={() => { deleteBooking.mutate(confirmDelete); setConfirmDelete(null) }} style={{ fontSize: '13px', padding: '8px 16px', borderRadius: '8px', border: 'none', background: '#ef4444', color: 'white', cursor: 'pointer', fontFamily: 'inherit' }}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  )
}