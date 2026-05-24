import AppShell from '@/components/layout/AppShell'
import { Card, PageHeader, StatCard } from '@/components/ui'
import { useBookings, useLeads } from '@/hooks/useData'
import { SAMPLE_PACKAGES } from '@/data/sample'

function formatCurrency(n: number) {
  return '$' + n.toLocaleString()
}

function pct(a: number, b: number) {
  if (b === 0) return '0%'
  return Math.round((a / b) * 100) + '%'
}

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

export default function AnalyticsPage() {
  const { data: bookings = [] } = useBookings()
  const { data: leads = [] } = useLeads()

  // ── Revenue ──────────────────────────────────────────────────
  const confirmedBookings = bookings.filter(b => b.status === 'confirmed' || b.status === 'completed')
  const totalRevenue = confirmedBookings.reduce((s, b) => s + (b.packagePrice ?? 0), 0)
  const avgBookingValue = confirmedBookings.length > 0
    ? Math.round(totalRevenue / confirmedBookings.length) : 0

  // ── Lead funnel ───────────────────────────────────────────────
  const totalLeads = leads.length
  const bookedLeads = leads.filter(l => l.status === 'booked').length
  const lostLeads = leads.filter(l => l.status === 'lost').length
  const activeLeads = leads.filter(l => !['booked', 'lost'].includes(l.status)).length

  // ── Revenue by month ──────────────────────────────────────────
  const revenueByMonth = Array(12).fill(0)
  confirmedBookings.forEach(b => {
    const month = new Date(b.weddingDate).getMonth()
    revenueByMonth[month] += b.packagePrice ?? 0
  })
  const maxRevMonth = Math.max(...revenueByMonth, 1)

  // ── Bookings by month ─────────────────────────────────────────
  const bookingsByMonth = Array(12).fill(0)
  bookings.forEach(b => {
    const month = new Date(b.weddingDate).getMonth()
    bookingsByMonth[month]++
  })

  // ── Package breakdown ─────────────────────────────────────────
  const packageCounts: Record<string, { count: number; revenue: number }> = {}
  confirmedBookings.forEach(b => {
    const name = b.packageName ?? 'Unknown'
    if (!packageCounts[name]) packageCounts[name] = { count: 0, revenue: 0 }
    packageCounts[name].count++
    packageCounts[name].revenue += b.packagePrice ?? 0
  })

  // ── Lead sources ──────────────────────────────────────────────
  const sourceCounts: Record<string, number> = {}
  leads.forEach(l => {
    const src = l.source?.replace(/_/g, ' ') ?? 'unknown'
    sourceCounts[src] = (sourceCounts[src] ?? 0) + 1
  })
  const topSources = Object.entries(sourceCounts).sort((a, b) => b[1] - a[1])
  const maxSource = Math.max(...Object.values(sourceCounts), 1)

  return (
    <AppShell>
      <div className="px-10 py-10 max-w-5xl">
        <PageHeader
          title="Analytics"
          subtitle="2026 season at a glance"
        />

        {/* Stat cards */}
        <div className="grid grid-cols-4 gap-4 mb-8 stagger-children">
          <StatCard label="Total revenue" value={formatCurrency(totalRevenue)} sub="confirmed bookings" />
          <StatCard label="Avg booking value" value={formatCurrency(avgBookingValue)} sub="per wedding" />
          <StatCard label="Conversion rate" value={pct(bookedLeads, totalLeads)} sub="leads to bookings" />
          <StatCard label="Active leads" value={String(activeLeads)} sub={`${lostLeads} lost`} />
        </div>

        <div className="grid grid-cols-3 gap-6 mb-6">

          {/* Revenue by month */}
          <div className="col-span-2">
            <Card className="p-6">
              <h3 className="text-xs uppercase tracking-widest mb-5" style={{ color: 'var(--color-navy-400)' }}>
                Revenue by wedding month
              </h3>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: '6px', height: '120px' }}>
                {revenueByMonth.map((rev, i) => (
                  <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', height: '100%', justifyContent: 'flex-end' }}>
                    <div
                      style={{
                        width: '100%',
                        background: rev > 0 ? 'var(--color-navy-700)' : 'var(--color-navy-100)',
                        borderRadius: '4px 4px 0 0',
                        height: `${Math.max((rev / maxRevMonth) * 100, rev > 0 ? 8 : 4)}%`,
                        transition: 'height 0.3s ease',
                        position: 'relative',
                      }}
                      title={rev > 0 ? formatCurrency(rev) : 'No weddings'}
                    />
                    <span style={{ fontSize: '9px', color: 'var(--color-navy-400)', letterSpacing: '0.04em' }}>
                      {MONTHS[i]}
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Lead funnel */}
          <Card className="p-6">
            <h3 className="text-xs uppercase tracking-widest mb-5" style={{ color: 'var(--color-navy-400)' }}>
              Lead funnel
            </h3>
            <div className="space-y-3">
              {[
                { label: 'Total inquiries', value: totalLeads, color: 'var(--color-navy-200)' },
                { label: 'Active',          value: activeLeads, color: 'var(--color-steel-400)' },
                { label: 'Booked',          value: bookedLeads, color: 'var(--color-navy-700)' },
                { label: 'Lost',            value: lostLeads,   color: '#fca5a5' },
              ].map(row => (
                <div key={row.label}>
                  <div className="flex justify-between mb-1">
                    <span style={{ fontSize: '12px', color: 'var(--color-navy-500)' }}>{row.label}</span>
                    <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-navy-700)' }}>{row.value}</span>
                  </div>
                  <div style={{ background: 'var(--color-navy-100)', borderRadius: '999px', height: '5px', overflow: 'hidden' }}>
                    <div style={{
                      background: row.color,
                      height: '100%',
                      width: `${totalLeads > 0 ? (row.value / totalLeads) * 100 : 0}%`,
                      borderRadius: '999px',
                    }} />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-2 gap-6 mb-6">

          {/* Package breakdown */}
          <Card className="p-6">
            <h3 className="text-xs uppercase tracking-widest mb-5" style={{ color: 'var(--color-navy-400)' }}>
              Package breakdown
            </h3>
            {Object.keys(packageCounts).length === 0 ? (
              <p style={{ fontSize: '13px', color: 'var(--color-navy-300)', fontStyle: 'italic' }}>No confirmed bookings yet</p>
            ) : (
              <div className="space-y-4">
                {Object.entries(packageCounts).map(([name, { count, revenue }]) => (
                  <div key={name}>
                    <div className="flex justify-between mb-1">
                      <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--color-navy-700)' }}>{name}</span>
                      <span style={{ fontSize: '12px', color: 'var(--color-navy-400)' }}>{count} booking{count !== 1 ? 's' : ''}</span>
                    </div>
                    <div className="flex justify-between">
                      <div style={{ flex: 1, background: 'var(--color-navy-100)', borderRadius: '999px', height: '5px', overflow: 'hidden', marginRight: '12px', alignSelf: 'center' }}>
                        <div style={{
                          background: 'var(--color-navy-600)',
                          height: '100%',
                          width: `${(count / confirmedBookings.length) * 100}%`,
                          borderRadius: '999px',
                        }} />
                      </div>
                      <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-navy-600)', flexShrink: 0 }}>
                        {formatCurrency(revenue)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Lead sources */}
          <Card className="p-6">
            <h3 className="text-xs uppercase tracking-widest mb-5" style={{ color: 'var(--color-navy-400)' }}>
              Lead sources
            </h3>
            <div className="space-y-3">
              {topSources.map(([source, count]) => (
                <div key={source}>
                  <div className="flex justify-between mb-1">
                    <span style={{ fontSize: '12px', color: 'var(--color-navy-600)', textTransform: 'capitalize' }}>{source}</span>
                    <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-navy-700)' }}>{count}</span>
                  </div>
                  <div style={{ background: 'var(--color-navy-100)', borderRadius: '999px', height: '5px', overflow: 'hidden' }}>
                    <div style={{
                      background: 'var(--color-steel-500)',
                      height: '100%',
                      width: `${(count / maxSource) * 100}%`,
                      borderRadius: '999px',
                    }} />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Bookings by month heatmap */}
        <Card className="p-6">
          <h3 className="text-xs uppercase tracking-widest mb-5" style={{ color: 'var(--color-navy-400)' }}>
            Wedding dates by month
          </h3>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {MONTHS.map((month, i) => {
              const count = bookingsByMonth[i]
              return (
                <div key={month} style={{ textAlign: 'center', flex: 1, minWidth: '48px' }}>
                  <div style={{
                    width: '100%',
                    aspectRatio: '1',
                    borderRadius: '8px',
                    background: count === 0
                      ? 'var(--color-navy-100)'
                      : count === 1
                      ? 'var(--color-navy-300)'
                      : count === 2
                      ? 'var(--color-navy-500)'
                      : 'var(--color-navy-800)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '4px',
                  }}>
                    <span style={{
                      fontSize: '14px',
                      fontWeight: 700,
                      color: count === 0 ? 'var(--color-navy-300)' : 'white',
                    }}>
                      {count || ''}
                    </span>
                  </div>
                  <span style={{ fontSize: '10px', color: 'var(--color-navy-400)' }}>{month}</span>
                </div>
              )
            })}
          </div>
        </Card>
      </div>
    </AppShell>
  )
}