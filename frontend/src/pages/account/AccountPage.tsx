import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, Button, PageHeader } from '@/components/ui'
import AppShell from '@/components/layout/AppShell'
import { WEDDING_QUESTIONNAIRE } from '@/data/questionnaire'
import { SAMPLE_PACKAGES } from '@/data/sample'
import type { PackageTemplate } from '@/types'
import type { QuestionnaireSection } from '@/types/questionnaire'
import DocumentsTab from './DocumentsTab'

type AccountTab = 'profile' | 'branding' | 'packages' | 'questionnaire' | 'documents'

const TABS: { id: AccountTab; label: string }[] = [
  { id: 'profile',       label: 'Profile' },
  { id: 'branding',      label: 'Branding & contact' },
  { id: 'packages',      label: 'Packages' },
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

// ── Profile tab ───────────────────────────────────────────────────

function ProfileTab() {
  const [form, setForm] = useState({
    fullName: 'Caitee Smith',
    email: 'hello@caiteesmith.com',
    businessName: 'Caitee Smith Photography',
    website: 'caiteesmith.com',
    timezone: 'America/New_York',
    logoUrl: '',
  })
  const [saved, setSaved] = useState(false)

  function handleSave() {
    // TODO: PATCH /photographer with form data
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="space-y-6 max-w-lg">
      <Card className="p-6 space-y-4">
        <h3 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-navy-700)' }}>Personal info</h3>
        <Field label="Full name" value={form.fullName} onChange={v => setForm(p => ({ ...p, fullName: v }))} />
        <Field label="Email" value={form.email} onChange={v => setForm(p => ({ ...p, email: v }))} type="email" />
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{
            width: '64px', height: '64px', borderRadius: '10px',
            background: 'var(--color-navy-900)', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            fontSize: '18px', fontWeight: 700, color: 'var(--color-gold-warm)',
            flexShrink: 0,
          }}>
            CS
          </div>
          <div style={{ flex: 1 }}>
            <Button variant="secondary" size="sm">Upload logo</Button>
            <p style={{ fontSize: '11px', color: 'var(--color-navy-400)', marginTop: '5px' }}>
              PNG or SVG, recommended 400×400px. Used on the client portal and day-of sheet.
            </p>
          </div>
        </div>
      </Card>

      <Button onClick={handleSave}>{saved ? '✓ Saved' : 'Save changes'}</Button>
    </div>
  )
}

// ── Branding tab ──────────────────────────────────────────────────

function BrandingTab() {
  const [form, setForm] = useState({
    phone: '(972) 555-0000',
    email: 'hello@caiteesmith.com',
    instagram: '@caiteesmith',
    calendlyUrl: '',
    googleMeetNote: 'Request a Google Meet via email',
    zoomNote: 'Request a Zoom link via email',
    portalEmailSignoff: 'Looking forward to capturing your day,\nCaitee',
  })
  const [saved, setSaved] = useState(false)

  function handleSave() {
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="space-y-6 max-w-lg">
      <Card className="p-6 space-y-4">
        <h3 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-navy-700)' }}>Contact info</h3>
        <p style={{ fontSize: '12px', color: 'var(--color-navy-400)', lineHeight: '1.5' }}>
          This appears on the client portal, day-of sheet, and any automated emails.
        </p>
        <Field label="Phone" value={form.phone} onChange={v => setForm(p => ({ ...p, phone: v }))} placeholder="(555) 000-0000" />
        <Field label="Email" value={form.email} onChange={v => setForm(p => ({ ...p, email: v }))} type="email" />
        <Field label="Instagram" value={form.instagram} onChange={v => setForm(p => ({ ...p, instagram: v }))} placeholder="@handle" />
      </Card>

      <Card className="p-6 space-y-4">
        <h3 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-navy-700)' }}>Scheduling</h3>
        <p style={{ fontSize: '12px', color: 'var(--color-navy-400)', lineHeight: '1.5' }}>
          How couples can book a call with you. These links appear on the Resources tab of their portal.
        </p>
        <Field
          label="Calendly URL (optional)"
          value={form.calendlyUrl}
          onChange={v => setForm(p => ({ ...p, calendlyUrl: v }))}
          placeholder="https://calendly.com/yourname"
          hint="If set, the Google Meet and Zoom cards will link here instead of email."
        />
        <Field label="Google Meet note" value={form.googleMeetNote} onChange={v => setForm(p => ({ ...p, googleMeetNote: v }))} />
        <Field label="Zoom note" value={form.zoomNote} onChange={v => setForm(p => ({ ...p, zoomNote: v }))} />
      </Card>

      <Card className="p-6 space-y-4">
        <h3 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-navy-700)' }}>Portal sign-off</h3>
        <p style={{ fontSize: '12px', color: 'var(--color-navy-400)' }}>Appears at the bottom of the client portal footer.</p>
        <div>
          <label style={labelStyle}>Sign-off message</label>
          <textarea
            value={form.portalEmailSignoff}
            onChange={e => setForm(p => ({ ...p, portalEmailSignoff: e.target.value }))}
            rows={3}
            style={{ ...inputStyle, resize: 'vertical' as const }}
          />
        </div>
      </Card>

      <Button onClick={handleSave}>{saved ? '✓ Saved' : 'Save changes'}</Button>
    </div>
  )
}

// ── Packages tab ──────────────────────────────────────────────────

function PackagesTab() {
  const [packages, setPackages] = useState<PackageTemplate[]>(SAMPLE_PACKAGES)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  function handleSave() {
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  function updatePackage(id: string, field: keyof PackageTemplate, value: string | number | boolean | string[]) {
    setPackages(prev => prev.map(p => p.id === id ? { ...p, [field]: value } : p))
  }

  function addPackage() {
    const newPkg: PackageTemplate = {
      id: `pkg-${Date.now()}`,
      photographerId: 'photographer-1',
      name: 'New package',
      price: 0,
      hoursCovered: 8,
      includes: [],
      isActive: true,
    }
    setPackages(prev => [...prev, newPkg])
    setEditingId(newPkg.id)
  }

  return (
    <div className="space-y-4 max-w-2xl">
      <p style={{ fontSize: '13px', color: 'var(--color-navy-400)', lineHeight: '1.5' }}>
        These are your reusable package templates. When you create a booking, you'll select from these. Editing a template doesn't affect existing bookings.
      </p>

      {packages.map(pkg => (
        <Card key={pkg.id} className="p-5">
          {editingId === pkg.id ? (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <Field label="Package name" value={pkg.name} onChange={v => updatePackage(pkg.id, 'name', v)} />
                <Field label="Price" value={String(pkg.price)} onChange={v => updatePackage(pkg.id, 'price', parseFloat(v) || 0)} type="number" />
                <Field label="Hours covered" value={String(pkg.hoursCovered ?? '')} onChange={v => updatePackage(pkg.id, 'hoursCovered', parseFloat(v) || 0)} type="number" />
                <div>
                  <label style={labelStyle}>Status</label>
                  <select
                    value={pkg.isActive ? 'active' : 'inactive'}
                    onChange={e => updatePackage(pkg.id, 'isActive', e.target.value === 'active')}
                    style={{ ...inputStyle, cursor: 'pointer' }}
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>
              <div>
                <label style={labelStyle}>Description</label>
                <input
                  value={pkg.description ?? ''}
                  onChange={e => updatePackage(pkg.id, 'description', e.target.value)}
                  style={inputStyle}
                  placeholder="Short description"
                />
              </div>
              <div>
                <label style={labelStyle}>What's included (one per line)</label>
                <textarea
                  value={pkg.includes.join('\n')}
                  onChange={e => updatePackage(pkg.id, 'includes', e.target.value.split('\n').filter(Boolean))}
                  rows={4}
                  style={{ ...inputStyle, resize: 'vertical' as const }}
                  placeholder="Online gallery&#10;Print release&#10;400+ edited images"
                />
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={() => { setEditingId(null); handleSave() }}>Save package</Button>
                <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>Cancel</Button>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px' }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <p style={{ fontSize: '15px', fontWeight: 600, color: 'var(--color-navy-800)' }}>{pkg.name}</p>
                  {!pkg.isActive && (
                    <span style={{ fontSize: '10px', background: 'var(--color-navy-100)', color: 'var(--color-navy-400)', padding: '2px 7px', borderRadius: '20px', fontWeight: 500 }}>
                      Inactive
                    </span>
                  )}
                </div>
                {pkg.description && <p style={{ fontSize: '12px', color: 'var(--color-navy-400)', marginBottom: '6px' }}>{pkg.description}</p>}
                <div style={{ display: 'flex', gap: '16px', marginBottom: '8px' }}>
                  <span style={{ fontSize: '18px', fontWeight: 700, color: 'var(--color-navy-900)' }}>${pkg.price.toLocaleString()}</span>
                  {pkg.hoursCovered && <span style={{ fontSize: '13px', color: 'var(--color-navy-400)', alignSelf: 'flex-end', paddingBottom: '2px' }}>{pkg.hoursCovered}h coverage</span>}
                </div>
                {pkg.includes.length > 0 && (
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {pkg.includes.map((item, i) => (
                      <span key={i} style={{ fontSize: '11px', background: 'var(--color-navy-50)', color: 'var(--color-navy-600)', padding: '2px 8px', borderRadius: '20px' }}>
                        {item}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <Button size="sm" variant="secondary" onClick={() => setEditingId(pkg.id)}>Edit</Button>
            </div>
          )}
        </Card>
      ))}

      <Button variant="secondary" size="sm" onClick={addPackage}>+ New package</Button>
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
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '14px 18px',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              fontFamily: 'inherit',
              textAlign: 'left',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-navy-400)', width: '20px' }}>{i + 1}</span>
              <span style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-navy-800)' }}>{section.title}</span>
              <span style={{ fontSize: '11px', color: 'var(--color-navy-300)' }}>{section.fields.length} fields</span>
            </div>
            <span style={{ fontSize: '12px', color: 'var(--color-navy-400)', transform: expandedSection === section.id ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }}>
              ▾
            </span>
          </button>

          {expandedSection === section.id && (
            <div style={{ borderTop: '1px solid var(--color-navy-100)' }}>
              {section.fields.map((field, j) => (
                <div
                  key={field.id}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '12px',
                    padding: '10px 18px',
                    borderTop: j === 0 ? 'none' : '1px solid var(--color-navy-50)',
                  }}
                >
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

      <div style={{ padding: '12px 0' }}>
        <p style={{ fontSize: '12px', color: 'var(--color-navy-300)' }}>
          Full questionnaire editor — add, remove, and reorder fields — coming in a future update.
        </p>
      </div>
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

        {/* Tabs */}
        <div className="flex gap-0 mb-8" style={{ borderBottom: '1px solid var(--color-navy-100)' }}>
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="px-4 py-2.5 text-sm font-medium border-b-2 transition-all -mb-px"
              style={{
                borderBottomColor: activeTab === tab.id ? 'var(--color-navy-800)' : 'transparent',
                color: activeTab === tab.id ? 'var(--color-navy-900)' : 'var(--color-navy-400)',
                background: 'none',
                border: 'none',
                borderBottom: `2px solid ${activeTab === tab.id ? 'var(--color-navy-800)' : 'transparent'}`,
                cursor: 'pointer',
                fontFamily: 'inherit',
                marginBottom: '-1px',
                padding: '10px 16px',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'profile'       && <ProfileTab />}
        {activeTab === 'branding'      && <BrandingTab />}
        {activeTab === 'packages'      && <PackagesTab />}
        {activeTab === 'questionnaire' && <QuestionnaireTab />}
        {activeTab === 'documents'     && <DocumentsTab />}
      </div>
    </AppShell>
  )
}