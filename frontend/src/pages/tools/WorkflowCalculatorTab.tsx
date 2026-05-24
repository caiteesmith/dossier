import { useState } from 'react'
import { Card } from '@/components/ui'

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

function NumInput({ label, value, onChange, min = 0, step = 1, hint }: {
  label: string; value: number; onChange: (v: number) => void
  min?: number; step?: number; hint?: string
}) {
  return (
    <div>
      <label style={labelStyle}>{label}</label>
      <input
        type="number"
        value={value}
        min={min}
        step={step}
        onChange={e => onChange(parseFloat(e.target.value) || 0)}
        style={inputStyle}
      />
      {hint && <p style={{ fontSize: '11px', color: 'var(--color-navy-300)', marginTop: '4px' }}>{hint}</p>}
    </div>
  )
}

function StatBox({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div style={{ background: 'var(--color-navy-50)', borderRadius: '10px', padding: '14px 16px', border: '1px solid var(--color-navy-100)' }}>
      <p style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-navy-400)', marginBottom: '4px' }}>{label}</p>
      <p style={{ fontSize: '20px', fontWeight: 700, color: 'var(--color-navy-900)', lineHeight: 1 }}>{value}</p>
      {sub && <p style={{ fontSize: '11px', color: 'var(--color-navy-400)', marginTop: '3px' }}>{sub}</p>}
    </div>
  )
}

export default function WorkflowCalculatorTab() {
  const [captured, setCaptured] = useState(3000)
  const [deliveredMode, setDeliveredMode] = useState<'count' | 'percent'>('count')
  const [deliveredCount, setDeliveredCount] = useState(700)
  const [deliveredPct, setDeliveredPct] = useState(25)
  const [cullRate, setCullRate] = useState(800)
  const [editSeconds, setEditSeconds] = useState(35)
  const [weeklyHours, setWeeklyHours] = useState(8)
  const [ingestMin, setIngestMin] = useState(35)
  const [exportMin, setExportMin] = useState(45)

  const delivered = deliveredMode === 'count'
    ? deliveredCount
    : Math.round(captured * (deliveredPct / 100))

  const cullHours    = cullRate > 0 ? captured / cullRate : 0
  const editHours    = (delivered * editSeconds) / 3600
  const overheadHours = (ingestMin + exportMin) / 60
  const totalHours   = cullHours + editHours + overheadHours
  const weeks        = weeklyHours > 0 ? totalHours / weeklyHours : 0

  const overDelivered = delivered > captured

  const scenarios = [
    { label: 'Faster pace', mult: 0.75 },
    { label: 'Baseline',    mult: 1.0  },
    { label: 'Slower pace', mult: 1.25 },
  ].map(({ label, mult }) => {
    const sEdit  = (delivered * editSeconds * mult) / 3600
    const sTotal = cullHours + sEdit + overheadHours
    const sWeeks = weeklyHours > 0 ? sTotal / weeklyHours : 0
    return { label, editSec: Math.round(editSeconds * mult), total: sTotal, weeks: sWeeks }
  })

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--color-navy-800)', marginBottom: '4px' }}>Editing Time Estimator</h3>
        <p style={{ fontSize: '13px', color: 'var(--color-navy-400)', lineHeight: '1.5' }}>
          Estimate your total post-wedding workload — culling, editing, and overhead — based on your shooting and editing pace.
        </p>
      </div>

      <Card className="p-5 space-y-4">
        <h4 style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-navy-600)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Photos</h4>
        <NumInput label="Photos captured" value={captured} onChange={setCaptured} step={50} />

        <div>
          <label style={labelStyle}>Delivered photos</label>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
            {(['count', 'percent'] as const).map(mode => (
              <button
                key={mode}
                onClick={() => setDeliveredMode(mode)}
                style={{
                  padding: '5px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: 500,
                  border: '1px solid var(--color-navy-200)', cursor: 'pointer', fontFamily: 'inherit',
                  background: deliveredMode === mode ? 'var(--color-navy-800)' : 'white',
                  color: deliveredMode === mode ? 'white' : 'var(--color-navy-500)',
                }}
              >
                {mode === 'count' ? 'Enter count' : 'By percentage'}
              </button>
            ))}
          </div>
          {deliveredMode === 'count' ? (
            <NumInput label="Delivered count" value={deliveredCount} onChange={setDeliveredCount} step={25} />
          ) : (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                <label style={labelStyle}>Delivered % of captured</label>
                <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-navy-700)' }}>{deliveredPct}% ({delivered.toLocaleString()} photos)</span>
              </div>
              <input
                type="range" min={5} max={60} step={1}
                value={deliveredPct} onChange={e => setDeliveredPct(parseInt(e.target.value))}
                style={{ width: '100%', accentColor: 'var(--color-navy-800)' }}
              />
            </div>
          )}
          {overDelivered && (
            <p style={{ fontSize: '12px', color: '#b91c1c', marginTop: '6px' }}>
              Delivered count exceeds captured — double check your inputs.
            </p>
          )}
        </div>
      </Card>

      <Card className="p-5 space-y-4">
        <h4 style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-navy-600)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Pace</h4>
        <NumInput label="Culling speed (photos/hour)" value={cullRate} onChange={setCullRate} min={50} step={50} />
        <NumInput label="Avg edit time per delivered photo (seconds)" value={editSeconds} onChange={setEditSeconds} min={1} step={1} />
        <NumInput label="Editing hours available per week" value={weeklyHours} onChange={setWeeklyHours} min={1} step={0.5} />
      </Card>

      <Card className="p-5 space-y-4">
        <h4 style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-navy-600)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Overhead</h4>
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
            <label style={labelStyle}>Ingest & backup</label>
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-navy-700)' }}>{ingestMin} min</span>
          </div>
          <input type="range" min={0} max={180} step={5} value={ingestMin} onChange={e => setIngestMin(parseInt(e.target.value))} style={{ width: '100%', accentColor: 'var(--color-navy-800)' }} />
        </div>
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
            <label style={labelStyle}>Export & upload</label>
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-navy-700)' }}>{exportMin} min</span>
          </div>
          <input type="range" min={0} max={240} step={5} value={exportMin} onChange={e => setExportMin(parseInt(e.target.value))} style={{ width: '100%', accentColor: 'var(--color-navy-800)' }} />
        </div>
      </Card>

      {/* Results */}
      <div>
        <h4 style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-navy-600)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '12px' }}>Results</h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', marginBottom: '16px' }}>
          <StatBox label="Cull time"  value={`${cullHours.toFixed(1)} hrs`} />
          <StatBox label="Edit time"  value={`${editHours.toFixed(1)} hrs`} />
          <StatBox label="Overhead"   value={`${overheadHours.toFixed(1)} hrs`} />
          <StatBox label="Total"      value={`${totalHours.toFixed(1)} hrs`} sub={`~${weeks.toFixed(1)} weeks`} />
        </div>

        <Card className="p-4">
          <p style={{ fontSize: '13px', color: 'var(--color-navy-700)', marginBottom: '12px' }}>
            Delivering <strong>{delivered.toLocaleString()} photos</strong> at <strong>{weeklyHours} hrs/week</strong> — approximately <strong>{weeks.toFixed(1)} weeks</strong> ({Math.ceil(weeks)} weeks with buffer).
          </p>

          <div style={{ borderTop: '1px solid var(--color-navy-100)', paddingTop: '12px' }}>
            <p style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-navy-400)', marginBottom: '8px' }}>What-if scenarios</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {scenarios.map(s => (
                <div key={s.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px' }}>
                  <span style={{ color: 'var(--color-navy-500)' }}>{s.label} ({s.editSec}s/photo)</span>
                  <span style={{ fontWeight: 600, color: 'var(--color-navy-800)' }}>
                    {s.total.toFixed(1)} hrs — {s.weeks.toFixed(1)} weeks
                  </span>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}