import { useState } from 'react'
import AppShell from '@/components/layout/AppShell'
import { Card, Button, PageHeader } from '@/components/ui'
import { SAMPLE_PACKAGES } from '@/data/sample'
import type { PackageTemplate } from '@/types'

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

function Field({ label, value, onChange, placeholder, type = 'text' }: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  type?: string
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
    </div>
  )
}

export default function PackagesPage() {
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
    <AppShell>
      <div className="px-10 py-10 max-w-2xl">
        <PageHeader
          title="Packages"
          subtitle="Reusable package templates for new bookings"
        />

        <p style={{ fontSize: '13px', color: 'var(--color-navy-400)', lineHeight: '1.5', marginBottom: '24px' }}>
          Editing a template doesn't affect existing bookings.
        </p>

        <div className="space-y-4">
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

        {saved && (
          <p style={{ fontSize: '12px', color: 'var(--color-steel-500)', marginTop: '16px' }}>✓ Changes saved</p>
        )}
      </div>
    </AppShell>
  )
}