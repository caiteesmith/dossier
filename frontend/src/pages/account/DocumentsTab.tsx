import { useState } from 'react'
import { Card, Button, Badge } from '@/components/ui'
import { useBookings } from '@/hooks/useData'

const inputStyle = {
  width: '100%',
  background: 'var(--color-fog)',
  border: '1px solid var(--color-navy-100)',
  borderRadius: '8px',
  padding: '9px 12px',
  fontSize: '13px',
  color: 'var(--color-navy-800)',
  outline: 'none',
  fontFamily: 'inherit',
  boxSizing: 'border-box' as const,
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '11px',
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  color: 'var(--color-navy-400)',
  marginBottom: '5px',
  fontWeight: 500,
}

type PaymentStatus = 'paid' | 'pending' | 'overdue' | 'not_due'
type ContractStatus = 'signed' | 'sent' | 'not_sent'

interface BookingPaymentRecord {
  bookingId: string
  contractStatus: ContractStatus
  retainerPaid: boolean
  retainerAmount: number
  retainerDate?: string
  finalPaid: boolean
  finalAmount: number
  finalDueDate?: string
  finalPaidDate?: string
  notes: string
}

function statusBadge(status: PaymentStatus | ContractStatus) {
  const map: Record<string, { label: string; color: string; bg: string }> = {
    paid:     { label: 'Paid',       color: '#276840', bg: '#e6f4ec' },
    pending:  { label: 'Pending',    color: '#7a5c0a', bg: '#fdf8e8' },
    overdue:  { label: 'Overdue',    color: '#b91c1c', bg: '#fde8e8' },
    not_due:  { label: 'Not due yet',color: '#888',    bg: '#f5f5f5' },
    signed:   { label: 'Signed',     color: '#276840', bg: '#e6f4ec' },
    sent:     { label: 'Sent',       color: '#7a5c0a', bg: '#fdf8e8' },
    not_sent: { label: 'Not sent',   color: '#888',    bg: '#f5f5f5' },
  }
  const cfg = map[status]
  return (
    <span style={{ fontSize: '11px', fontWeight: 600, padding: '3px 9px', borderRadius: '20px', background: cfg.bg, color: cfg.color, whiteSpace: 'nowrap' }}>
      {cfg.label}
    </span>
  )
}

function getPaymentStatus(paid: boolean, dueDate?: string): PaymentStatus {
  if (paid) return 'paid'
  if (!dueDate) return 'pending'
  if (new Date(dueDate) < new Date()) return 'overdue'
  return 'pending'
}

export default function DocumentsTab() {
  const { data: bookings = [] } = useBookings()

  const [records, setRecords] = useState<Record<string, BookingPaymentRecord>>(() => {
    const init: Record<string, BookingPaymentRecord> = {}
    bookings.forEach(b => {
      const finalDue = b.weddingDate
        ? new Date(new Date(b.weddingDate).getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        : undefined
      init[b.id] = {
        bookingId: b.id,
        contractStatus: b.status === 'confirmed' ? 'signed' : 'not_sent',
        retainerPaid: b.status === 'confirmed',
        retainerAmount: Math.round((b.packagePrice ?? 0) * 0.25),
        finalPaid: b.status === 'completed',
        finalAmount: Math.round((b.packagePrice ?? 0) * 0.75),
        finalDueDate: finalDue,
        notes: '',
      }
    })
    return init
  })

  const [expandedId, setExpandedId] = useState<string | null>(null)

  function updateRecord(id: string, patch: Partial<BookingPaymentRecord>) {
    setRecords(prev => ({ ...prev, [id]: { ...prev[id], ...patch } }))
  }

  const upcomingBookings = bookings.filter(b => b.status !== 'completed' && b.status !== 'cancelled')
  const pastBookings     = bookings.filter(b => b.status === 'completed')

  const totalOutstanding = Object.values(records)
    .filter(r => !r.finalPaid)
    .reduce((sum, r) => sum + r.finalAmount + (r.retainerPaid ? 0 : r.retainerAmount), 0)

  const totalCollected = Object.values(records)
    .reduce((sum, r) => sum + (r.retainerPaid ? r.retainerAmount : 0) + (r.finalPaid ? r.finalAmount : 0), 0)

  function renderBookingRow(booking: typeof bookings[0]) {
    const rec = records[booking.id]
    if (!rec) return null
    const isOpen = expandedId === booking.id
    const finalStatus = getPaymentStatus(rec.finalPaid, rec.finalDueDate)

    return (
      <div key={booking.id} style={{ border: '1px solid var(--color-navy-100)', borderRadius: '12px', overflow: 'hidden', marginBottom: '8px' }}>
        {/* Summary row */}
        <button
          onClick={() => setExpandedId(isOpen ? null : booking.id)}
          style={{ width: '100%', padding: '14px 18px', background: 'white', border: 'none', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-navy-800)', marginBottom: '2px' }}>
                {booking.partnerOneName} & {booking.partnerTwoName}
              </p>
              <p style={{ fontSize: '12px', color: 'var(--color-navy-400)' }}>
                {new Date(booking.weddingDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} · {booking.venueName}
              </p>
            </div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap', flexShrink: 0 }}>
              {statusBadge(rec.contractStatus)}
              {statusBadge(rec.retainerPaid ? 'paid' : 'pending')}
              {statusBadge(finalStatus)}
              <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-navy-700)' }}>
                ${(booking.packagePrice ?? 0).toLocaleString()}
              </span>
              <span style={{ fontSize: '12px', color: 'var(--color-navy-400)', transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s', display: 'inline-block' }}>▾</span>
            </div>
          </div>
        </button>

        {/* Expanded detail */}
        {isOpen && (
          <div style={{ borderTop: '1px solid var(--color-navy-100)', padding: '18px', background: 'var(--color-fog)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>

              {/* Contract */}
              <div>
                <label style={labelStyle}>Contract status</label>
                <select
                  value={rec.contractStatus}
                  onChange={e => updateRecord(booking.id, { contractStatus: e.target.value as ContractStatus })}
                  style={{ ...inputStyle, cursor: 'pointer' }}
                >
                  <option value="not_sent">Not sent</option>
                  <option value="sent">Sent — awaiting signature</option>
                  <option value="signed">Signed</option>
                </select>
              </div>

              {/* Retainer */}
              <div>
                <label style={labelStyle}>Retainer</label>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <input
                    type="number"
                    value={rec.retainerAmount}
                    onChange={e => updateRecord(booking.id, { retainerAmount: parseFloat(e.target.value) || 0 })}
                    style={{ ...inputStyle, flex: 1 }}
                  />
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                    <input
                      type="checkbox"
                      checked={rec.retainerPaid}
                      onChange={e => updateRecord(booking.id, { retainerPaid: e.target.checked })}
                    />
                    <span style={{ fontSize: '12px', color: 'var(--color-navy-600)' }}>Paid</span>
                  </label>
                </div>
              </div>

              {/* Final payment */}
              <div>
                <label style={labelStyle}>Final payment amount</label>
                <input
                  type="number"
                  value={rec.finalAmount}
                  onChange={e => updateRecord(booking.id, { finalAmount: parseFloat(e.target.value) || 0 })}
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>Final due date</label>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <input
                    type="date"
                    value={rec.finalDueDate ?? ''}
                    onChange={e => updateRecord(booking.id, { finalDueDate: e.target.value })}
                    style={{ ...inputStyle, flex: 1 }}
                  />
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                    <input
                      type="checkbox"
                      checked={rec.finalPaid}
                      onChange={e => updateRecord(booking.id, { finalPaid: e.target.checked })}
                    />
                    <span style={{ fontSize: '12px', color: 'var(--color-navy-600)' }}>Paid</span>
                  </label>
                </div>
              </div>

              <div style={{ gridColumn: "span 2" }}>
                <label style={labelStyle}>Notes</label>
                <input
                  type="text"
                  value={rec.notes}
                  onChange={e => updateRecord(booking.id, { notes: e.target.value })}
                  placeholder="e.g. Venmo @..., paid via check #1234"
                  style={inputStyle}
                />
              </div>
            </div>

            {/* Payment summary */}
            <div style={{ background: 'white', borderRadius: '8px', padding: '12px 14px', border: '1px solid var(--color-navy-100)' }}>
              <div style={{ display: 'flex', gap: '20px', fontSize: '13px', flexWrap: 'wrap' }}>
                <span style={{ color: 'var(--color-navy-500)' }}>
                  Collected: <strong style={{ color: 'var(--color-navy-800)' }}>
                    ${((rec.retainerPaid ? rec.retainerAmount : 0) + (rec.finalPaid ? rec.finalAmount : 0)).toLocaleString()}
                  </strong>
                </span>
                <span style={{ color: 'var(--color-navy-500)' }}>
                  Outstanding: <strong style={{ color: rec.finalPaid && rec.retainerPaid ? '#276840' : '#b91c1c' }}>
                    ${((rec.retainerPaid ? 0 : rec.retainerAmount) + (rec.finalPaid ? 0 : rec.finalAmount)).toLocaleString()}
                  </strong>
                </span>
                <span style={{ color: 'var(--color-navy-500)' }}>
                  Total: <strong style={{ color: 'var(--color-navy-800)' }}>${(booking.packagePrice ?? 0).toLocaleString()}</strong>
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--color-navy-800)', marginBottom: '4px' }}>Documents & Payments</h3>
        <p style={{ fontSize: '13px', color: 'var(--color-navy-400)', lineHeight: '1.5' }}>
          Track contract status and payment milestones across all your bookings. Full contract and invoice generation coming soon.
        </p>
      </div>

      {/* Summary stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
        {[
          { label: 'Total collected',    value: `$${totalCollected.toLocaleString()}` },
          { label: 'Outstanding',        value: `$${totalOutstanding.toLocaleString()}`, alert: totalOutstanding > 0 },
          { label: 'Active bookings',    value: String(upcomingBookings.length) },
        ].map(stat => (
          <div key={stat.label} style={{ background: 'white', border: `1px solid ${stat.alert ? '#fca5a5' : 'var(--color-navy-100)'}`, borderRadius: '10px', padding: '14px 16px' }}>
            <p style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-navy-400)', marginBottom: '4px' }}>{stat.label}</p>
            <p style={{ fontSize: '20px', fontWeight: 700, color: stat.alert ? '#b91c1c' : 'var(--color-navy-900)' }}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Upcoming bookings */}
      {upcomingBookings.length > 0 && (
        <div>
          <p style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-navy-400)', marginBottom: '10px', fontWeight: 600 }}>
            Upcoming
          </p>
          {upcomingBookings.map(renderBookingRow)}
        </div>
      )}

      {/* Past bookings */}
      {pastBookings.length > 0 && (
        <div>
          <p style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-navy-400)', marginBottom: '10px', fontWeight: 600 }}>
            Completed
          </p>
          {pastBookings.map(renderBookingRow)}
        </div>
      )}

      <p style={{ fontSize: '11px', color: 'var(--color-navy-300)' }}>
        Changes are saved locally for now. Persistent payment tracking requires the backend.
      </p>
    </div>
  )
}