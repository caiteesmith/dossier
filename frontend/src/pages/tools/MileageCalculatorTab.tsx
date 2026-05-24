import { useState } from 'react'
import { Card } from '@/components/ui'

const IRS_RATE_2025 = 0.70 // $0.70/mile — 2025 IRS standard mileage rate

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

interface TripEntry {
  id: string
  description: string
  miles: number
  date: string
  bookingRef: string
  billable: boolean
}

function StatBox({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div style={{ background: 'white', border: '1px solid var(--color-navy-100)', borderRadius: '10px', padding: '14px 16px' }}>
      <p style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-navy-400)', marginBottom: '4px' }}>{label}</p>
      <p style={{ fontSize: '20px', fontWeight: 700, color: 'var(--color-navy-900)', lineHeight: 1 }}>{value}</p>
      {sub && <p style={{ fontSize: '11px', color: 'var(--color-navy-400)', marginTop: '3px' }}>{sub}</p>}
    </div>
  )
}

export default function MileageCalculatorTab() {
  const [trips, setTrips] = useState<TripEntry[]>([
    { id: '1', description: 'Wedding — Lauren & Chris (Whiteface Lodge)', miles: 142, date: '2026-06-06', bookingRef: 'Lauren & Chris', billable: false },
    { id: '2', description: 'Engagement session — Emma & James', miles: 67, date: '2026-05-10', bookingRef: 'Emma & James', billable: false },
  ])

  const [form, setForm] = useState<Omit<TripEntry, 'id'>>({
    description: '',
    miles: 0,
    date: new Date().toISOString().split('T')[0],
    bookingRef: '',
    billable: false,
  })

  const [irsRate, setIrsRate] = useState(IRS_RATE_2025)
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  function addTrip() {
    if (!form.description || form.miles <= 0) return
    setTrips(prev => [...prev, { ...form, id: `trip-${Date.now()}` }])
    setForm({ description: '', miles: 0, date: new Date().toISOString().split('T')[0], bookingRef: '', billable: false })
    setShowAddForm(false)
  }

  function deleteTrip(id: string) {
    setTrips(prev => prev.filter(t => t.id !== id))
  }

  function updateTrip(id: string, patch: Partial<TripEntry>) {
    setTrips(prev => prev.map(t => t.id === id ? { ...t, ...patch } : t))
  }

  const totalMiles    = trips.reduce((s, t) => s + t.miles, 0)
  const totalDeduction = totalMiles * irsRate
  const thisYear      = new Date().getFullYear()
  const yearTrips     = trips.filter(t => t.date.startsWith(String(thisYear)))
  const yearMiles     = yearTrips.reduce((s, t) => s + t.miles, 0)
  const yearDeduction = yearMiles * irsRate

  // Group by month for the summary
  const byMonth: Record<string, { miles: number; count: number }> = {}
  trips.forEach(t => {
    const month = t.date.slice(0, 7)
    if (!byMonth[month]) byMonth[month] = { miles: 0, count: 0 }
    byMonth[month].miles += t.miles
    byMonth[month].count++
  })
  const months = Object.entries(byMonth).sort((a, b) => b[0].localeCompare(a[0]))

  function exportCSV() {
    const header = 'Date,Description,Booking,Miles,Deduction,Billable'
    const rows = trips.map(t =>
      `${t.date},"${t.description}","${t.bookingRef}",${t.miles},${(t.miles * irsRate).toFixed(2)},${t.billable ? 'Yes' : 'No'}`
    )
    const csv = [header, ...rows].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `mileage-${thisYear}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--color-navy-800)', marginBottom: '4px' }}>Mileage Calculator</h3>
        <p style={{ fontSize: '13px', color: 'var(--color-navy-400)', lineHeight: '1.5' }}>
          Track business mileage for tax deductions. Uses the IRS standard mileage rate.
        </p>
      </div>

      {/* IRS rate + summary stats */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '10px', alignItems: 'start' }}>
        <div style={{ background: 'white', border: '1px solid var(--color-navy-100)', borderRadius: '10px', padding: '14px 16px' }}>
          <label style={labelStyle}>IRS rate ($/mile)</label>
          <input
            type="number"
            value={irsRate}
            onChange={e => setIrsRate(parseFloat(e.target.value) || 0)}
            step={0.01}
            min={0}
            style={{ ...inputStyle, fontSize: '18px', fontWeight: 700, padding: '4px 0', background: 'transparent', border: 'none' }}
          />
          <p style={{ fontSize: '10px', color: 'var(--color-navy-300)', marginTop: '2px' }}>2025 standard rate</p>
        </div>
        <StatBox label={`${thisYear} miles`}     value={yearMiles.toLocaleString()} sub={`${yearTrips.length} trips`} />
        <StatBox label={`${thisYear} deduction`} value={`$${yearDeduction.toFixed(2)}`} sub="estimated" />
        <StatBox label="All-time miles"          value={totalMiles.toLocaleString()} sub={`$${totalDeduction.toFixed(2)} total`} />
      </div>

      {/* Add trip */}
      {showAddForm ? (
        <Card className="p-5">
          <h4 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-navy-700)', marginBottom: '14px' }}>Add trip</h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div style={{ gridColumn: 'span 2' }}>
              <label style={labelStyle}>Description</label>
              <input value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="e.g. Wedding day — Lauren & Chris" style={inputStyle} autoFocus />
            </div>
            <div>
              <label style={labelStyle}>Miles (round trip)</label>
              <input type="number" value={form.miles || ''} onChange={e => setForm(p => ({ ...p, miles: parseFloat(e.target.value) || 0 }))} min={0} step={0.1} style={inputStyle} placeholder="0" />
            </div>
            <div>
              <label style={labelStyle}>Date</label>
              <input type="date" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Booking / client (optional)</label>
              <input value={form.bookingRef} onChange={e => setForm(p => ({ ...p, bookingRef: e.target.value }))} placeholder="e.g. Lauren & Chris" style={inputStyle} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingTop: '18px' }}>
              <input type="checkbox" id="billable" checked={form.billable} onChange={e => setForm(p => ({ ...p, billable: e.target.checked }))} />
              <label htmlFor="billable" style={{ fontSize: '13px', color: 'var(--color-navy-600)', cursor: 'pointer' }}>Client-billable mileage</label>
            </div>
          </div>
          {form.miles > 0 && (
            <p style={{ fontSize: '12px', color: 'var(--color-navy-500)', marginTop: '12px' }}>
              Estimated deduction: <strong>${(form.miles * irsRate).toFixed(2)}</strong>
            </p>
          )}
          <div style={{ display: 'flex', gap: '8px', marginTop: '14px' }}>
            <button
              onClick={addTrip}
              disabled={!form.description || form.miles <= 0}
              style={{ padding: '8px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: 500, border: 'none', background: 'var(--color-navy-800)', color: 'white', cursor: 'pointer', fontFamily: 'inherit', opacity: (!form.description || form.miles <= 0) ? 0.5 : 1 }}
            >
              Add trip
            </button>
            <button
              onClick={() => setShowAddForm(false)}
              style={{ padding: '8px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: 500, border: '1px solid var(--color-navy-200)', background: 'white', color: 'var(--color-navy-600)', cursor: 'pointer', fontFamily: 'inherit' }}
            >
              Cancel
            </button>
          </div>
        </Card>
      ) : (
        <button
          onClick={() => setShowAddForm(true)}
          style={{ padding: '8px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: 500, border: '1px solid var(--color-navy-200)', background: 'white', color: 'var(--color-navy-600)', cursor: 'pointer', fontFamily: 'inherit' }}
        >
          + Add trip
        </button>
      )}

      {/* Trip log */}
      {trips.length > 0 && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <p style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-navy-400)', fontWeight: 600 }}>Trip log</p>
            <button
              onClick={exportCSV}
              style={{ fontSize: '12px', color: 'var(--color-steel-500)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
            >
              Export CSV ↓
            </button>
          </div>
          <Card>
            {trips.sort((a, b) => b.date.localeCompare(a.date)).map((trip, i) => (
              <div
                key={trip.id}
                style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 18px', borderTop: i === 0 ? 'none' : '1px solid var(--color-navy-100)' }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: '13px', fontWeight: 500, color: 'var(--color-navy-800)', marginBottom: '2px' }}>{trip.description}</p>
                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '11px', color: 'var(--color-navy-400)' }}>{new Date(trip.date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                    {trip.bookingRef && <span style={{ fontSize: '11px', color: 'var(--color-navy-400)' }}>· {trip.bookingRef}</span>}
                    {trip.billable && <span style={{ fontSize: '10px', background: 'var(--color-navy-100)', color: 'var(--color-navy-500)', padding: '1px 6px', borderRadius: '10px' }}>Billable</span>}
                  </div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-navy-800)' }}>{trip.miles} mi</p>
                  <p style={{ fontSize: '11px', color: 'var(--color-navy-400)' }}>${(trip.miles * irsRate).toFixed(2)}</p>
                </div>
                <button
                  onClick={() => deleteTrip(trip.id)}
                  style={{ fontSize: '12px', color: 'var(--color-navy-300)', background: 'none', border: 'none', cursor: 'pointer', padding: '4px', lineHeight: 1 }}
                >
                  ✕
                </button>
              </div>
            ))}
          </Card>
        </div>
      )}

      {/* Monthly summary */}
      {months.length > 0 && (
        <div>
          <p style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-navy-400)', fontWeight: 600, marginBottom: '10px' }}>Monthly summary</p>
          <Card>
            {months.map(([month, data], i) => {
              const label = new Date(month + '-15').toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
              return (
                <div key={month} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 18px', borderTop: i === 0 ? 'none' : '1px solid var(--color-navy-100)', fontSize: '13px' }}>
                  <span style={{ color: 'var(--color-navy-600)' }}>{label}</span>
                  <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                    <span style={{ color: 'var(--color-navy-400)', fontSize: '12px' }}>{data.count} trip{data.count !== 1 ? 's' : ''}</span>
                    <span style={{ fontWeight: 600, color: 'var(--color-navy-800)', width: '60px', textAlign: 'right' }}>{data.miles} mi</span>
                    <span style={{ color: 'var(--color-navy-500)', width: '64px', textAlign: 'right' }}>${(data.miles * irsRate).toFixed(2)}</span>
                  </div>
                </div>
              )
            })}
          </Card>
        </div>
      )}

      <p style={{ fontSize: '11px', color: 'var(--color-navy-300)' }}>
        Trips are saved locally for now. Persistent mileage tracking requires the backend. Export CSV for your records.
      </p>
    </div>
  )
}