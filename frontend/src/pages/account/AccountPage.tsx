import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, Button, PageHeader } from '@/components/ui'
import AppShell from '@/components/layout/AppShell'
import { WEDDING_QUESTIONNAIRE } from '@/data/questionnaire'
import type { QuestionnaireSection } from '@/types/questionnaire'
import DocumentsTab from './DocumentsTab'
import { api } from '@/lib/api'

type AccountTab = 'profile' | 'branding' | 'questionnaire' | 'documents'

const TABS: { id: AccountTab; label: string }[] = [
  { id: 'profile',       label: 'Profile' },
  { id: 'branding',      label: 'Branding & contact' },
  { id: 'questionnaire', label: 'Questionnaire' },
  { id: 'documents',     label: 'Documents & payments' },
]

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

function Field({ label, value, onChange, placeholder, type = 'text', hint }: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  type?: string
  hint?: string
}) {
  return (
    <div>
      <label style={labelStyle}>{label}</label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        style={inputStyle}
      />
      {hint && <p style={{ fontSize: '11px', color: 'var(--color-navy-300)', marginTop: '4px' }}>{hint}</p>}
    </div>
  )
}

// ── Shared photographer data hook ─────────────────────────────────

function usePhotographer() {
  const [data, setData] = useState<Record<string, any> | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/api/photographer/me')
      .then(r => setData(r.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  async function save(patch: Record<string, any>) {
    const r = await api.patch('/api/photographer/me', patch)
    setData(r.data)
    return r.data
  }

  return { data, loading, save }
}

// ── Profile tab ───────────────────────────────────────────────────

function ProfileTab() {
  const { data, loading, save } = usePhotographer()
  const [form, setForm] = useState({
    firstName:    '',
    lastName:     '',
    businessName: '',
    website:      '',
    timezone:     'America/New_York',
    logoUrl:      '',
    nickname:     localStorage.getItem('dossier_nickname') ?? '',
  })
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!data) return
    setForm({
      firstName:    data.firstName ?? '',
      lastName:     data.lastName ?? '',
      businessName: data.businessName ?? '',
      website:      data.website ?? '',
      timezone:     data.timezone ?? 'America/New_York',
      logoUrl:      data.logoUrl ?? '',
      nickname:     localStorage.getItem('dossier_nickname') ?? data.firstName ?? '',
    })
  }, [data])

  async function handleSave() {
    setSaving(true)
    try {
      await save({
        firstName:    form.firstName,
        lastName:     form.lastName,
        businessName: form.businessName || null,
        website:      form.website || null,
        timezone:     form.timezone,
        logoUrl:      form.logoUrl || null,
      })
      localStorage.setItem('dossier_nickname', form.nickname)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (e) {
      console.error(e)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="text-sm" style={{ color: 'var(--color-navy-400)' }}>Loading...</div>

  return (
    <div className="space-y-6 max-w-lg">
      <Card className="p-6 space-y-4">
        <h3 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-navy-700)' }}>Personal info</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <Field label="First name" value={form.firstName} onChange={v => setForm(p => ({ ...p, firstName: v }))} />
          <Field label="Last name" value={form.lastName} onChange={v => setForm(p => ({ ...p, lastName: v }))} />
        </div>
        <Field
          label="Preferred name / nickname"
          value={form.nickname}
          onChange={v => setForm(p => ({ ...p, nickname: v }))}
          placeholder="What should the dashboard call you?"
          hint="Used in the dashboard greeting (e.g. Good morning, Caitee.)"
        />
      </Card>

      <Card className="p-6 space-y-4">
        <h3 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-navy-700)' }}>Business</h3>
        <Field label="Business name" value={form.businessName} onChange={v => setForm(p => ({ ...p, businessName: v }))} placeholder="Your studio name" />
        <Field label="Website" value={form.website} onChange={v => setForm(p => ({ ...p, website: v }))} placeholder="yoursite.com" />
        <div>
          <label style={labelStyle}>Timezone</label>
          <select
            value={form.timezone}
            onChange={e => setForm(p => ({ ...p, timezone: e.target.value }))}
            style={{ ...inputStyle, cursor: 'pointer' }}
          >
            {['America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles', 'America/Anchorage', 'Pacific/Honolulu'].map(tz => (
              <option key={tz} value={tz}>{tz.replace('America/', '').replace('_', ' ')}</option>
            ))}
          </select>
        </div>
      </Card>

      <Card className="p-6 space-y-4">
        <h3 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-navy-700)' }}>Logo</h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '12px' }}>
          <div style={{
            width: '64px', height: '64px', borderRadius: '10px', overflow: 'hidden',
            background: 'var(--color-navy-900)', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            fontSize: '18px', fontWeight: 700, color: 'var(--color-gold-warm)',
            flexShrink: 0,
          }}>
            {form.logoUrl
              ? <img src={form.logoUrl} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
              : (form.firstName[0] ?? '') + (form.lastName[0] ?? '')
            }
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: '12px', color: 'var(--color-navy-400)' }}>
              Paste a URL to your logo below. Used on the client portal and day-of sheet.
            </p>
          </div>
        </div>
        <Field
          label="Logo URL"
          value={form.logoUrl}
          onChange={v => setForm(p => ({ ...p, logoUrl: v }))}
          placeholder="https://yoursite.com/logo.png"
          hint="PNG, SVG, or WebP. Recommended 400×400px or wider."
        />
      </Card>

      <Button onClick={handleSave} disabled={saving}>
        {saving ? 'Saving...' : saved ? '✓ Saved' : 'Save changes'}
      </Button>
    </div>
  )
}

// ── Branding tab ──────────────────────────────────────────────────

function BrandingTab() {
  const { data, loading, save } = usePhotographer()
  const [form, setForm] = useState({
    phone:                  '',
    email:                  '',
    instagram:              '',
    businessAddress:        '',
    calendlyUrl:            '',
    portalSignoff:          '',
    galleryDeliveryWeeks:    '6',
    galleryDeliveryWeeksMax: '8',
  })
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!data) return
    setForm({
      phone:                data.phone ?? '',
      email:                data.email ?? '',
      instagram:            data.instagram ?? '',
      businessAddress:      data.businessAddress ?? '',
      calendlyUrl:          data.calendlyUrl ?? '',
      portalSignoff:        data.portalSignoff ?? '',
      galleryDeliveryWeeks:    data.galleryDeliveryWeeks    ? String(data.galleryDeliveryWeeks)    : '6',
      galleryDeliveryWeeksMax: data.galleryDeliveryWeeksMax ? String(data.galleryDeliveryWeeksMax) : '8',
    })
  }, [data])

  async function handleSave() {
    setSaving(true)
    try {
      await save({
        phone:           form.phone || null,
        instagram:       form.instagram || null,
        businessAddress: form.businessAddress || null,
        calendlyUrl:     form.calendlyUrl || null,
        portalSignoff:          form.portalSignoff || null,
        galleryDeliveryWeeks:    form.galleryDeliveryWeeks    ? parseInt(form.galleryDeliveryWeeks)    : 6,
        galleryDeliveryWeeksMax: form.galleryDeliveryWeeksMax ? parseInt(form.galleryDeliveryWeeksMax) : 8,
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (e) {
      console.error(e)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="text-sm" style={{ color: 'var(--color-navy-400)' }}>Loading...</div>

  return (
    <div className="space-y-6 max-w-lg">
      <Card className="p-6 space-y-4">
        <h3 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-navy-700)' }}>Contact info</h3>
        <p style={{ fontSize: '12px', color: 'var(--color-navy-400)', lineHeight: '1.5' }}>
          This appears on the client portal, day-of sheet, and any automated emails.
        </p>
        <Field label="Phone" value={form.phone} onChange={v => setForm(p => ({ ...p, phone: v }))} placeholder="(555) 000-0000" />
        <Field label="Email" value={form.email} onChange={v => setForm(p => ({ ...p, email: v }))} type="email" hint="Read-only — tied to your login." />
        <Field label="Instagram" value={form.instagram} onChange={v => setForm(p => ({ ...p, instagram: v }))} placeholder="@handle" />
        <Field label="Business address" value={form.businessAddress} onChange={v => setForm(p => ({ ...p, businessAddress: v }))} placeholder="123 Main St, City, State ZIP" />
      </Card>

      <Card className="p-6 space-y-4">
        <h3 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-navy-700)' }}>Delivery</h3>
        <p style={{ fontSize: '12px', color: 'var(--color-navy-400)', lineHeight: '1.5' }}>
          Shown to clients as a range, e.g. "6–8 weeks after your wedding".
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <Field
            label="Minimum weeks"
            value={form.galleryDeliveryWeeks}
            onChange={v => setForm(p => ({ ...p, galleryDeliveryWeeks: v }))}
            placeholder="6"
            type="number"
          />
          <Field
            label="Maximum weeks"
            value={form.galleryDeliveryWeeksMax}
            onChange={v => setForm(p => ({ ...p, galleryDeliveryWeeksMax: v }))}
            placeholder="8"
            type="number"
          />
        </div>
      </Card>

      <Card className="p-6 space-y-4">
        <h3 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-navy-700)' }}>Scheduling</h3>
        <p style={{ fontSize: '12px', color: 'var(--color-navy-400)', lineHeight: '1.5' }}>
          How couples can book a call with you.
        </p>
        <Field
          label="Calendly URL (optional)"
          value={form.calendlyUrl}
          onChange={v => setForm(p => ({ ...p, calendlyUrl: v }))}
          placeholder="https://calendly.com/yourname"
        />
      </Card>

      <Card className="p-6 space-y-4">
        <h3 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-navy-700)' }}>Portal sign-off</h3>
        <p style={{ fontSize: '12px', color: 'var(--color-navy-400)' }}>Appears at the bottom of the client portal footer.</p>
        <div>
          <label style={labelStyle}>Sign-off message</label>
          <textarea
            value={form.portalSignoff}
            onChange={e => setForm(p => ({ ...p, portalSignoff: e.target.value }))}
            rows={3}
            style={{ ...inputStyle, resize: 'vertical' as const }}
            placeholder={`Looking forward to capturing your day,\n${data?.firstName ?? 'Your name'}`}
          />
        </div>
      </Card>

      <Button onClick={handleSave} disabled={saving}>
        {saving ? 'Saving...' : saved ? '✓ Saved' : 'Save changes'}
      </Button>
    </div>
  )
}

// ── Questionnaire tab ─────────────────────────────────────────────

function QuestionnaireTab() {
  const [sections] = useState<QuestionnaireSection[]>(WEDDING_QUESTIONNAIRE)
  const [expandedSection, setExpandedSection] = useState<string | null>(null)

  return (
    <div className="space-y-3 max-w-2xl">
      <p style={{ fontSize: '13px', color: 'var(--color-navy-400)', lineHeight: '1.5', marginBottom: '8px' }}>
        This is the questionnaire sent to couples via their client portal. Click a section to view its fields. Full editing coming soon.
      </p>

      {sections.map((section, i) => (
        <Card key={section.id}>
          <button
            onClick={() => setExpandedSection(expandedSection === section.id ? null : section.id)}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '14px 18px', background: 'transparent', border: 'none',
              cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-navy-400)', width: '20px' }}>{i + 1}</span>
              <span style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-navy-800)' }}>{section.title}</span>
              <span style={{ fontSize: '11px', color: 'var(--color-navy-300)' }}>{section.fields.length} fields</span>
            </div>
            <span style={{ fontSize: '12px', color: 'var(--color-navy-400)', transform: expandedSection === section.id ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }}>▾</span>
          </button>

          {expandedSection === section.id && (
            <div style={{ borderTop: '1px solid var(--color-navy-100)' }}>
              {section.fields.map((field, j) => (
                <div key={field.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '10px 18px', borderTop: j === 0 ? 'none' : '1px solid var(--color-navy-50)' }}>
                  <span style={{ fontSize: '10px', fontFamily: 'monospace', background: 'var(--color-navy-100)', color: 'var(--color-navy-500)', padding: '2px 6px', borderRadius: '4px', flexShrink: 0, marginTop: '1px' }}>
                    {field.type}
                  </span>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: '13px', color: 'var(--color-navy-700)' }}>
                      {field.label}
                      {field.required && <span style={{ color: '#b91c1c', marginLeft: '4px' }}>*</span>}
                    </p>
                    {field.hint && <p style={{ fontSize: '11px', color: 'var(--color-navy-300)', marginTop: '2px' }}>{field.hint}</p>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      ))}
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────

export default function AccountPage() {
  const [activeTab, setActiveTab] = useState<AccountTab>('profile')
  const navigate = useNavigate()

  return (
    <AppShell>
      <div className="px-10 py-10 max-w-4xl">
        <div className="flex items-center gap-3 mb-8">
          <button
            onClick={() => navigate(-1)}
            style={{ fontSize: '12px', color: 'var(--color-navy-400)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontFamily: 'inherit' }}
          >
            ← Back
          </button>
        </div>

        <PageHeader
          title="Account"
          subtitle="Manage your profile, branding, packages, and questionnaire"
        />

        <div className="flex gap-0 mb-8" style={{ borderBottom: '1px solid var(--color-navy-100)' }}>
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                borderBottomColor: activeTab === tab.id ? 'var(--color-navy-800)' : 'transparent',
                color: activeTab === tab.id ? 'var(--color-navy-900)' : 'var(--color-navy-400)',
                background: 'none', border: 'none',
                borderBottom: `2px solid ${activeTab === tab.id ? 'var(--color-navy-800)' : 'transparent'}`,
                cursor: 'pointer', fontFamily: 'inherit', marginBottom: '-1px',
                padding: '10px 16px', fontSize: '14px', fontWeight: 500,
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'profile'       && <ProfileTab />}
        {activeTab === 'branding'      && <BrandingTab />}
        {activeTab === 'questionnaire' && <QuestionnaireTab />}
        {activeTab === 'documents'     && <DocumentsTab />}
      </div>
    </AppShell>
  )
}