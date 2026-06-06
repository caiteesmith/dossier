import { useState, useRef } from 'react'
import AppShell from '@/components/layout/AppShell'
import { Card, Button, PageHeader } from '@/components/ui'
import { useSearchParams } from 'react-router-dom'

const [searchParams] = useSearchParams()
const tabParam = searchParams.get('tab') as HelpTab | null
const [activeTab, setActiveTab] = useState<HelpTab>(tabParam ?? 'issue')

type HelpTab = 'issue' | 'contact'

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

interface Screenshot {
  name: string
  url: string
  size: number
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

// ── Issue form ────────────────────────────────────────────────────

function ReportIssueForm() {
  const [form, setForm] = useState({
    title: '',
    category: '',
    description: '',
    stepsToReproduce: '',
    email: '',
  })
  const [screenshots, setScreenshots] = useState<Screenshot[]>([])
  const [submitted, setSubmitted] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  function set(field: string, value: string) {
    setForm(p => ({ ...p, [field]: value }))
  }

  function handleFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    const newScreenshots = files.map(f => ({
      name: f.name,
      url: URL.createObjectURL(f),
      size: f.size,
    }))
    setScreenshots(prev => [...prev, ...newScreenshots])
    e.target.value = ''
  }

  function removeScreenshot(idx: number) {
    setScreenshots(prev => prev.filter((_, i) => i !== idx))
  }

  function handleSubmit() {
    if (!form.title.trim() || !form.description.trim()) return
    // TODO: wire to form service (Formspree, EmailJS, etc.)
    console.log('Issue report:', { ...form, screenshots: screenshots.map(s => s.name) })
    setSubmitted(true)
  }

  if (submitted) {
    return (
      <div style={{ textAlign: 'center', padding: '48px 24px' }}>
        <p style={{ fontSize: '40px', marginBottom: '16px' }}>✅</p>
        <p style={{ fontSize: '16px', fontWeight: 600, color: 'var(--color-navy-800)', marginBottom: '8px' }}>Issue reported</p>
        <p style={{ fontSize: '13px', color: 'var(--color-navy-400)', marginBottom: '24px', lineHeight: '1.6' }}>
          Thanks for the report. We'll look into it and follow up if needed.
        </p>
        <Button variant="secondary" size="sm" onClick={() => { setSubmitted(false); setForm({ title: '', category: '', description: '', stepsToReproduce: '', email: '' }); setScreenshots([]) }}>
          Report another issue
        </Button>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
        <div style={{ gridColumn: 'span 2' }}>
          <label style={lS}>Issue title <span style={{ color: '#b91c1c' }}>*</span></label>
          <input
            value={form.title}
            onChange={e => set('title', e.target.value)}
            placeholder="e.g. Booking date shows wrong day"
            style={iS}
            autoFocus
          />
        </div>

        <div style={{ gridColumn: 'span 2' }}>
          <label style={lS}>Category</label>
          <select value={form.category} onChange={e => set('category', e.target.value)} style={{ ...iS, cursor: 'pointer' }}>
            <option value="">Select a category</option>
            <option value="bug">Bug / something broken</option>
            <option value="ui">UI / display issue</option>
            <option value="data">Data not saving correctly</option>
            <option value="performance">Slow or unresponsive</option>
            <option value="other">Other</option>
          </select>
        </div>
      </div>

      <div>
        <label style={lS}>Description <span style={{ color: '#b91c1c' }}>*</span></label>
        <textarea
          value={form.description}
          onChange={e => set('description', e.target.value)}
          rows={4}
          placeholder="Describe what happened and what you expected to happen..."
          style={{ ...iS, resize: 'vertical' as const }}
        />
      </div>

      <div>
        <label style={lS}>Steps to reproduce (optional)</label>
        <textarea
          value={form.stepsToReproduce}
          onChange={e => set('stepsToReproduce', e.target.value)}
          rows={3}
          placeholder={'1. Go to Bookings\n2. Click a booking\n3. ...'}
          style={{ ...iS, resize: 'vertical' as const }}
        />
      </div>

      {/* Screenshots */}
      <div>
        <label style={lS}>Screenshots (optional)</label>
        <div
          onClick={() => fileRef.current?.click()}
          style={{
            border: '2px dashed var(--color-navy-200)',
            borderRadius: '10px',
            padding: '20px',
            textAlign: 'center',
            cursor: 'pointer',
            transition: 'all 0.15s',
            background: 'transparent',
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--color-navy-400)'; e.currentTarget.style.background = 'var(--color-navy-50)' }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--color-navy-200)'; e.currentTarget.style.background = 'transparent' }}
        >
          <p style={{ fontSize: '13px', color: 'var(--color-navy-400)' }}>Click to attach screenshots</p>
          <p style={{ fontSize: '11px', color: 'var(--color-navy-300)', marginTop: '2px' }}>PNG, JPG, GIF supported</p>
        </div>
        <input ref={fileRef} type="file" multiple accept="image/*" onChange={handleFiles} style={{ display: 'none' }} />

        {screenshots.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '12px' }}>
            {screenshots.map((s, idx) => (
              <div key={idx} style={{ position: 'relative', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--color-navy-100)' }}>
                <img src={s.url} alt={s.name} style={{ width: '120px', height: '80px', objectFit: 'cover', display: 'block' }} />
                <div style={{ padding: '4px 8px', background: 'white', borderTop: '1px solid var(--color-navy-100)' }}>
                  <p style={{ fontSize: '10px', color: 'var(--color-navy-500)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '104px' }}>{s.name}</p>
                  <p style={{ fontSize: '10px', color: 'var(--color-navy-400)' }}>{formatBytes(s.size)}</p>
                </div>
                <button
                  onClick={() => removeScreenshot(idx)}
                  style={{ position: 'absolute', top: '4px', right: '4px', width: '20px', height: '20px', borderRadius: '50%', background: 'rgba(0,0,0,0.6)', border: 'none', cursor: 'pointer', color: 'white', fontSize: '11px', display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1 }}
                >✕</button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <label style={lS}>Your email (optional)</label>
        <input
          type="email"
          value={form.email}
          onChange={e => set('email', e.target.value)}
          placeholder="For follow-up if needed"
          style={iS}
        />
      </div>

      <div style={{ paddingTop: '4px' }}>
        <Button onClick={handleSubmit} disabled={!form.title.trim() || !form.description.trim()}>
          Submit report
        </Button>
      </div>
    </div>
  )
}

// ── Contact form ──────────────────────────────────────────────────

function ContactForm() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  })
  const [attachments, setAttachments] = useState<Screenshot[]>([])
  const [submitted, setSubmitted] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  function set(field: string, value: string) {
    setForm(p => ({ ...p, [field]: value }))
  }

  function handleFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    const newAttachments = files.map(f => ({
      name: f.name,
      url: URL.createObjectURL(f),
      size: f.size,
    }))
    setAttachments(prev => [...prev, ...newAttachments])
    e.target.value = ''
  }

  function removeAttachment(idx: number) {
    setAttachments(prev => prev.filter((_, i) => i !== idx))
  }

  function handleSubmit() {
    if (!form.email.trim() || !form.message.trim()) return
    // TODO: wire to form service
    console.log('Contact form:', { ...form, attachments: attachments.map(a => a.name) })
    setSubmitted(true)
  }

  if (submitted) {
    return (
      <div style={{ textAlign: 'center', padding: '48px 24px' }}>
        <p style={{ fontSize: '40px', marginBottom: '16px' }}>💌</p>
        <p style={{ fontSize: '16px', fontWeight: 600, color: 'var(--color-navy-800)', marginBottom: '8px' }}>Message sent</p>
        <p style={{ fontSize: '13px', color: 'var(--color-navy-400)', marginBottom: '24px', lineHeight: '1.6' }}>
          Thanks for reaching out. We'll get back to you soon.
        </p>
        <Button variant="secondary" size="sm" onClick={() => { setSubmitted(false); setForm({ name: '', email: '', subject: '', message: '' }); setAttachments([]) }}>
          Send another message
        </Button>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
        <div>
          <label style={lS}>Name</label>
          <input value={form.name} onChange={e => set('name', e.target.value)} placeholder="Your name" style={iS} autoFocus />
        </div>
        <div>
          <label style={lS}>Email <span style={{ color: '#b91c1c' }}>*</span></label>
          <input type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="your@email.com" style={iS} />
        </div>
        <div style={{ gridColumn: 'span 2' }}>
          <label style={lS}>Subject</label>
          <input value={form.subject} onChange={e => set('subject', e.target.value)} placeholder="What's this about?" style={iS} />
        </div>
      </div>

      <div>
        <label style={lS}>Message <span style={{ color: '#b91c1c' }}>*</span></label>
        <textarea
          value={form.message}
          onChange={e => set('message', e.target.value)}
          rows={5}
          placeholder="How can we help?"
          style={{ ...iS, resize: 'vertical' as const }}
        />
      </div>

      {/* Attachments */}
      <div>
        <label style={lS}>Attachments (optional)</label>
        <div
          onClick={() => fileRef.current?.click()}
          style={{
            border: '2px dashed var(--color-navy-200)',
            borderRadius: '10px',
            padding: '20px',
            textAlign: 'center',
            cursor: 'pointer',
            transition: 'all 0.15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--color-navy-400)'; e.currentTarget.style.background = 'var(--color-navy-50)' }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--color-navy-200)'; e.currentTarget.style.background = 'transparent' }}
        >
          <p style={{ fontSize: '13px', color: 'var(--color-navy-400)' }}>Click to attach files</p>
          <p style={{ fontSize: '11px', color: 'var(--color-navy-300)', marginTop: '2px' }}>Images, PDFs supported</p>
        </div>
        <input ref={fileRef} type="file" multiple accept="image/*,.pdf" onChange={handleFiles} style={{ display: 'none' }} />

        {attachments.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '10px' }}>
            {attachments.map((a, idx) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 12px', background: 'var(--color-navy-50)', borderRadius: '8px', border: '1px solid var(--color-navy-100)' }}>
                <span style={{ fontSize: '16px' }}>{a.name.endsWith('.pdf') ? '📄' : '🖼️'}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: '12px', color: 'var(--color-navy-700)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.name}</p>
                  <p style={{ fontSize: '11px', color: 'var(--color-navy-400)' }}>{formatBytes(a.size)}</p>
                </div>
                <button
                  onClick={() => removeAttachment(idx)}
                  style={{ fontSize: '12px', color: 'var(--color-navy-300)', background: 'none', border: 'none', cursor: 'pointer', padding: '0 4px', transition: 'color 0.15s' }}
                  onMouseEnter={e => (e.currentTarget.style.color = '#ef4444')}
                  onMouseLeave={e => (e.currentTarget.style.color = 'var(--color-navy-300)')}
                >✕</button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ paddingTop: '4px' }}>
        <Button onClick={handleSubmit} disabled={!form.email.trim() || !form.message.trim()}>
          Send message
        </Button>
      </div>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────

export default function HelpPage() {
  const [activeTab, setActiveTab] = useState<HelpTab>('issue')

  const TABS: { id: HelpTab; label: string; icon: string }[] = [
    { id: 'issue',   label: 'Report an issue', icon: '🐛' },
    { id: 'contact', label: 'Contact',          icon: '💬' },
  ]

  return (
    <AppShell>
      <div className="px-10 py-10 max-w-2xl">
        <PageHeader
          title="Help"
          subtitle="Get support or send us a message"
        />

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '0', marginBottom: '28px', borderBottom: '1px solid var(--color-navy-100)' }}>
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
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        <Card className="p-6">
          {activeTab === 'issue'   && <ReportIssueForm />}
          {activeTab === 'contact' && <ContactForm />}
        </Card>

        <p style={{ fontSize: '11px', color: 'var(--color-navy-300)', marginTop: '16px' }}>
          Submissions are stored locally for now — wire to a form service like Formspree or EmailJS to enable delivery.
        </p>
      </div>
    </AppShell>
  )
}