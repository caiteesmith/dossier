import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import AppShell from '@/components/layout/AppShell'
import { Card, Button, Badge } from '@/components/ui'
import type { Project, Session, ProjectCall, ProjectStatus, SessionType, CallType } from '@/types/projects'

// ── Constants ─────────────────────────────────────────────────────

const STATUS_CONFIG: Record<ProjectStatus, { label: string; color: string; bg: string }> = {
  inquiry:         { label: 'Inquiry',         color: '#7a5c0a', bg: '#fdf8e8' },
  booked:          { label: 'Booked',          color: '#276840', bg: '#e6f4ec' },
  post_production: { label: 'Post-production', color: 'var(--color-steel-600)', bg: 'var(--color-navy-50)' },
  completed:       { label: 'Completed',       color: 'var(--color-navy-500)', bg: 'var(--color-navy-100)' },
  archived:        { label: 'Archived',        color: 'var(--color-navy-300)', bg: 'var(--color-navy-50)' },
}

const SESSION_TYPES: { value: SessionType; label: string; icon: string }[] = [
  { value: 'engagement', label: 'Engagement', icon: '💍' },
  { value: 'family',     label: 'Family',     icon: '👨‍👩‍👧' },
  { value: 'maternity',  label: 'Maternity',  icon: '🤰' },
  { value: 'custom',     label: 'Custom',     icon: '✨' },
]

const CALL_TYPES: { value: CallType; label: string; icon: string }[] = [
  { value: 'phone',       label: 'Phone call',  icon: '📞' },
  { value: 'google_meet', label: 'Google Meet', icon: '🎥' },
  { value: 'zoom',        label: 'Zoom',        icon: '💻' },
  { value: 'facetime',    label: 'FaceTime',    icon: '📱' },
  { value: 'other',       label: 'Other',       icon: '💬' },
]

const DURATIONS = ['15 min', '30 min', '45 min', '1 hour', '1.5 hours', '2 hours', '3 hours', '4 hours', '6 hours', '8 hours']

const iS = {
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

const lS: React.CSSProperties = {
  display: 'block',
  fontSize: '11px',
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  color: 'var(--color-navy-400)',
  marginBottom: '5px',
  fontWeight: 500,
}

function parseLocalDate(dateStr: string) {
  if (!dateStr) return null
  const [year, month, day] = dateStr.split('-').map(Number)
  return new Date(year, month - 1, day)
}

function formatDate(dateStr: string) {
  const d = parseLocalDate(dateStr)
  if (!d) return '—'
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'long', day: 'numeric', year: 'numeric' })
}

function formatTime(timeStr: string) {
  if (!timeStr) return ''
  const [h, m] = timeStr.split(':').map(Number)
  const ampm = h >= 12 ? 'pm' : 'am'
  const hour = h % 12 || 12
  return `${hour}:${m.toString().padStart(2, '0')}${ampm}`
}

function daysUntil(dateStr: string) {
  const d = parseLocalDate(dateStr)
  if (!d) return null
  return Math.ceil((d.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
}

// ── Add session modal ─────────────────────────────────────────────

function AddSessionModal({ projectId, onClose, onSave }: { projectId: string; onClose: () => void; onSave: (s: Session) => void }) {
  const [form, setForm] = useState({
    type: 'engagement' as SessionType,
    customType: '',
    date: '',
    time: '',
    duration: '2 hours',
    location: '',
    secondShooter: '',
    price: '',
    deliveryDeadline: '',
    notes: '',
  })

  function set(field: string, value: string) {
    setForm(p => ({ ...p, [field]: value }))
  }

  function handleSave() {
    if (!form.date || !form.location.trim()) return
    const session: Session = {
      id: `sess_${Date.now()}`,
      projectId,
      type: form.type,
      customType: form.customType.trim() || undefined,
      date: form.date,
      time: form.time,
      duration: form.duration,
      location: form.location.trim(),
      secondShooter: form.secondShooter.trim() || undefined,
      price: form.price ? parseFloat(form.price) : undefined,
      deliveryDeadline: form.deliveryDeadline || undefined,
      notes: form.notes.trim() || undefined,
      createdAt: new Date().toISOString(),
    }
    onSave(session)
    onClose()
  }

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(13,21,37,0.5)', zIndex: 40, backdropFilter: 'blur(2px)' }} />
      <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
        <div style={{ background: 'white', borderRadius: '16px', width: '100%', maxWidth: '540px', maxHeight: '90vh', overflow: 'auto', boxShadow: '0 24px 64px rgba(13,21,37,0.25)' }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--color-navy-100)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--color-navy-900)' }}>Add session</h2>
            <button onClick={onClose} style={{ fontSize: '18px', color: 'var(--color-navy-400)', background: 'none', border: 'none', cursor: 'pointer' }}>×</button>
          </div>

          <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Session type */}
            <div>
              <label style={lS}>Session type</label>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {SESSION_TYPES.map(t => (
                  <button key={t.value} onClick={() => set('type', t.value)} style={{ padding: '7px 14px', borderRadius: '20px', fontSize: '13px', fontWeight: 500, border: '1px solid var(--color-navy-200)', cursor: 'pointer', fontFamily: 'inherit', background: form.type === t.value ? 'var(--color-navy-800)' : 'white', color: form.type === t.value ? 'white' : 'var(--color-navy-600)' }}>
                    {t.icon} {t.label}
                  </button>
                ))}
              </div>
              {form.type === 'custom' && (
                <input value={form.customType} onChange={e => set('customType', e.target.value)} placeholder="Session type name" style={{ ...iS, marginTop: '8px' }} autoFocus />
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={lS}>Date <span style={{ color: '#b91c1c' }}>*</span></label>
                <input type="date" value={form.date} onChange={e => set('date', e.target.value)} style={iS} />
              </div>
              <div>
                <label style={lS}>Time</label>
                <input type="time" value={form.time} onChange={e => set('time', e.target.value)} style={iS} />
              </div>
              <div>
                <label style={lS}>Duration</label>
                <select value={form.duration} onChange={e => set('duration', e.target.value)} style={{ ...iS, cursor: 'pointer' }}>
                  {DURATIONS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div>
                <label style={lS}>Price</label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-navy-400)', fontSize: '13px' }}>$</span>
                  <input type="number" value={form.price} onChange={e => set('price', e.target.value)} min={0} style={{ ...iS, paddingLeft: '24px' }} />
                </div>
              </div>
            </div>

            <div>
              <label style={lS}>Location <span style={{ color: '#b91c1c' }}>*</span></label>
              <input value={form.location} onChange={e => set('location', e.target.value)} placeholder="e.g. Central Park, New York" style={iS} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={lS}>Second shooter (optional)</label>
                <input value={form.secondShooter} onChange={e => set('secondShooter', e.target.value)} placeholder="Name" style={iS} />
              </div>
              <div>
                <label style={lS}>Gallery delivery deadline</label>
                <input type="date" value={form.deliveryDeadline} onChange={e => set('deliveryDeadline', e.target.value)} style={iS} />
              </div>
            </div>

            <div>
              <label style={lS}>Session notes</label>
              <textarea value={form.notes} onChange={e => set('notes', e.target.value)} rows={3} placeholder="Shot list ideas, outfit notes, location details..." style={{ ...iS, resize: 'vertical' as const }} />
            </div>
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

// ── Add call modal ────────────────────────────────────────────────

function AddCallModal({ projectId, onClose, onSave }: { projectId: string; onClose: () => void; onSave: (c: ProjectCall) => void }) {
  const [form, setForm] = useState({
    type: 'phone' as CallType,
    date: '',
    time: '',
    duration: '30 min',
    notes: '',
    outcome: '',
  })

  function set(field: string, value: string) {
    setForm(p => ({ ...p, [field]: value }))
  }

  function handleSave() {
    if (!form.date) return
    const call: ProjectCall = {
      id: `call_${Date.now()}`,
      projectId,
      type: form.type,
      date: form.date,
      time: form.time,
      duration: form.duration,
      notes: form.notes.trim() || undefined,
      outcome: form.outcome.trim() || undefined,
      createdAt: new Date().toISOString(),
    }
    onSave(call)
    onClose()
  }

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(13,21,37,0.5)', zIndex: 40, backdropFilter: 'blur(2px)' }} />
      <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
        <div style={{ background: 'white', borderRadius: '16px', width: '100%', maxWidth: '480px', maxHeight: '90vh', overflow: 'auto', boxShadow: '0 24px 64px rgba(13,21,37,0.25)' }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--color-navy-100)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--color-navy-900)' }}>Log call</h2>
            <button onClick={onClose} style={{ fontSize: '18px', color: 'var(--color-navy-400)', background: 'none', border: 'none', cursor: 'pointer' }}>×</button>
          </div>

          <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Call type */}
            <div>
              <label style={lS}>Call type</label>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {CALL_TYPES.map(t => (
                  <button key={t.value} onClick={() => set('type', t.value)} style={{ padding: '7px 14px', borderRadius: '20px', fontSize: '13px', fontWeight: 500, border: '1px solid var(--color-navy-200)', cursor: 'pointer', fontFamily: 'inherit', background: form.type === t.value ? 'var(--color-navy-800)' : 'white', color: form.type === t.value ? 'white' : 'var(--color-navy-600)' }}>
                    {t.icon} {t.label}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={lS}>Date <span style={{ color: '#b91c1c' }}>*</span></label>
                <input type="date" value={form.date} onChange={e => set('date', e.target.value)} style={iS} />
              </div>
              <div>
                <label style={lS}>Time</label>
                <input type="time" value={form.time} onChange={e => set('time', e.target.value)} style={iS} />
              </div>
              <div style={{ gridColumn: 'span 2' }}>
                <label style={lS}>Duration</label>
                <select value={form.duration} onChange={e => set('duration', e.target.value)} style={{ ...iS, cursor: 'pointer' }}>
                  {DURATIONS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label style={lS}>Notes</label>
              <textarea value={form.notes} onChange={e => set('notes', e.target.value)} rows={3} placeholder="What was discussed?" style={{ ...iS, resize: 'vertical' as const }} />
            </div>

            <div>
              <label style={lS}>Outcome / next steps</label>
              <input value={form.outcome} onChange={e => set('outcome', e.target.value)} placeholder="e.g. Sent proposal, scheduled engagement session" style={iS} />
            </div>
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

// ── Sessions tab ──────────────────────────────────────────────────

function SessionsTab({ project, sessions, onAdd, onDelete }: {
  project: Project
  sessions: Session[]
  onAdd: (s: Session) => void
  onDelete: (id: string) => void
}) {
  const [showAdd, setShowAdd] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  const sorted = [...sessions].sort((a, b) => a.date.localeCompare(b.date))

  return (
    <div className="space-y-4">
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Button size="sm" onClick={() => setShowAdd(true)}>+ Add session</Button>
      </div>

      {sessions.length === 0 ? (
        <Card className="p-8 text-center">
          <p style={{ fontSize: '24px', marginBottom: '8px' }}>📸</p>
          <p style={{ fontSize: '13px', color: 'var(--color-navy-400)' }}>No sessions yet.</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {sorted.map(session => {
            const days = session.date ? daysUntil(session.date) : null
            const isPast = days !== null && days < 0
            const typeInfo = SESSION_TYPES.find(t => t.value === session.type)

            return (
              <Card key={session.id} className="p-5">
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                      <span style={{ fontSize: '18px' }}>{typeInfo?.icon ?? '✨'}</span>
                      <p style={{ fontSize: '15px', fontWeight: 600, color: 'var(--color-navy-800)' }}>
                        {session.type === 'custom' ? session.customType || 'Custom session' : typeInfo?.label}
                      </p>
                      {days !== null && !isPast && (
                        <span style={{ fontSize: '11px', background: days <= 7 ? '#fef3e2' : 'var(--color-navy-50)', color: days <= 7 ? 'var(--color-gold-warm)' : 'var(--color-navy-500)', padding: '2px 8px', borderRadius: '20px', fontWeight: 600 }}>
                          {days === 0 ? 'Today' : days === 1 ? 'Tomorrow' : `${days} days`}
                        </span>
                      )}
                      {isPast && (
                        <span style={{ fontSize: '11px', background: 'var(--color-navy-50)', color: 'var(--color-navy-400)', padding: '2px 8px', borderRadius: '20px' }}>Past</span>
                      )}
                    </div>

                    <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', fontSize: '12px', color: 'var(--color-navy-500)', marginBottom: session.notes ? '8px' : '0' }}>
                      {session.date && <span>📅 {formatDate(session.date)}</span>}
                      {session.time && <span>⏰ {formatTime(session.time)}</span>}
                      {session.duration && <span>⏱ {session.duration}</span>}
                      {session.location && <span>📍 {session.location}</span>}
                      {session.price && <span>💰 ${session.price.toLocaleString()}</span>}
                      {session.secondShooter && <span>📷 2nd: {session.secondShooter}</span>}
                      {session.deliveryDeadline && <span>🚚 Deliver by {formatDate(session.deliveryDeadline)}</span>}
                    </div>

                    {session.notes && (
                      <p style={{ fontSize: '12px', color: 'var(--color-navy-400)', fontStyle: 'italic', marginTop: '6px' }}>{session.notes}</p>
                    )}
                  </div>

                  <button
                    onClick={() => setConfirmDelete(session.id)}
                    style={{ fontSize: '12px', color: 'var(--color-navy-300)', background: 'none', border: 'none', cursor: 'pointer', padding: '0 4px', transition: 'color 0.15s', flexShrink: 0 }}
                    onMouseEnter={e => (e.currentTarget.style.color = '#ef4444')}
                    onMouseLeave={e => (e.currentTarget.style.color = 'var(--color-navy-300)')}
                  >✕</button>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {showAdd && <AddSessionModal projectId={project.id} onClose={() => setShowAdd(false)} onSave={onAdd} />}

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

function CallsTab({ project, calls, onAdd, onDelete }: {
  project: Project
  calls: ProjectCall[]
  onAdd: (c: ProjectCall) => void
  onDelete: (id: string) => void
}) {
  const [showAdd, setShowAdd] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  const sorted = [...calls].sort((a, b) => b.date.localeCompare(a.date))

  return (
    <div className="space-y-4">
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Button size="sm" onClick={() => setShowAdd(true)}>+ Log call</Button>
      </div>

      {calls.length === 0 ? (
        <Card className="p-8 text-center">
          <p style={{ fontSize: '24px', marginBottom: '8px' }}>📞</p>
          <p style={{ fontSize: '13px', color: 'var(--color-navy-400)' }}>No calls logged yet.</p>
        </Card>
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
                      <span style={{ fontSize: '12px', color: 'var(--color-navy-400)' }}>
                        {formatDate(call.date)}{call.time ? ` at ${formatTime(call.time)}` : ''} · {call.duration}
                      </span>
                    </div>
                    {call.notes && <p style={{ fontSize: '12px', color: 'var(--color-navy-500)', marginBottom: '2px' }}>{call.notes}</p>}
                    {call.outcome && (
                      <p style={{ fontSize: '12px', color: 'var(--color-steel-600)', fontWeight: 500 }}>→ {call.outcome}</p>
                    )}
                  </div>
                  <button
                    onClick={() => setConfirmDelete(call.id)}
                    style={{ fontSize: '12px', color: 'var(--color-navy-300)', background: 'none', border: 'none', cursor: 'pointer', padding: '0 4px', transition: 'color 0.15s', flexShrink: 0 }}
                    onMouseEnter={e => (e.currentTarget.style.color = '#ef4444')}
                    onMouseLeave={e => (e.currentTarget.style.color = 'var(--color-navy-300)')}
                  >✕</button>
                </div>
              )
            })}
          </div>
        </Card>
      )}

      {showAdd && <AddCallModal projectId={project.id} onClose={() => setShowAdd(false)} onSave={onAdd} />}

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

function OverviewTab({ project, sessions, calls, onUpdateProject }: {
  project: Project
  sessions: Session[]
  calls: ProjectCall[]
  onUpdateProject: (p: Project) => void
}) {
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({
    clientOneName: project.clientOneName,
    clientTwoName: project.clientTwoName ?? '',
    email: project.email ?? '',
    phone: project.phone ?? '',
    status: project.status,
    notes: project.notes ?? '',
  })

  function set(field: string, value: string) {
    setForm(p => ({ ...p, [field]: value }))
  }

  function handleSave() {
    onUpdateProject({
      ...project,
      clientOneName: form.clientOneName,
      clientTwoName: form.clientTwoName || undefined,
      email: form.email || undefined,
      phone: form.phone || undefined,
      status: form.status as ProjectStatus,
      notes: form.notes || undefined,
      name: form.clientTwoName
        ? `${form.clientOneName} & ${form.clientTwoName}`
        : form.clientOneName,
      updatedAt: new Date().toISOString(),
    })
    setEditing(false)
  }

  const upcomingSessions = sessions
    .filter(s => s.date && daysUntil(s.date) !== null && daysUntil(s.date)! >= 0)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 3)

  const recentCalls = [...calls]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 3)

  return (
    <div className="grid grid-cols-2 gap-6">
      {/* Client details */}
      <Card className="p-6">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <h3 style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-navy-400)', fontWeight: 600 }}>Client details</h3>
          {editing ? (
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={handleSave} style={{ fontSize: '12px', fontWeight: 600, color: 'white', background: 'var(--color-navy-800)', border: 'none', borderRadius: '6px', padding: '4px 12px', cursor: 'pointer', fontFamily: 'inherit' }}>Save</button>
              <button onClick={() => setEditing(false)} style={{ fontSize: '12px', color: 'var(--color-navy-400)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
            </div>
          ) : (
            <button onClick={() => setEditing(true)} style={{ fontSize: '12px', color: 'var(--color-navy-400)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>Edit</button>
          )}
        </div>

        {editing ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div>
                <label style={lS}>Client 1</label>
                <input value={form.clientOneName} onChange={e => set('clientOneName', e.target.value)} style={{ ...iS, background: 'white' }} />
              </div>
              <div>
                <label style={lS}>Client 2</label>
                <input value={form.clientTwoName} onChange={e => set('clientTwoName', e.target.value)} style={{ ...iS, background: 'white' }} />
              </div>
            </div>
            <div>
              <label style={lS}>Email</label>
              <input type="email" value={form.email} onChange={e => set('email', e.target.value)} style={{ ...iS, background: 'white' }} />
            </div>
            <div>
              <label style={lS}>Phone</label>
              <input type="tel" value={form.phone} onChange={e => set('phone', e.target.value)} style={{ ...iS, background: 'white' }} />
            </div>
            <div>
              <label style={lS}>Status</label>
              <select value={form.status} onChange={e => set('status', e.target.value)} style={{ ...iS, cursor: 'pointer', background: 'white' }}>
                {Object.entries(STATUS_CONFIG).map(([val, cfg]) => (
                  <option key={val} value={val}>{cfg.label}</option>
                ))}
              </select>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {[
              { label: 'Client', value: project.name },
              project.email ? { label: 'Email', value: project.email } : null,
              project.phone ? { label: 'Phone', value: project.phone } : null,
            ].filter(Boolean).map(row => (
              <div key={row!.label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                <span style={{ color: 'var(--color-navy-400)' }}>{row!.label}</span>
                <span style={{ fontWeight: 500, color: 'var(--color-navy-800)', textAlign: 'right' }}>{row!.value}</span>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Notes */}
      <Card className="p-6">
        <h3 style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-navy-400)', fontWeight: 600, marginBottom: '12px' }}>Notes</h3>
        <textarea
          value={editing ? form.notes : project.notes ?? ''}
          onChange={e => set('notes', e.target.value)}
          onFocus={() => !editing && setEditing(true)}
          rows={5}
          placeholder="Client preferences, important details, reminders..."
          style={{ ...iS, resize: 'vertical' as const, background: 'white' }}
        />
        {editing && (
          <button onClick={handleSave} style={{ marginTop: '8px', fontSize: '12px', fontWeight: 600, color: 'white', background: 'var(--color-navy-800)', border: 'none', borderRadius: '6px', padding: '6px 14px', cursor: 'pointer', fontFamily: 'inherit' }}>Save notes</button>
        )}
      </Card>

      {/* Upcoming sessions */}
      {upcomingSessions.length > 0 && (
        <Card className="p-5">
          <h3 style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-navy-400)', fontWeight: 600, marginBottom: '12px' }}>Upcoming sessions</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {upcomingSessions.map(s => {
              const typeInfo = SESSION_TYPES.find(t => t.value === s.type)
              const days = daysUntil(s.date)
              return (
                <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px' }}>
                  <span>{typeInfo?.icon ?? '✨'}</span>
                  <span style={{ flex: 1, color: 'var(--color-navy-700)' }}>{s.type === 'custom' ? s.customType : typeInfo?.label}</span>
                  <span style={{ color: 'var(--color-navy-400)', fontSize: '12px' }}>{formatDate(s.date)}</span>
                  {days !== null && days <= 7 && (
                    <span style={{ fontSize: '11px', background: '#fef3e2', color: 'var(--color-gold-warm)', padding: '2px 7px', borderRadius: '20px', fontWeight: 600 }}>
                      {days === 0 ? 'Today' : days === 1 ? 'Tomorrow' : `${days}d`}
                    </span>
                  )}
                </div>
              )
            })}
          </div>
        </Card>
      )}

      {/* Recent calls */}
      {recentCalls.length > 0 && (
        <Card className="p-5">
          <h3 style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-navy-400)', fontWeight: 600, marginBottom: '12px' }}>Recent calls</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {recentCalls.map(c => {
              const typeInfo = CALL_TYPES.find(t => t.value === c.type)
              return (
                <div key={c.id} style={{ fontSize: '13px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span>{typeInfo?.icon ?? '💬'}</span>
                    <span style={{ flex: 1, color: 'var(--color-navy-700)' }}>{typeInfo?.label}</span>
                    <span style={{ color: 'var(--color-navy-400)', fontSize: '12px' }}>{formatDate(c.date)}</span>
                  </div>
                  {c.outcome && <p style={{ fontSize: '12px', color: 'var(--color-steel-600)', marginTop: '2px', paddingLeft: '28px' }}>→ {c.outcome}</p>}
                </div>
              )
            })}
          </div>
        </Card>
      )}
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────

// NOTE: In a real app this would fetch by ID from context/store.
// For now we use a module-level store so data persists between navigations.
const projectStore: Record<string, { project: Project; sessions: Session[]; calls: ProjectCall[] }> = {}

export function registerProject(project: Project) {
  if (!projectStore[project.id]) {
    projectStore[project.id] = { project, sessions: [], calls: [] }
  }
}

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>()
  const entry = id ? projectStore[id] : null

  const [data, setData] = useState(entry ?? null)

  if (!data) {
    return (
      <AppShell>
        <div className="px-10 py-10">
          <Link to="/projects" style={{ fontSize: '12px', color: 'var(--color-navy-400)' }}>← Projects</Link>
          <p style={{ marginTop: '16px', color: 'var(--color-navy-400)', fontSize: '14px' }}>Project not found.</p>
        </div>
      </AppShell>
    )
  }

  const { project, sessions, calls } = data

  type Tab = 'overview' | 'sessions' | 'calls'
  const [activeTab, setActiveTab] = useState<Tab>('overview')

  const TABS: { id: Tab; label: string }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'sessions', label: `Sessions${sessions.length ? ` (${sessions.length})` : ''}` },
    { id: 'calls',    label: `Calls${calls.length ? ` (${calls.length})` : ''}` },
  ]

  function update(patch: { project?: Project; sessions?: Session[]; calls?: ProjectCall[] }) {
    if (!data) return
    const updated = {
        project: patch.project ?? data.project,
        sessions: patch.sessions ?? data.sessions,
        calls: patch.calls ?? data.calls,
    }
    projectStore[project.id] = updated
    setData(updated)
    }

  const statusCfg = STATUS_CONFIG[project.status]

  return (
    <AppShell>
      <div className="px-10 py-10 max-w-4xl">
        <Link to="/projects" style={{ fontSize: '12px', color: 'var(--color-navy-400)', marginBottom: '16px', display: 'inline-block' }}>← Projects</Link>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '24px' }}>
          <div>
            <h1 className="font-display text-3xl italic" style={{ color: 'var(--color-navy-900)' }}>{project.name}</h1>
            <p style={{ marginTop: '4px', fontSize: '14px', color: 'var(--color-navy-500)' }}>
              {project.type === 'custom' ? project.customType || 'Custom' : project.type.charAt(0).toUpperCase() + project.type.slice(1)} session
            </p>
          </div>
          <span style={{ fontSize: '12px', fontWeight: 600, padding: '5px 12px', borderRadius: '20px', background: statusCfg.bg, color: statusCfg.color }}>
            {statusCfg.label}
          </span>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '0', marginBottom: '24px', borderBottom: '1px solid var(--color-navy-100)' }}>
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '10px 16px', fontSize: '14px', fontWeight: 500,
                background: 'none', border: 'none',
                borderBottom: `2px solid ${activeTab === tab.id ? 'var(--color-navy-800)' : 'transparent'}`,
                color: activeTab === tab.id ? 'var(--color-navy-900)' : 'var(--color-navy-400)',
                cursor: 'pointer', fontFamily: 'inherit', marginBottom: '-1px',
              }}
            >{tab.label}</button>
          ))}
        </div>

        {/* Tab content */}
        {activeTab === 'overview' && (
          <OverviewTab
            project={project}
            sessions={sessions}
            calls={calls}
            onUpdateProject={p => update({ project: p })}
          />
        )}
        {activeTab === 'sessions' && (
          <SessionsTab
            project={project}
            sessions={sessions}
            onAdd={s => update({ sessions: [...sessions, s] })}
            onDelete={id => update({ sessions: sessions.filter(s => s.id !== id) })}
          />
        )}
        {activeTab === 'calls' && (
          <CallsTab
            project={project}
            calls={calls}
            onAdd={c => update({ calls: [...calls, c] })}
            onDelete={id => update({ calls: calls.filter(c => c.id !== id) })}
          />
        )}
      </div>
    </AppShell>
  )
}