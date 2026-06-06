import { useState } from 'react'
import { Link } from 'react-router-dom'
import AppShell from '@/components/layout/AppShell'
import { Card, Button, PageHeader, EmptyState, Badge } from '@/components/ui'
import type { Project, ProjectStatus, ProjectType } from '@/types/projects'

// ── Constants ─────────────────────────────────────────────────────

const STATUS_CONFIG: Record<ProjectStatus, { label: string; color: string; bg: string }> = {
  inquiry:         { label: 'Inquiry',         color: '#7a5c0a', bg: '#fdf8e8' },
  booked:          { label: 'Booked',          color: '#276840', bg: '#e6f4ec' },
  post_production: { label: 'Post-production', color: 'var(--color-steel-600)', bg: 'var(--color-navy-50)' },
  completed:       { label: 'Completed',       color: 'var(--color-navy-500)', bg: 'var(--color-navy-100)' },
  archived:        { label: 'Archived',        color: 'var(--color-navy-300)', bg: 'var(--color-navy-50)' },
}

const PROJECT_TYPES: { value: ProjectType; label: string; icon: string }[] = [
  { value: 'wedding',    label: 'Wedding',    icon: '💍' },
  { value: 'engagement', label: 'Engagement', icon: '📸' },
  { value: 'family',     label: 'Family',     icon: '👨‍👩‍👧' },
  { value: 'maternity',  label: 'Maternity',  icon: '🤰' },
  { value: 'custom',     label: 'Custom',     icon: '✨' },
]

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

function StatusBadge({ status }: { status: ProjectStatus }) {
  const cfg = STATUS_CONFIG[status]
  return (
    <span style={{ fontSize: '11px', fontWeight: 600, padding: '3px 9px', borderRadius: '20px', background: cfg.bg, color: cfg.color, whiteSpace: 'nowrap' }}>
      {cfg.label}
    </span>
  )
}

function typeLabel(type: ProjectType, custom?: string) {
  if (type === 'custom') return custom || 'Custom'
  return PROJECT_TYPES.find(t => t.value === type)?.label ?? type
}

function typeIcon(type: ProjectType) {
  return PROJECT_TYPES.find(t => t.value === type)?.icon ?? '✨'
}

// ── New project modal ─────────────────────────────────────────────

function NewProjectModal({ onClose, onSave }: { onClose: () => void; onSave: (p: Project) => void }) {
  const [form, setForm] = useState({
    type: 'engagement' as ProjectType,
    customType: '',
    clientOneName: '',
    clientTwoName: '',
    email: '',
    phone: '',
    status: 'inquiry' as ProjectStatus,
    notes: '',
  })

  function set(field: string, value: string) {
    setForm(p => ({ ...p, [field]: value }))
  }

  function handleSave() {
    if (!form.clientOneName.trim()) return
    const project: Project = {
      id: `proj_${Date.now()}`,
      name: form.clientTwoName.trim()
        ? `${form.clientOneName.trim()} & ${form.clientTwoName.trim()}`
        : form.clientOneName.trim(),
      type: form.type,
      customType: form.customType.trim() || undefined,
      status: form.status,
      clientOneName: form.clientOneName.trim(),
      clientTwoName: form.clientTwoName.trim() || undefined,
      email: form.email.trim() || undefined,
      phone: form.phone.trim() || undefined,
      notes: form.notes.trim() || undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    onSave(project)
    onClose()
  }

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(13,21,37,0.5)', zIndex: 40, backdropFilter: 'blur(2px)' }} />
      <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
        <div style={{ background: 'white', borderRadius: '16px', width: '100%', maxWidth: '520px', maxHeight: '90vh', overflow: 'auto', boxShadow: '0 24px 64px rgba(13,21,37,0.25)' }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--color-navy-100)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--color-navy-900)' }}>New project</h2>
            <button onClick={onClose} style={{ fontSize: '18px', color: 'var(--color-navy-400)', background: 'none', border: 'none', cursor: 'pointer' }}>×</button>
          </div>

          <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Session type */}
            <div>
              <label style={lS}>Project type</label>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {PROJECT_TYPES.map(t => (
                  <button
                    key={t.value}
                    onClick={() => set('type', t.value)}
                    style={{
                      padding: '7px 14px', borderRadius: '20px', fontSize: '13px', fontWeight: 500,
                      border: '1px solid var(--color-navy-200)', cursor: 'pointer', fontFamily: 'inherit',
                      background: form.type === t.value ? 'var(--color-navy-800)' : 'white',
                      color: form.type === t.value ? 'white' : 'var(--color-navy-600)',
                    }}
                  >{t.icon} {t.label}</button>
                ))}
              </div>
              {form.type === 'custom' && (
                <input
                  value={form.customType}
                  onChange={e => set('customType', e.target.value)}
                  placeholder="Session type name"
                  style={{ ...iS, marginTop: '8px' }}
                  autoFocus
                />
              )}
            </div>

            {/* Client names */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={lS}>Client name <span style={{ color: '#b91c1c' }}>*</span></label>
                <input value={form.clientOneName} onChange={e => set('clientOneName', e.target.value)} placeholder="First & last name" style={iS} />
              </div>
              <div>
                <label style={lS}>Partner name (optional)</label>
                <input value={form.clientTwoName} onChange={e => set('clientTwoName', e.target.value)} placeholder="For couples" style={iS} />
              </div>
              <div>
                <label style={lS}>Email</label>
                <input type="email" value={form.email} onChange={e => set('email', e.target.value)} style={iS} />
              </div>
              <div>
                <label style={lS}>Phone</label>
                <input type="tel" value={form.phone} onChange={e => set('phone', e.target.value)} style={iS} />
              </div>
            </div>

            {/* Status */}
            <div>
              <label style={lS}>Status</label>
              <select value={form.status} onChange={e => set('status', e.target.value)} style={{ ...iS, cursor: 'pointer' }}>
                {Object.entries(STATUS_CONFIG).map(([val, cfg]) => (
                  <option key={val} value={val}>{cfg.label}</option>
                ))}
              </select>
            </div>

            {/* Notes */}
            <div>
              <label style={lS}>Notes (optional)</label>
              <textarea value={form.notes} onChange={e => set('notes', e.target.value)} rows={3} style={{ ...iS, resize: 'vertical' as const }} />
            </div>
          </div>

          <div style={{ padding: '14px 24px', borderTop: '1px solid var(--color-navy-100)', display: 'flex', justifyContent: 'flex-end', gap: '10px', background: 'var(--color-fog)' }}>
            <button onClick={onClose} style={{ fontSize: '13px', padding: '8px 16px', borderRadius: '8px', border: '1px solid var(--color-navy-200)', background: 'white', cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
            <Button onClick={handleSave} disabled={!form.clientOneName.trim()}>Create project</Button>
          </div>
        </div>
      </div>
    </>
  )
}

// ── Main page ─────────────────────────────────────────────────────

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [showNew, setShowNew] = useState(false)
  const [filterStatus, setFilterStatus] = useState<ProjectStatus | 'all'>('all')
  const [filterType, setFilterType] = useState<ProjectType | 'all'>('all')
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  function handleSave(p: Project) {
    setProjects(prev => [...prev, p])
  }

  function handleDelete(id: string) {
    setProjects(prev => prev.filter(p => p.id !== id))
    setConfirmDelete(null)
  }

  const filtered = projects
    .filter(p => filterStatus === 'all' || p.status === filterStatus)
    .filter(p => filterType === 'all' || p.type === filterType)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  const activeCount = projects.filter(p => p.status !== 'archived' && p.status !== 'completed').length

  return (
    <AppShell>
      <div className="px-10 py-10 max-w-4xl">
        <PageHeader
          title="Projects"
          subtitle={`${activeCount} active project${activeCount !== 1 ? 's' : ''}`}
          action={<Button size="sm" onClick={() => setShowNew(true)}>+ New project</Button>}
        />

        {/* Filters */}
        {projects.length > 0 && (
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '20px' }}>
            {/* Status filters */}
            <button
              onClick={() => setFilterStatus('all')}
              style={{ padding: '5px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 500, border: '1px solid var(--color-navy-200)', cursor: 'pointer', fontFamily: 'inherit', background: filterStatus === 'all' ? 'var(--color-navy-800)' : 'white', color: filterStatus === 'all' ? 'white' : 'var(--color-navy-600)' }}
            >All</button>
            {(Object.keys(STATUS_CONFIG) as ProjectStatus[]).map(s => (
              projects.some(p => p.status === s) ? (
                <button
                  key={s}
                  onClick={() => setFilterStatus(s)}
                  style={{ padding: '5px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 500, border: '1px solid var(--color-navy-200)', cursor: 'pointer', fontFamily: 'inherit', background: filterStatus === s ? 'var(--color-navy-800)' : 'white', color: filterStatus === s ? 'white' : 'var(--color-navy-600)' }}
                >{STATUS_CONFIG[s].label}</button>
              ) : null
            ))}
            {/* Type filters */}
            {PROJECT_TYPES.filter(t => projects.some(p => p.type === t.value)).map(t => (
              <button
                key={t.value}
                onClick={() => setFilterType(filterType === t.value ? 'all' : t.value)}
                style={{ padding: '5px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 500, border: `1px solid ${filterType === t.value ? 'var(--color-steel-400)' : 'var(--color-navy-200)'}`, cursor: 'pointer', fontFamily: 'inherit', background: filterType === t.value ? 'var(--color-navy-50)' : 'white', color: filterType === t.value ? 'var(--color-steel-600)' : 'var(--color-navy-600)' }}
              >{t.icon} {t.label}</button>
            ))}
          </div>
        )}

        {/* Project list */}
        {projects.length === 0 ? (
          <EmptyState icon="📸" title="No projects yet" body="Create your first project to track sessions, calls, and notes." />
        ) : filtered.length === 0 ? (
          <Card className="p-8 text-center">
            <p style={{ fontSize: '13px', color: 'var(--color-navy-400)' }}>No projects match the current filters.</p>
          </Card>
        ) : (
          <Card>
            <div>
              {filtered.map((project, i) => (
                <div
                  key={project.id}
                  style={{ borderTop: i === 0 ? 'none' : '1px solid var(--color-navy-100)', position: 'relative' }}
                >
                  <Link
                    to={`/projects/${project.id}`}
                    className="flex items-center justify-between px-6 py-4 transition-colors"
                    style={{ color: 'inherit', paddingRight: '48px' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-fog)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                      <span style={{ fontSize: '22px', flexShrink: 0 }}>{typeIcon(project.type)}</span>
                      <div>
                        <p className="font-medium text-sm" style={{ color: 'var(--color-navy-800)' }}>
                          {project.name}
                        </p>
                        <p className="text-xs mt-0.5" style={{ color: 'var(--color-navy-400)' }}>
                          {typeLabel(project.type, project.customType)}
                          {project.email && ` · ${project.email}`}
                        </p>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <StatusBadge status={project.status} />
                      <span style={{ color: 'var(--color-navy-300)' }}>→</span>
                    </div>
                  </Link>

                  <button
                    onClick={() => setConfirmDelete(project.id)}
                    style={{ position: 'absolute', top: '50%', right: '14px', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-navy-300)', fontSize: '14px', padding: '4px 6px', zIndex: 1, transition: 'color 0.15s' }}
                    onMouseEnter={e => (e.currentTarget.style.color = '#ef4444')}
                    onMouseLeave={e => (e.currentTarget.style.color = 'var(--color-navy-300)')}
                    title="Delete project"
                  >✕</button>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>

      {showNew && <NewProjectModal onClose={() => setShowNew(false)} onSave={handleSave} />}

      {confirmDelete && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div style={{ background: 'white', borderRadius: '12px', padding: '24px', maxWidth: '360px', width: '90%', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
            <p className="font-medium text-sm mb-2" style={{ color: 'var(--color-navy-800)' }}>Delete project?</p>
            <p className="text-xs mb-6" style={{ color: 'var(--color-navy-400)' }}>This will also delete all sessions and calls. This cannot be undone.</p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setConfirmDelete(null)} style={{ fontSize: '13px', padding: '8px 16px', borderRadius: '8px', border: '1px solid var(--color-navy-200)', background: 'white', cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
              <button onClick={() => handleDelete(confirmDelete)} style={{ fontSize: '13px', padding: '8px 16px', borderRadius: '8px', border: 'none', background: '#ef4444', color: 'white', cursor: 'pointer', fontFamily: 'inherit' }}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  )
}