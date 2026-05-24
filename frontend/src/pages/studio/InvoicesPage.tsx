import { useState } from 'react'
import AppShell from '@/components/layout/AppShell'
import { PageHeader, Card, Button } from '@/components/ui'
import { useBookings } from '@/hooks/useData'

function formatDate(d: string) {
  return new Date(d + 'T12:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
}

function money(n: number) { return '$' + n.toLocaleString() }

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + 'T12:00:00')
  d.setDate(d.getDate() + days)
  return d.toISOString().split('T')[0]
}

function subtractDays(dateStr: string, days: number): string {
  return addDays(dateStr, -days)
}

type PaymentStatus = 'unpaid' | 'paid' | 'overdue'

interface PaymentLine {
  id: string
  label: string
  amount: number
  dueDate: string
  status: PaymentStatus
  paidAt?: string
}

function buildDefaultLines(booking: { packagePrice?: number; weddingDate: string }): PaymentLine[] {
  const price = booking.packagePrice ?? 0
  const retainer = Math.round(price * 0.25)
  const final = price - retainer
  return [
    {
      id: 'retainer',
      label: 'Retainer (25%) — due upon signing',
      amount: retainer,
      dueDate: new Date().toISOString().split('T')[0],
      status: 'unpaid',
    },
    {
      id: 'final',
      label: 'Final balance — due 30 days before wedding',
      amount: final,
      dueDate: subtractDays(booking.weddingDate, 30),
      status: 'unpaid',
    },
  ]
}

// ── Invoice modal ─────────────────────────────────────────────────

function InvoiceModal({ booking, onClose }: {
  booking: { id: string; partnerOneName: string; partnerTwoName: string; weddingDate: string; venueName: string; packageName?: string; packagePrice?: number; email: string }
  onClose: () => void
}) {
  const [lines, setLines] = useState<PaymentLine[]>(buildDefaultLines(booking))
  const [notes, setNotes] = useState('')

  const total = lines.reduce((s, l) => s + l.amount, 0)
  const paid = lines.filter(l => l.status === 'paid').reduce((s, l) => s + l.amount, 0)
  const outstanding = total - paid

  function updateLine(id: string, patch: Partial<PaymentLine>) {
    setLines(prev => prev.map(l => l.id === id ? { ...l, ...patch } : l))
  }

  function addLine() {
    setLines(prev => [...prev, {
      id: `line-${Date.now()}`,
      label: 'Additional item',
      amount: 0,
      dueDate: new Date().toISOString().split('T')[0],
      status: 'unpaid',
    }])
  }

  function removeLine(id: string) {
    setLines(prev => prev.filter(l => l.id !== id))
  }

  function printInvoice() {
    const win = window.open('', '_blank')
    if (!win) return
    win.document.write(`
      <html><head><title>Invoice — ${booking.partnerOneName} & ${booking.partnerTwoName}</title>
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 12pt; color: #111; padding: 48px; }
        .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; }
        .business { font-size: 20pt; font-style: italic; font-family: Georgia, serif; }
        .invoice-label { font-size: 10pt; text-transform: uppercase; letter-spacing: 0.1em; color: #888; }
        .couple { margin-bottom: 32px; }
        .couple h2 { font-family: Georgia, serif; font-size: 16pt; font-style: italic; margin-bottom: 4px; }
        .couple p { font-size: 11pt; color: #555; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
        th { font-size: 10pt; text-transform: uppercase; letter-spacing: 0.08em; color: #888; text-align: left; padding: 8px 0; border-bottom: 1px solid #eee; }
        td { padding: 12px 0; border-bottom: 1px solid #f5f5f5; font-size: 11pt; }
        td.amount { text-align: right; font-weight: 600; }
        td.status { color: ${lines.some(l => l.status === 'paid') ? '#276840' : '#888'}; font-size: 10pt; }
        .totals { display: flex; justify-content: flex-end; }
        .totals-table { width: 280px; }
        .totals-row { display: flex; justify-content: space-between; padding: 6px 0; font-size: 11pt; }
        .totals-row.total { font-weight: 700; border-top: 2px solid #111; padding-top: 10px; margin-top: 4px; }
        .notes { margin-top: 32px; font-size: 11pt; color: #555; }
        .footer { margin-top: 48px; padding-top: 16px; border-top: 1px solid #eee; font-size: 10pt; color: #aaa; }
        @media print { body { padding: 24px; } }
      </style></head>
      <body>
        <div class="header">
          <div>
            <div class="business">Caitee Smith Photography</div>
            <div style="font-size:10pt;color:#888;margin-top:4px">hello@caiteesmith.com</div>
          </div>
          <div style="text-align:right">
            <div class="invoice-label">Invoice</div>
            <div style="font-size:10pt;color:#555;margin-top:4px">${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</div>
          </div>
        </div>

        <div class="couple">
          <h2>${booking.partnerOneName} & ${booking.partnerTwoName}</h2>
          <p>${formatDate(booking.weddingDate)} · ${booking.venueName}</p>
          ${booking.packageName ? `<p>${booking.packageName}</p>` : ''}
        </div>

        <table>
          <thead><tr>
            <th>Description</th>
            <th>Due date</th>
            <th style="text-align:right">Amount</th>
            <th style="text-align:right">Status</th>
          </tr></thead>
          <tbody>
            ${lines.map(l => `
              <tr>
                <td>${l.label}</td>
                <td style="color:#555">${formatDate(l.dueDate)}</td>
                <td class="amount">${money(l.amount)}</td>
                <td style="text-align:right;color:${l.status === 'paid' ? '#276840' : l.status === 'overdue' ? '#b91c1c' : '#888'};font-size:10pt;font-weight:600">
                  ${l.status === 'paid' ? 'Paid' : l.status === 'overdue' ? 'Overdue' : 'Unpaid'}
                </td>
              </tr>`).join('')}
          </tbody>
        </table>

        <div class="totals">
          <div class="totals-table">
            <div class="totals-row"><span>Total</span><span>${money(total)}</span></div>
            <div class="totals-row"><span>Paid</span><span style="color:#276840">${money(paid)}</span></div>
            <div class="totals-row total"><span>Balance due</span><span>${money(outstanding)}</span></div>
          </div>
        </div>

        ${notes ? `<div class="notes"><strong>Notes:</strong> ${notes}</div>` : ''}

        <div class="footer">Thank you for choosing Caitee Smith Photography.</div>
      </body></html>
    `)
    win.document.close()
    win.print()
  }

  const iS = {
    background: 'var(--color-fog)', border: '1px solid var(--color-navy-100)',
    borderRadius: '6px', padding: '7px 10px', fontSize: '13px', color: 'var(--color-navy-800)',
    outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' as const,
  }

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(13,21,37,0.5)', zIndex: 40, backdropFilter: 'blur(2px)' }} />
      <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
        <div style={{ background: 'white', borderRadius: '16px', width: '100%', maxWidth: '700px', maxHeight: '92vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 24px 64px rgba(13,21,37,0.25)' }}>

          {/* Header */}
          <div style={{ padding: '18px 24px', borderBottom: '1px solid var(--color-navy-100)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--color-navy-900)' }}>Invoice</h2>
              <p style={{ fontSize: '12px', color: 'var(--color-navy-400)', marginTop: '2px' }}>
                {booking.partnerOneName} & {booking.partnerTwoName} · {formatDate(booking.weddingDate)}
              </p>
            </div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <Button variant="secondary" size="sm" onClick={printInvoice}>Print / PDF</Button>
              <button
                // TODO: replace with api.post('/stripe/invoices', { bookingId: booking.id, lines })
                onClick={() => alert('Stripe integration requires the backend. The invoice data is ready to send.')}
                style={{ fontSize: '12px', fontWeight: 600, color: 'white', background: '#635bff', border: 'none', borderRadius: '8px', padding: '6px 14px', cursor: 'pointer', fontFamily: 'inherit' }}
              >
                Send via Stripe
              </button>
              <button onClick={onClose} style={{ fontSize: '18px', color: 'var(--color-navy-400)', background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}>×</button>
            </div>
          </div>

          {/* Body */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>

            {/* Summary header */}
            <div style={{ background: 'var(--color-navy-900)', borderRadius: '12px', padding: '20px', marginBottom: '20px', display: 'flex', gap: '32px' }}>
              {[
                { label: 'Total', value: money(total), color: 'white' },
                { label: 'Paid', value: money(paid), color: '#4ade80' },
                { label: 'Outstanding', value: money(outstanding), color: outstanding > 0 ? '#fbbf24' : '#4ade80' },
              ].map(({ label, value, color }) => (
                <div key={label}>
                  <p style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.45)', marginBottom: '4px' }}>{label}</p>
                  <p style={{ fontSize: '22px', fontWeight: 700, color }}>{value}</p>
                </div>
              ))}
            </div>

            {/* Payment lines */}
            <div style={{ marginBottom: '16px' }}>
              <p style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-navy-400)', fontWeight: 600, marginBottom: '10px' }}>Payment schedule</p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {lines.map(line => (
                  <div key={line.id} style={{ background: 'var(--color-fog)', borderRadius: '10px', padding: '14px 16px', display: 'grid', gridTemplateColumns: '2fr 1fr 1fr auto auto', gap: '10px', alignItems: 'center', border: '1px solid var(--color-navy-100)' }}>
                    <input
                      value={line.label}
                      onChange={e => updateLine(line.id, { label: e.target.value })}
                      style={{ ...iS, width: '100%' }}
                    />
                    <input
                      type="number"
                      value={line.amount}
                      onChange={e => updateLine(line.id, { amount: parseFloat(e.target.value) || 0 })}
                      style={{ ...iS, width: '100%' }}
                      min={0}
                    />
                    <input
                      type="date"
                      value={line.dueDate}
                      onChange={e => updateLine(line.id, { dueDate: e.target.value })}
                      style={{ ...iS, width: '100%' }}
                    />
                    <select
                      value={line.status}
                      onChange={e => updateLine(line.id, { status: e.target.value as PaymentStatus })}
                      style={{
                        fontSize: '11px', fontWeight: 600, padding: '5px 10px', borderRadius: '20px', border: 'none',
                        background: line.status === 'paid' ? '#e6f4ec' : line.status === 'overdue' ? '#fde8e8' : '#f5f5f5',
                        color: line.status === 'paid' ? '#276840' : line.status === 'overdue' ? '#b91c1c' : '#888',
                        cursor: 'pointer', fontFamily: 'inherit', outline: 'none',
                      }}
                    >
                      <option value="unpaid">Unpaid</option>
                      <option value="paid">Paid</option>
                      <option value="overdue">Overdue</option>
                    </select>
                    <button
                      onClick={() => removeLine(line.id)}
                      style={{ fontSize: '14px', color: 'var(--color-navy-300)', background: 'none', border: 'none', cursor: 'pointer', padding: '4px', lineHeight: 1 }}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>

              <button
                onClick={addLine}
                style={{ marginTop: '8px', fontSize: '13px', color: 'var(--color-navy-400)', background: 'none', border: '1px dashed var(--color-navy-200)', borderRadius: '8px', padding: '8px 16px', cursor: 'pointer', fontFamily: 'inherit', width: '100%' }}
              >
                + Add line item
              </button>
            </div>

            {/* Notes */}
            <div>
              <p style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-navy-400)', fontWeight: 600, marginBottom: '8px' }}>Notes</p>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                rows={2}
                placeholder="e.g. Payment accepted via Venmo, Zelle, or check"
                style={{ ...iS, width: '100%', resize: 'vertical' as const }}
              />
            </div>

            {/* Stripe note */}
            <div style={{ marginTop: '16px', background: '#f0eeff', borderRadius: '10px', padding: '12px 16px', display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
              <span style={{ fontSize: '18px' }}>💳</span>
              <div>
                <p style={{ fontSize: '13px', fontWeight: 600, color: '#3d2fa9', marginBottom: '2px' }}>Stripe integration ready</p>
                <p style={{ fontSize: '12px', color: '#6b5dc7', lineHeight: '1.5' }}>
                  The invoice data is structured for Stripe. Once the backend is connected, "Send via Stripe" will create a real Stripe invoice and email a payment link to {booking.email}.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

// ── Main invoices page ────────────────────────────────────────────

export default function InvoicesPage() {
  const { data: bookings = [], isLoading } = useBookings()
  const [openBookingId, setOpenBookingId] = useState<string | null>(null)

  const sorted = [...bookings].sort((a, b) =>
    new Date(a.weddingDate).getTime() - new Date(b.weddingDate).getTime()
  )

  const openBooking = openBookingId ? bookings.find(b => b.id === openBookingId) : null

  const totalRevenue = bookings.reduce((s, b) => s + (b.packagePrice ?? 0), 0)
  const retainerRevenue = Math.round(totalRevenue * 0.25)

  return (
    <AppShell>
      <div className="px-10 py-10 max-w-4xl">
        <PageHeader
          title="Invoices"
          subtitle="Payment schedules and Stripe integration"
        />

        {/* Summary */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '24px' }}>
          {[
            { label: 'Total contracted',    value: money(totalRevenue) },
            { label: 'Retainers (est.)',     value: money(retainerRevenue) },
            { label: 'Bookings',             value: String(bookings.length) },
          ].map(({ label, value }) => (
            <div key={label} style={{ background: 'white', border: '1px solid var(--color-navy-100)', borderRadius: '10px', padding: '14px 18px' }}>
              <p style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-navy-400)', marginBottom: '4px' }}>{label}</p>
              <p style={{ fontSize: '22px', fontWeight: 700, color: 'var(--color-navy-900)' }}>{value}</p>
            </div>
          ))}
        </div>

        {isLoading ? (
          <div className="text-sm" style={{ color: 'var(--color-navy-400)' }}>Loading...</div>
        ) : (
          <Card>
            {sorted.map((booking, i) => {
              const retainer = Math.round((booking.packagePrice ?? 0) * 0.25)
              const finalBal = (booking.packagePrice ?? 0) - retainer
              const finalDue = subtractDays(booking.weddingDate, 30)
              const isFinalOverdue = new Date(finalDue) < new Date()

              return (
                <div
                  key={booking.id}
                  style={{ borderTop: i === 0 ? 'none' : '1px solid var(--color-navy-100)', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '16px' }}
                >
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-navy-800)', marginBottom: '2px' }}>
                      {booking.partnerOneName} & {booking.partnerTwoName}
                    </p>
                    <p style={{ fontSize: '12px', color: 'var(--color-navy-400)' }}>
                      {formatDate(booking.weddingDate)} · {booking.packageName ?? 'Photography'}
                    </p>
                  </div>

                  <div style={{ display: 'flex', gap: '16px', alignItems: 'center', fontSize: '12px' }}>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ color: 'var(--color-navy-400)' }}>Retainer</p>
                      <p style={{ fontWeight: 600, color: 'var(--color-navy-700)' }}>{money(retainer)}</p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ color: isFinalOverdue ? '#b91c1c' : 'var(--color-navy-400)' }}>
                        Final {isFinalOverdue ? '(overdue)' : `due ${new Date(finalDue + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`}
                      </p>
                      <p style={{ fontWeight: 600, color: isFinalOverdue ? '#b91c1c' : 'var(--color-navy-700)' }}>{money(finalBal)}</p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ color: 'var(--color-navy-400)' }}>Total</p>
                      <p style={{ fontWeight: 700, color: 'var(--color-navy-900)' }}>{money(booking.packagePrice ?? 0)}</p>
                    </div>
                  </div>

                  <Button size="sm" variant="secondary" onClick={() => setOpenBookingId(booking.id)}>
                    Open invoice
                  </Button>
                </div>
              )
            })}
          </Card>
        )}
      </div>

      {openBooking && (
        <InvoiceModal
          booking={openBooking}
          onClose={() => setOpenBookingId(null)}
        />
      )}
    </AppShell>
  )
}