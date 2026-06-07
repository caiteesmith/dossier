import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import AppShell from '@/components/layout/AppShell'
import { Badge, Card, Button } from '@/components/ui'
import { useBookingDetail, useToggleTask, useUpdateBooking, useUpdateWorkflowStatus } from '@/hooks/useData'
import type { Vendor } from '@/types'
import { DayOfSheet } from '@/components/booking/DayOfSheet'
import { WeatherWidget } from '@/components/ui/WeatherWidget'
import { SAMPLE_QUESTIONNAIRE_RESPONSE } from '@/data/questionnaire'
import ShotListTab from './ShotListTab'
import TimelineTab from './TimelineTab'
import BlogGeneratorTab from './BlogGeneratorTab'
import AddTaskForm from '@/components/forms/AddTaskForm'
import AddVendorForm from '@/components/forms/AddVendorForm'
import AddShotGroupForm from '@/components/forms/AddShotGroupForm'

// ── Types ─────────────────────────────────────────────────────────

type WorkflowStatus =
  | 'lead' | 'booked' | 'contracted' | 'deposit_paid'
  | 'shooting' | 'culling' | 'editing' | 'delivered' | 'complete'

const WORKFLOW_STAGES: { id: WorkflowStatus; label: string; icon: string }[] = [
  { id: 'lead',         label: 'Lead',         icon: '◎' },
  { id: 'booked',       label: 'Booked',       icon: '◉' },
  { id: 'contracted',   label: 'Contracted',   icon: '📝' },
  { id: 'deposit_paid', label: 'Deposit paid', icon: '💰' },
  { id: 'shooting',     label: 'Shooting',     icon: '📷' },
  { id: 'culling',      label: 'Culling',      icon: '🗂' },
  { id: 'editing',      label: 'Editing',      icon: '✏️' },
  { id: 'delivered',    label: 'Delivered',    icon: '📦' },
  { id: 'complete',     label: 'Complete',     icon: '✓' },
]

interface Session {
  id: string
  type: 'engagement' | 'family' | 'maternity' | 'boudoir' | 'custom'
  customType?: string
  date: string
  time?: string
  duration?: string
  location: string
  secondShooter?: string
  price?: number
  deliveryDeadline?: string
  notes?: string
  createdAt: string
}

interface CallLog {
  id: string
  type: 'phone' | 'google_meet' | 'zoom' | 'facetime' | 'other'
  date: string
  time?: string
  duration?: string
  notes?: string
  outcome?: string
  createdAt: string
}

// ── Helpers ───────────────────────────────────────────────────────

function formatDate(dateStr: string) {
  const [year, month, day] = dateStr.split('-').map(Number)
  return new Date(year, month - 1, day).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
}

function formatDateShort(dateStr: string) {
  const [year, month, day] = dateStr.split('-').map(Number)
  return new Date(year, month - 1, day).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function formatTime(timeStr: string) {
  if (!timeStr) return ''
  const [h, m] = timeStr.split(':').map(Number)
  const ampm = h >= 12 ? 'pm' : 'am'
  return `${h % 12 || 12}:${m.toString().padStart(2, '0')}${ampm}`
}

function daysUntil(dateStr: string) {
  const [year, month, day] = dateStr.split('-').map(Number)
  return Math.ceil((new Date(year, month - 1, day).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
}

type Tab = 'overview' | 'tasks' | 'sessions' | 'calls' | 'timeline' | 'shotlist' | 'vendors' | 'blog'

const TABS: { id: Tab; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'tasks',    label: 'Tasks' },
  { id: 'sessions', label: 'Sessions' },
  { id: 'calls',    label: 'Calls' },
  { id: 'timeline', label: 'Timeline' },
  { id: 'shotlist', label: 'Shot list' },
  { id: 'vendors',  label: 'Vendors' },
  { id: 'blog',     label: 'Blog post' },
]

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-sm">
      <span style={{ color: 'var(--color-navy-400)' }}>{label}</span>
      <span className="font-medium text-right" style={{ color: 'var(--color-navy-800)' }}>{value}</span>
    </div>
  )
}

const iS = {
  width: '100%', background: 'var(--color-fog)', border: '1px solid var(--color-navy-200)',
  borderRadius: '6px', padding: '7px 10px', fontSize: '13px', color: 'var(--color-navy-800)',
  outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' as const,
}

const lS: React.CSSProperties = {
  display: 'block', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.08em',
  color: 'var(--color-navy-400)', marginBottom: '4px', fontWeight: 600,
}

const modalIS = {
  width: '100%', background: 'var(--color-fog)', border: '1px solid var(--color-navy-100)',
  borderRadius: '8px', padding: '9px 12px', fontSize: '13px', color: 'var(--color-navy-800)',
  outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' as const,
}

const modalLS: React.CSSProperties = {
  display: 'block', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em',
  color: 'var(--color-navy-400)', marginBottom: '5px', fontWeight: 500,
}

const DURATIONS = ['15 min', '30 min', '45 min', '1 hour', '1.5 hours', '2 hours', '3 hours', '4 hours', '6 hours', '8 hours']

// ── Workflow pipeline ─────────────────────────────────────────────

function WorkflowPipeline({ status, onChange }: { status: WorkflowStatus; onChange: (s: WorkflowStatus) => void }) {
  const currentIdx = WORKFLOW_STAGES.findIndex(s => s.id === status)
  return (
    <div style={{ background: 'white', border: '1px solid var(--color-navy-100)', borderRadius: '12px', padding: '16px 20px', marginBottom: '24px', overflowX: 'auto' }}>
      <p style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-navy-400)', fontWeight: 600, marginBottom: '14px' }}>Workflow status</p>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0', minWidth: 'max-content' }}>
        {WORKFLOW_STAGES.map((stage, idx) => {
          const isDone = idx < currentIdx
          const isCurrent = idx === currentIdx
          const isNext = idx === currentIdx + 1
          return (
            <div key={stage.id} style={{ display: 'flex', alignItems: 'center' }}>
              <button onClick={() => onChange(stage.id)} title={stage.label}
                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', padding: '6px 10px', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', borderRadius: '8px', transition: 'background 0.15s' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-fog)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'none')}>
                <div style={{
                  width: '28px', height: '28px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: isDone ? '12px' : '14px', flexShrink: 0, transition: 'all 0.2s',
                  background: isDone ? 'var(--color-navy-800)' : isCurrent ? 'var(--color-gold-warm)' : 'var(--color-navy-100)',
                  color: isDone || isCurrent ? 'white' : 'var(--color-navy-400)',
                  border: isNext ? '2px dashed var(--color-navy-300)' : 'none',
                }}>
                  {isDone ? '✓' : stage.icon}
                </div>
                <span style={{ fontSize: '10px', whiteSpace: 'nowrap', fontWeight: isCurrent ? 700 : 500, color: isCurrent ? 'var(--color-navy-900)' : isDone ? 'var(--color-navy-500)' : 'var(--color-navy-300)' }}>
                  {stage.label}
                </span>
              </button>
              {idx < WORKFLOW_STAGES.length - 1 && (
                <div style={{ width: '24px', height: '2px', background: idx < currentIdx ? 'var(--color-navy-800)' : 'var(--color-navy-100)', flexShrink: 0, transition: 'background 0.2s' }} />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Sessions tab ──────────────────────────────────────────────────

const SESSION_TYPES = [
  { value: 'engagement', label: 'Engagement', icon: '💍' },
  { value: 'family',     label: 'Family',     icon: '👨‍👩‍👧' },
  { value: 'maternity',  label: 'Maternity',  icon: '🤰' },
  { value: 'boudoir',    label: 'Boudoir',    icon: '✨' },
  { value: 'custom',     label: 'Custom',     icon: '📸' },
] as const

function AddSessionModal({ onClose, onSave }: { onClose: () => void; onSave: (s: Session) => void }) {
  const [form, setForm] = useState({ type: 'engagement' as Session['type'], customType: '', date: '', time: '', duration: '2 hours', location: '', secondShooter: '', price: '', deliveryDeadline: '', notes: '' })
  function set(field: string, value: string) { setForm(p => ({ ...p, [field]: value })) }
  function handleSave() {
    if (!form.date || !form.location.trim()) return
    onSave({ id: `sess_${Date.now()}`, type: form.type, customType: form.customType || undefined, date: form.date, time: form.time || undefined, duration: form.duration, location: form.location.trim(), secondShooter: form.secondShooter || undefined, price: form.price ? parseFloat(form.price) : undefined, deliveryDeadline: form.deliveryDeadline || undefined, notes: form.notes || undefined, createdAt: new Date().toISOString() })
    onClose()
  }
  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(13,21,37,0.5)', zIndex: 50, backdropFilter: 'blur(2px)' }} />
      <div style={{ position: 'fixed', inset: 0, zIndex: 51, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
        <div style={{ background: 'white', borderRadius: '16px', width: '100%', maxWidth: '540px', maxHeight: '90vh', overflow: 'auto', boxShadow: '0 24px 64px rgba(13,21,37,0.25)' }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--color-navy-100)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--color-navy-900)' }}>Add session</h2>
            <button onClick={onClose} style={{ fontSize: '18px', color: 'var(--color-navy-400)', background: 'none', border: 'none', cursor: 'pointer' }}>×</button>
          </div>
          <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={modalLS}>Session type</label>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {SESSION_TYPES.map(t => (
                  <button key={t.value} onClick={() => set('type', t.value)} style={{ padding: '7px 14px', borderRadius: '20px', fontSize: '13px', fontWeight: 500, border: '1px solid var(--color-navy-200)', cursor: 'pointer', fontFamily: 'inherit', background: form.type === t.value ? 'var(--color-navy-800)' : 'white', color: form.type === t.value ? 'white' : 'var(--color-navy-600)' }}>{t.icon} {t.label}</button>
                ))}
              </div>
              {form.type === 'custom' && <input value={form.customType} onChange={e => set('customType', e.target.value)} placeholder="Session type name" style={{ ...modalIS, marginTop: '8px' }} />}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div><label style={modalLS}>Date *</label><input type="date" value={form.date} onChange={e => set('date', e.target.value)} style={modalIS} /></div>
              <div><label style={modalLS}>Time</label><input type="time" value={form.time} onChange={e => set('time', e.target.value)} style={modalIS} /></div>
              <div><label style={modalLS}>Duration</label><select value={form.duration} onChange={e => set('duration', e.target.value)} style={{ ...modalIS, cursor: 'pointer' }}>{DURATIONS.map(d => <option key={d}>{d}</option>)}</select></div>
              <div><label style={modalLS}>Price</label><div style={{ position: 'relative' }}><span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-navy-400)', fontSize: '13px' }}>$</span><input type="number" value={form.price} onChange={e => set('price', e.target.value)} style={{ ...modalIS, paddingLeft: '24px' }} /></div></div>
            </div>
            <div><label style={modalLS}>Location *</label><input value={form.location} onChange={e => set('location', e.target.value)} placeholder="e.g. Central Park" style={modalIS} /></div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div><label style={modalLS}>Second shooter</label><input value={form.secondShooter} onChange={e => set('secondShooter', e.target.value)} style={modalIS} /></div>
              <div><label style={modalLS}>Delivery deadline</label><input type="date" value={form.deliveryDeadline} onChange={e => set('deliveryDeadline', e.target.value)} style={modalIS} /></div>
            </div>
            <div><label style={modalLS}>Notes</label><textarea value={form.notes} onChange={e => set('notes', e.target.value)} rows={3} style={{ ...modalIS, resize: 'vertical' as const }} /></div>
          </div>
          <div style={{ padding: '14px 24px', borderTop: '1px solid var(--color-navy-100)', display: 'flex', justifyContent: 'flex-end', gap: '10px', background: 'var(--color-fog)' }}>
            <button onClick={onClose} style={{ fontSize: '13px', padding: '8px 16px', borderRadius: '8px', border: '1px solid var(--color-navy-200)', background: 'white', cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
            <Button onClick={handleSave} disabled={!form.date || !form.location.trim()}>Add session</Button>
          </div>
        </div>
      </div>
    </>
  )
}

function SessionsTab({ sessions, onAdd, onDelete }: { sessions: Session[]; onAdd: (s: Session) => void; onDelete: (id: string) => void }) {
  const [showAdd, setShowAdd] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const sorted = [...sessions].sort((a, b) => a.date.localeCompare(b.date))
  return (
    <div className="space-y-4">
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}><Button size="sm" onClick={() => setShowAdd(true)}>+ Add session</Button></div>
      {sessions.length === 0 ? (
        <Card className="p-8 text-center"><p style={{ fontSize: '24px', marginBottom: '8px' }}>📸</p><p style={{ fontSize: '13px', color: 'var(--color-navy-400)' }}>No additional sessions yet. Add an engagement shoot, family session, or any other shoot tied to this wedding.</p></Card>
      ) : (
        <div className="space-y-3">
          {sorted.map(session => {
            const typeInfo = SESSION_TYPES.find(t => t.value === session.type)
            const days = daysUntil(session.date)
            const isPast = days < 0
            return (
              <Card key={session.id} className="p-5">
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                      <span style={{ fontSize: '18px' }}>{typeInfo?.icon ?? '📸'}</span>
                      <p style={{ fontSize: '15px', fontWeight: 600, color: 'var(--color-navy-800)' }}>{session.type === 'custom' ? session.customType || 'Custom session' : typeInfo?.label}</p>
                      {!isPast && days <= 7 && days >= 0 && <span style={{ fontSize: '11px', background: '#fef3e2', color: 'var(--color-gold-warm)', padding: '2px 8px', borderRadius: '20px', fontWeight: 600 }}>{days === 0 ? 'Today' : days === 1 ? 'Tomorrow' : `${days} days`}</span>}
                      {isPast && <span style={{ fontSize: '11px', background: 'var(--color-navy-50)', color: 'var(--color-navy-400)', padding: '2px 8px', borderRadius: '20px' }}>Past</span>}
                    </div>
                    <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', fontSize: '12px', color: 'var(--color-navy-500)' }}>
                      <span>📅 {formatDateShort(session.date)}</span>
                      {session.time && <span>⏰ {formatTime(session.time)}</span>}
                      {session.duration && <span>⏱ {session.duration}</span>}
                      <span>📍 {session.location}</span>
                      {session.price && <span>💰 ${session.price.toLocaleString()}</span>}
                      {session.secondShooter && <span>📷 2nd: {session.secondShooter}</span>}
                      {session.deliveryDeadline && <span>🚚 Deliver by {formatDateShort(session.deliveryDeadline)}</span>}
                    </div>
                    {session.notes && <p style={{ fontSize: '12px', color: 'var(--color-navy-400)', fontStyle: 'italic', marginTop: '6px' }}>{session.notes}</p>}
                  </div>
                  <button onClick={() => setConfirmDelete(session.id)} style={{ fontSize: '12px', color: 'var(--color-navy-300)', background: 'none', border: 'none', cursor: 'pointer', padding: '0 4px', flexShrink: 0 }} onMouseEnter={e => (e.currentTarget.style.color = '#ef4444')} onMouseLeave={e => (e.currentTarget.style.color = 'var(--color-navy-300)')}>✕</button>
                </div>
              </Card>
            )
          })}
        </div>
      )}
      {showAdd && <AddSessionModal onClose={() => setShowAdd(false)} onSave={s => { onAdd(s); setShowAdd(false) }} />}
      {confirmDelete && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div style={{ background: 'white', borderRadius: '12px', padding: '24px', maxWidth: '360px', width: '90%', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
            <p className="font-medium text-sm mb-2" style={{ color: 'var(--color-navy-800)' }}>Delete session?</p>
            <p className="text-xs mb-6" style={{ color: 'var(--color-navy-400)' }}>This cannot be undone.</p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setConfirmDelete(null)} style={{ fontSize: '13px', padding: '8px 16px', borderRadius: '8px', border: '1px solid var(--color-navy-200)', background: 'white', cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
              <button onClick={() => { onDelete(confirmDelete); setConfirmDelete(null) }} style={{ fontSize: '13px', padding: '8px 16px', borderRadius: '8px', border: 'none', background: '#ef4444', color: 'white', cursor: 'pointer', fontFamily: 'inherit' }}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Calls tab ─────────────────────────────────────────────────────

const CALL_TYPES = [
  { value: 'phone',       label: 'Phone call',  icon: '📞' },
  { value: 'google_meet', label: 'Google Meet', icon: '🎥' },
  { value: 'zoom',        label: 'Zoom',        icon: '💻' },
  { value: 'facetime',    label: 'FaceTime',    icon: '📱' },
  { value: 'other',       label: 'Other',       icon: '💬' },
] as const

function AddCallModal({ onClose, onSave }: { onClose: () => void; onSave: (c: CallLog) => void }) {
  const [form, setForm] = useState({ type: 'phone' as CallLog['type'], date: '', time: '', duration: '30 min', notes: '', outcome: '' })
  function set(field: string, value: string) { setForm(p => ({ ...p, [field]: value })) }
  function handleSave() {
    if (!form.date) return
    onSave({ id: `call_${Date.now()}`, type: form.type, date: form.date, time: form.time || undefined, duration: form.duration, notes: form.notes || undefined, outcome: form.outcome || undefined, createdAt: new Date().toISOString() })
    onClose()
  }
  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(13,21,37,0.5)', zIndex: 50, backdropFilter: 'blur(2px)' }} />
      <div style={{ position: 'fixed', inset: 0, zIndex: 51, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
        <div style={{ background: 'white', borderRadius: '16px', width: '100%', maxWidth: '480px', maxHeight: '90vh', overflow: 'auto', boxShadow: '0 24px 64px rgba(13,21,37,0.25)' }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--color-navy-100)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--color-navy-900)' }}>Log call</h2>
            <button onClick={onClose} style={{ fontSize: '18px', color: 'var(--color-navy-400)', background: 'none', border: 'none', cursor: 'pointer' }}>×</button>
          </div>
          <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={modalLS}>Call type</label>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {CALL_TYPES.map(t => (
                  <button key={t.value} onClick={() => set('type', t.value)} style={{ padding: '7px 14px', borderRadius: '20px', fontSize: '13px', fontWeight: 500, border: '1px solid var(--color-navy-200)', cursor: 'pointer', fontFamily: 'inherit', background: form.type === t.value ? 'var(--color-navy-800)' : 'white', color: form.type === t.value ? 'white' : 'var(--color-navy-600)' }}>{t.icon} {t.label}</button>
                ))}
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div><label style={modalLS}>Date *</label><input type="date" value={form.date} onChange={e => set('date', e.target.value)} style={modalIS} /></div>
              <div><label style={modalLS}>Time</label><input type="time" value={form.time} onChange={e => set('time', e.target.value)} style={modalIS} /></div>
              <div style={{ gridColumn: 'span 2' }}><label style={modalLS}>Duration</label><select value={form.duration} onChange={e => set('duration', e.target.value)} style={{ ...modalIS, cursor: 'pointer' }}>{DURATIONS.map(d => <option key={d}>{d}</option>)}</select></div>
            </div>
            <div><label style={modalLS}>Notes</label><textarea value={form.notes} onChange={e => set('notes', e.target.value)} rows={3} placeholder="What was discussed?" style={{ ...modalIS, resize: 'vertical' as const }} /></div>
            <div><label style={modalLS}>Outcome / next steps</label><input value={form.outcome} onChange={e => set('outcome', e.target.value)} placeholder="e.g. Sent contract, scheduled engagement" style={modalIS} /></div>
          </div>
          <div style={{ padding: '14px 24px', borderTop: '1px solid var(--color-navy-100)', display: 'flex', justifyContent: 'flex-end', gap: '10px', background: 'var(--color-fog)' }}>
            <button onClick={onClose} style={{ fontSize: '13px', padding: '8px 16px', borderRadius: '8px', border: '1px solid var(--color-navy-200)', background: 'white', cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
            <Button onClick={handleSave} disabled={!form.date}>Log call</Button>
          </div>
        </div>
      </div>
    </>
  )
}

function CallsTab({ calls, onAdd, onDelete }: { calls: CallLog[]; onAdd: (c: CallLog) => void; onDelete: (id: string) => void }) {
  const [showAdd, setShowAdd] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const sorted = [...calls].sort((a, b) => b.date.localeCompare(a.date))
  return (
    <div className="space-y-4">
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}><Button size="sm" onClick={() => setShowAdd(true)}>+ Log call</Button></div>
      {calls.length === 0 ? (
        <Card className="p-8 text-center"><p style={{ fontSize: '24px', marginBottom: '8px' }}>📞</p><p style={{ fontSize: '13px', color: 'var(--color-navy-400)' }}>No calls logged yet. Track your consultations, check-ins, and planning calls here.</p></Card>
      ) : (
        <Card>
          <div>
            {sorted.map((call, i) => {
              const typeInfo = CALL_TYPES.find(t => t.value === call.type)
              return (
                <div key={call.id} style={{ borderTop: i === 0 ? 'none' : '1px solid var(--color-navy-100)', padding: '14px 18px', display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                  <span style={{ fontSize: '20px', flexShrink: 0 }}>{typeInfo?.icon ?? '💬'}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px' }}>
                      <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-navy-800)' }}>{typeInfo?.label}</p>
                      <span style={{ fontSize: '12px', color: 'var(--color-navy-400)' }}>{formatDateShort(call.date)}{call.time ? ` at ${formatTime(call.time)}` : ''}{call.duration ? ` · ${call.duration}` : ''}</span>
                    </div>
                    {call.notes && <p style={{ fontSize: '12px', color: 'var(--color-navy-500)', marginBottom: '2px' }}>{call.notes}</p>}
                    {call.outcome && <p style={{ fontSize: '12px', color: 'var(--color-steel-600)', fontWeight: 500 }}>→ {call.outcome}</p>}
                  </div>
                  <button onClick={() => setConfirmDelete(call.id)} style={{ fontSize: '12px', color: 'var(--color-navy-300)', background: 'none', border: 'none', cursor: 'pointer', padding: '0 4px', flexShrink: 0 }} onMouseEnter={e => (e.currentTarget.style.color = '#ef4444')} onMouseLeave={e => (e.currentTarget.style.color = 'var(--color-navy-300)')}>✕</button>
                </div>
              )
            })}
          </div>
        </Card>
      )}
      {showAdd && <AddCallModal onClose={() => setShowAdd(false)} onSave={c => { onAdd(c); setShowAdd(false) }} />}
      {confirmDelete && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div style={{ background: 'white', borderRadius: '12px', padding: '24px', maxWidth: '360px', width: '90%', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
            <p className="font-medium text-sm mb-2" style={{ color: 'var(--color-navy-800)' }}>Delete call log?</p>
            <p className="text-xs mb-6" style={{ color: 'var(--color-navy-400)' }}>This cannot be undone.</p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setConfirmDelete(null)} style={{ fontSize: '13px', padding: '8px 16px', borderRadius: '8px', border: '1px solid var(--color-navy-200)', background: 'white', cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
              <button onClick={() => { onDelete(confirmDelete); setConfirmDelete(null) }} style={{ fontSize: '13px', padding: '8px 16px', borderRadius: '8px', border: 'none', background: '#ef4444', color: 'white', cursor: 'pointer', fontFamily: 'inherit' }}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Overview tab ──────────────────────────────────────────────────

function OverviewTab({ bookingId }: { bookingId: string }) {
  const { data } = useBookingDetail(bookingId)
  const updateBooking = useUpdateBooking()
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({
    partnerOneName: '', partnerTwoName: '', email: '', phone: '', weddingDate: '',
    venueName: '', venueAddress: '', venueLat: '', venueLng: '', packageName: '',
    packagePrice: '', hoursCovered: '', notes: '', partnerOneLegalName: '',
    partnerTwoLegalName: '', marriedSurname: '', mailingAddress: '', mailingCity: '', mailingState: '', mailingZip: '',
  })
  if (!data) return null

  function startEdit() {
    setForm({
      partnerOneName: data!.partnerOneName, partnerTwoName: data!.partnerTwoName,
      email: data!.email, phone: data!.phone ?? '', weddingDate: data!.weddingDate,
      venueName: data!.venueName, venueAddress: data!.venueAddress ?? '',
      venueLat: data!.venueLat ? String(data!.venueLat) : '',
      venueLng: data!.venueLng ? String(data!.venueLng) : '',
      packageName: data!.packageName ?? '',
      packagePrice: data!.packagePrice ? String(data!.packagePrice) : '',
      hoursCovered: data!.hoursCovered ? String(data!.hoursCovered) : '',
      notes: data!.notes ?? '',
      partnerOneLegalName: (data as any).partnerOneLegalName ?? '',
      partnerTwoLegalName: (data as any).partnerTwoLegalName ?? '',
      marriedSurname: (data as any).marriedSurname ?? '',
      mailingAddress: (data as any).mailingAddress ?? '',
      mailingCity: (data as any).mailingCity ?? '',
      mailingState: (data as any).mailingState ?? '',
      mailingZip: (data as any).mailingZip ?? '',
    })
    setEditing(true)
  }

  function handleSave() {
    updateBooking.mutate({
      id: bookingId, partnerOneName: form.partnerOneName, partnerTwoName: form.partnerTwoName,
      email: form.email, phone: form.phone || undefined, weddingDate: form.weddingDate,
      venueName: form.venueName, venueAddress: form.venueAddress || undefined,
      venueLat: form.venueLat ? parseFloat(form.venueLat) : undefined,
      venueLng: form.venueLng ? parseFloat(form.venueLng) : undefined,
      packageName: form.packageName || undefined,
      packagePrice: form.packagePrice ? parseFloat(form.packagePrice) : undefined,
      hoursCovered: form.hoursCovered ? parseFloat(form.hoursCovered) : undefined,
      notes: form.notes || undefined,
      partnerOneLegalName: form.partnerOneLegalName || undefined,
      partnerTwoLegalName: form.partnerTwoLegalName || undefined,
      marriedSurname: form.marriedSurname || undefined,
      mailingAddress: form.mailingAddress || undefined,
      mailingCity: form.mailingCity || undefined,
      mailingState: form.mailingState || undefined,
      mailingZip: form.mailingZip || undefined,
    }, { onSuccess: () => setEditing(false) })
  }

  function F({ label, field, type = 'text', placeholder, span2 }: { label: string; field: keyof typeof form; type?: string; placeholder?: string; span2?: boolean }) {
    return (
      <div style={span2 ? { gridColumn: 'span 2' } : {}}>
        <label style={lS}>{label}</label>
        <input type={type} value={form[field]} onChange={e => setForm(p => ({ ...p, [field]: e.target.value }))} placeholder={placeholder} style={iS} />
      </div>
    )
  }

  const completedTasks = data.tasks.filter(t => t.completed).length
  const totalTasks = data.tasks.length
  const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

  return (
    <div className="grid grid-cols-2 gap-6">
      <Card className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs uppercase tracking-widest" style={{ color: 'var(--color-navy-400)' }}>Wedding details</h3>
          {editing ? (
            <div className="flex gap-2 items-center">
              <button onClick={handleSave} disabled={updateBooking.isPending} style={{ fontSize: '12px', fontWeight: 600, color: 'white', background: 'var(--color-navy-800)', border: 'none', borderRadius: '6px', padding: '4px 12px', cursor: 'pointer', fontFamily: 'inherit', opacity: updateBooking.isPending ? 0.7 : 1 }}>{updateBooking.isPending ? 'Saving...' : 'Save'}</button>
              <button onClick={() => setEditing(false)} style={{ fontSize: '12px', color: 'var(--color-navy-400)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
            </div>
          ) : (
            <button onClick={startEdit} style={{ fontSize: '12px', color: 'var(--color-navy-400)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>Edit</button>
          )}
        </div>
        {editing ? (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <F label="Partner 1" field="partnerOneName" /><F label="Partner 2" field="partnerTwoName" />
            <F label="Email" field="email" type="email" /><F label="Phone" field="phone" type="tel" />
            <F label="Wedding date" field="weddingDate" type="date" /><F label="Package" field="packageName" placeholder="e.g. Signature" />
            <F label="Venue name" field="venueName" span2 />
            <F label="Venue address" field="venueAddress" placeholder="123 Main St, City, State" span2 />
            <F label="Latitude" field="venueLat" placeholder="44.3793" /><F label="Longitude" field="venueLng" placeholder="-73.9799" />
            <F label="Price" field="packagePrice" type="number" /><F label="Hours" field="hoursCovered" type="number" />
            <div style={{ gridColumn: 'span 2' }}>
              <label style={lS}>Notes</label>
              <textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} rows={3} style={{ ...iS, resize: 'vertical' }} />
            </div>
            <div style={{ gridColumn: 'span 2', borderTop: '1px solid var(--color-navy-100)', paddingTop: '10px' }}>
              <p style={{ fontSize: '10px', textTransform: 'uppercase' as const, letterSpacing: '0.08em', color: 'var(--color-navy-400)', fontWeight: 600, marginBottom: '10px' }}>Legal & address</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <F label="Partner 1 legal name" field="partnerOneLegalName" placeholder="As on ID" />
                <F label="Partner 2 legal name" field="partnerTwoLegalName" placeholder="As on ID" />
                <F label="Married surname" field="marriedSurname" span2 placeholder="e.g. Mitchell-Chen" />
                <F label="Street address" field="mailingAddress" span2 placeholder="123 Main St" />
                <F label="City" field="mailingCity" />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <F label="State" field="mailingState" placeholder="NY" /><F label="ZIP" field="mailingZip" placeholder="12345" />
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <Row label="Date" value={formatDate(data.weddingDate)} />
            <Row label="Venue" value={data.venueName} />
            {data.venueAddress && <Row label="Address" value={data.venueAddress} />}
            {data.packageName && <Row label="Package" value={`${data.packageName}${data.packagePrice ? ' | $' + data.packagePrice.toLocaleString() : ''}`} />}
            {data.hoursCovered && <Row label="Coverage" value={data.hoursCovered + 'h'} />}
            {data.notes && <Row label="Notes" value={data.notes} />}
            {(data as any).partnerOneLegalName && <Row label="Legal name 1" value={(data as any).partnerOneLegalName} />}
            {(data as any).partnerTwoLegalName && <Row label="Legal name 2" value={(data as any).partnerTwoLegalName} />}
            {(data as any).marriedSurname && <Row label="Married surname" value={(data as any).marriedSurname} />}
          </div>
        )}
      </Card>
      <div className="space-y-3">
        <h3 className="text-xs uppercase tracking-widest" style={{ color: 'var(--color-navy-400)' }}>Weather & light</h3>
        <WeatherWidget booking={data} compact={false} />
      </div>
      <Card className="p-6 col-span-2">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs uppercase tracking-widest" style={{ color: 'var(--color-navy-400)' }}>Milestone progress</h3>
          <span className="text-sm font-medium" style={{ color: 'var(--color-navy-700)' }}>{completedTasks} / {totalTasks} complete</span>
        </div>
        <div className="w-full rounded-full h-1.5 mb-4" style={{ background: 'var(--color-navy-100)' }}>
          <div className="h-1.5 rounded-full transition-all duration-500" style={{ width: progress + '%', background: 'var(--color-navy-700)' }} />
        </div>
        <div className="grid grid-cols-2 gap-2">
          {data.tasks.slice(0, 6).map(task => (
            <div key={task.id} className="flex items-center gap-2 text-sm">
              <span style={{ color: task.completed ? '#276840' : 'var(--color-navy-300)' }}>{task.completed ? '✓' : '○'}</span>
              <span style={{ color: task.completed ? 'var(--color-navy-400)' : 'var(--color-navy-700)', textDecoration: task.completed ? 'line-through' : 'none' }}>{task.title}</span>
            </div>
          ))}
        </div>
        {data.notes && (
          <div className="mt-4 pt-4" style={{ borderTop: '1px solid var(--color-navy-100)' }}>
            <p className="text-xs uppercase tracking-widest mb-1" style={{ color: 'var(--color-navy-400)' }}>Notes</p>
            <p className="text-sm italic" style={{ color: 'var(--color-navy-600)' }}>{data.notes}</p>
          </div>
        )}
      </Card>
    </div>
  )
}

// ── Tasks tab ─────────────────────────────────────────────────────

function TasksTab({ bookingId }: { bookingId: string }) {
  const { data } = useBookingDetail(bookingId)
  const toggleTask = useToggleTask()
  const [showAdd, setShowAdd] = useState(false)
  if (!data) return null
  const categories = ['admin', 'client', 'day_of', 'post_wedding', 'manual'] as const
  const categoryLabels: Record<string, string> = { admin: 'Admin', client: 'Client', day_of: 'Day of', post_wedding: 'Post wedding', manual: 'Custom' }
  return (
    <div className="space-y-6">
      {categories.map(cat => {
        const tasks = data.tasks.filter(t => t.category === cat)
        if (tasks.length === 0) return null
        return (
          <div key={cat}>
            <h3 className="text-xs uppercase tracking-widest mb-3" style={{ color: 'var(--color-navy-400)' }}>{categoryLabels[cat]}</h3>
            <Card>
              <div>
                {tasks.map((task, i) => (
                  <label key={task.id} className="flex items-center gap-3 px-5 py-3.5 cursor-pointer transition-colors" style={{ borderTop: i === 0 ? 'none' : '1px solid var(--color-navy-100)' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-fog)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                    <input type="checkbox" checked={task.completed} onChange={e => toggleTask.mutate({ bookingId, taskId: task.id, completed: e.target.checked })} className="w-4 h-4 rounded" />
                    <span className="text-sm flex-1" style={{ color: task.completed ? 'var(--color-navy-400)' : 'var(--color-navy-800)', textDecoration: task.completed ? 'line-through' : 'none' }}>{task.title}</span>
                    {task.dueDate && <span className="text-xs" style={{ color: 'var(--color-navy-400)' }}>due {new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>}
                  </label>
                ))}
              </div>
            </Card>
          </div>
        )
      })}
      {showAdd ? <AddTaskForm bookingId={bookingId} onClose={() => setShowAdd(false)} /> : <button onClick={() => setShowAdd(true)} style={{ fontSize: '13px', color: 'var(--color-navy-400)', background: 'none', border: '1px dashed var(--color-navy-200)', borderRadius: '8px', padding: '8px 16px', cursor: 'pointer', fontFamily: 'inherit', width: '100%' }}>+ Add task</button>}
    </div>
  )
}

// ── Vendors tab ───────────────────────────────────────────────────

function VendorsTab({ bookingId, vendors }: { bookingId: string; vendors: Vendor[] }) {
  const [showAdd, setShowAdd] = useState(false)
  return (
    <div className="space-y-2">
      <Card>
        <div>
          {vendors.length === 0 && <div className="px-6 py-8 text-center"><p className="text-sm italic" style={{ color: 'var(--color-navy-400)' }}>No vendors added yet</p></div>}
          {vendors.map((vendor, i) => (
            <div key={vendor.id} className="flex items-center justify-between px-6 py-4" style={{ borderTop: i === 0 ? 'none' : '1px solid var(--color-navy-100)' }}>
              <div>
                <div className="flex items-center gap-3">
                  <span className="text-xs uppercase tracking-widest w-28 shrink-0" style={{ color: 'var(--color-navy-400)' }}>{vendor.role}</span>
                  <span className="text-sm font-medium" style={{ color: 'var(--color-navy-800)' }}>{vendor.name}</span>
                </div>
                {vendor.notes && <p className="text-xs italic mt-1" style={{ color: 'var(--color-navy-400)', marginLeft: '124px' }}>{vendor.notes}</p>}
              </div>
              <div className="flex items-center gap-4">
                {vendor.phone && <a href={'tel:' + vendor.phone} className="text-sm hover:opacity-70" style={{ color: 'var(--color-steel-500)' }}>📞 {vendor.phone}</a>}
                {vendor.email && <a href={'mailto:' + vendor.email} className="text-xs hover:opacity-70" style={{ color: 'var(--color-steel-500)' }}>{vendor.email}</a>}
              </div>
            </div>
          ))}
        </div>
      </Card>
      {showAdd ? <AddVendorForm bookingId={bookingId} onClose={() => setShowAdd(false)} /> : <button onClick={() => setShowAdd(true)} style={{ marginTop: '8px', fontSize: '13px', color: 'var(--color-navy-400)', background: 'none', border: '1px dashed var(--color-navy-200)', borderRadius: '8px', padding: '8px 16px', cursor: 'pointer', fontFamily: 'inherit', width: '100%' }}>+ Add vendor</button>}
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────

export default function BookingDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [activeTab, setActiveTab] = useState<Tab>('overview')
  const [showDayOf, setShowDayOf] = useState(false)
  const [showAddShotGroup, setShowAddShotGroup] = useState(false)
  const [sessions, setSessions] = useState<Session[]>([])
  const [calls, setCalls] = useState<CallLog[]>([])
  const { data, isLoading } = useBookingDetail(id ?? '')
  const updateWorkflowStatus = useUpdateWorkflowStatus()

  if (isLoading) return <AppShell><div className="px-10 py-10 text-sm" style={{ color: 'var(--color-navy-400)' }}>Loading...</div></AppShell>
  if (!data) return (
    <AppShell>
      <div className="px-10 py-10">
        <p style={{ color: 'var(--color-navy-400)' }}>Booking not found.</p>
        <Link to="/bookings" className="text-sm mt-2 inline-block hover:opacity-70" style={{ color: 'var(--color-steel-500)' }}>← Back to bookings</Link>
      </div>
    </AppShell>
  )

  const workflowStatus = ((data as any).workflowStatus ?? 'booked') as WorkflowStatus
  const days = daysUntil(data.weddingDate)
  const completedTasks = data.tasks.filter(t => t.completed).length
  const outstandingTasks = data.tasks.filter(t => !t.completed)
  const overdueTasks = outstandingTasks.filter(t => t.dueDate && new Date(t.dueDate) < new Date())
  const upcomingTasks = outstandingTasks.filter(t => !t.dueDate || new Date(t.dueDate) >= new Date()).slice(0, 3)

  const tabsWithCounts = TABS.map(tab => ({
    ...tab,
    label: tab.id === 'sessions' && sessions.length > 0 ? `Sessions (${sessions.length})`
      : tab.id === 'calls' && calls.length > 0 ? `Calls (${calls.length})`
      : tab.label
  }))

  return (
    <AppShell>
      <div className="px-10 py-10 max-w-4xl">
        <Link to="/bookings" className="text-xs mb-6 inline-block hover:opacity-70 transition-opacity" style={{ color: 'var(--color-navy-400)' }}>← Bookings</Link>

        {showDayOf && <DayOfSheet booking={data} answers={SAMPLE_QUESTIONNAIRE_RESPONSE} onClose={() => setShowDayOf(false)} />}

        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="font-display text-3xl italic" style={{ color: 'var(--color-navy-900)' }}>{data.partnerOneName} & {data.partnerTwoName}</h1>
            <p className="mt-1" style={{ color: 'var(--color-navy-500)' }}>{data.venueName} · {formatDate(data.weddingDate)}</p>
            <div className="flex items-center gap-3 mt-2">
              <Badge status={String(data.status)} />
              {days > 0 && <span className="text-xs" style={{ color: 'var(--color-navy-400)' }}>{days} {days === 1 ? 'day' : 'days'} away</span>}
              {days === 0 && <span className="text-xs font-medium" style={{ color: 'var(--color-gold-warm)' }}>Today! 🎉</span>}
              {days < 0 && <span className="text-xs" style={{ color: 'var(--color-navy-400)' }}>{Math.abs(days)} {Math.abs(days) === 1 ? 'day' : 'days'} since</span>}
              <span className="text-xs" style={{ color: 'var(--color-navy-400)' }}>{completedTasks}/{data.tasks.length} tasks done</span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            <Button variant="secondary" size="sm" onClick={() => { navigator.clipboard.writeText(window.location.origin + '/portal/' + data.portalToken); alert('Portal link copied!') }}>🔗 Copy portal link</Button>
            <Button variant="secondary" size="sm" onClick={() => setShowDayOf(true)}>📋 Day-of sheet</Button>
          </div>
        </div>

        {/* Workflow pipeline — now wired to backend */}
        <WorkflowPipeline
          status={workflowStatus}
          onChange={(s) => updateWorkflowStatus.mutate({ id: id ?? '', workflowStatus: s })}
        />

        {/* Outstanding tasks banner */}
        {outstandingTasks.length > 0 && (
          <div className="rounded-xl px-5 py-4 mb-6 flex items-start justify-between gap-6"
            style={{ background: overdueTasks.length > 0 ? '#fef3e2' : 'var(--color-navy-50)', border: `1px solid ${overdueTasks.length > 0 ? 'var(--color-gold-soft)' : 'var(--color-navy-100)'}` }}>
            <div className="flex-1">
              <p className="text-xs font-medium uppercase tracking-widest mb-2" style={{ color: overdueTasks.length > 0 ? 'var(--color-gold-warm)' : 'var(--color-navy-500)' }}>
                {overdueTasks.length > 0 ? `⚠ ${overdueTasks.length} overdue · ` : ''}{outstandingTasks.length} tasks remaining
              </p>
              <div className="flex flex-wrap gap-x-4 gap-y-1">
                {upcomingTasks.map(task => (
                  <span key={task.id} className="text-xs flex items-center gap-1.5" style={{ color: 'var(--color-navy-600)' }}>
                    <span style={{ color: 'var(--color-navy-300)' }}>○</span>{task.title}
                  </span>
                ))}
                {outstandingTasks.length > 3 && <span className="text-xs" style={{ color: 'var(--color-navy-400)' }}>+{outstandingTasks.length - 3} more</span>}
              </div>
            </div>
            <button onClick={() => setActiveTab('tasks')} className="text-xs font-medium shrink-0 hover:opacity-70" style={{ color: 'var(--color-steel-500)' }}>View all →</button>
          </div>
        )}

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '0', marginBottom: '24px', borderBottom: '1px solid var(--color-navy-100)', overflowX: 'auto' }}>
          {tabsWithCounts.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              style={{ padding: '10px 16px', fontSize: '13px', fontWeight: 500, background: 'none', border: 'none', borderBottom: `2px solid ${activeTab === tab.id ? 'var(--color-navy-800)' : 'transparent'}`, color: activeTab === tab.id ? 'var(--color-navy-900)' : 'var(--color-navy-400)', cursor: 'pointer', fontFamily: 'inherit', marginBottom: '-1px', whiteSpace: 'nowrap' }}>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="animate-fade-up">
          {activeTab === 'overview'  && <OverviewTab bookingId={id ?? ''} />}
          {activeTab === 'tasks'     && <TasksTab bookingId={id ?? ''} />}
          {activeTab === 'sessions'  && <SessionsTab sessions={sessions} onAdd={s => setSessions(p => [...p, s])} onDelete={sid => setSessions(p => p.filter(s => s.id !== sid))} />}
          {activeTab === 'calls'     && <CallsTab calls={calls} onAdd={c => setCalls(p => [...p, c])} onDelete={cid => setCalls(p => p.filter(c => c.id !== cid))} />}
          {activeTab === 'timeline'  && <TimelineTab bookingId={id ?? ''} initialTimeline={data.timeline} />}
          {activeTab === 'shotlist'  && (
            <div>
              <ShotListTab bookingId={id ?? ''} initialGroups={data.shotListGroups} />
              {showAddShotGroup ? <AddShotGroupForm bookingId={id ?? ''} onClose={() => setShowAddShotGroup(false)} /> : <button onClick={() => setShowAddShotGroup(true)} style={{ marginTop: '12px', fontSize: '13px', color: 'var(--color-navy-400)', background: 'none', border: '1px dashed var(--color-navy-200)', borderRadius: '8px', padding: '8px 16px', cursor: 'pointer', fontFamily: 'inherit', width: '100%' }}>+ Add shot group</button>}
            </div>
          )}
          {activeTab === 'vendors'   && <VendorsTab bookingId={id ?? ''} vendors={data.vendors} />}
          {activeTab === 'blog'      && <BlogGeneratorTab booking={data} />}
        </div>
      </div>
    </AppShell>
  )
}