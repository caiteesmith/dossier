import { useState } from 'react'
import AppShell from '@/components/layout/AppShell'
import { Card, Button, PageHeader } from '@/components/ui'

type GearCategory = 'camera_body' | 'lens' | 'flash' | 'tripod' | 'audio' | 'accessory' | 'other'
type GearCondition = 'excellent' | 'good' | 'fair' | 'poor'

interface GearItem {
  id: string
  category: GearCategory
  make: string
  model: string
  serialNumber: string
  condition: GearCondition
  purchaseDate: string
  purchasePrice: string
  insuranceValue: string
  warrantyExpiration: string
  assignedTo: string
  notes: string
}

const CATEGORIES: { value: GearCategory; label: string; icon: string }[] = [
  { value: 'camera_body', label: 'Camera body',  icon: '📷' },
  { value: 'lens',        label: 'Lens',          icon: '🔭' },
  { value: 'flash',       label: 'Flash / light', icon: '⚡' },
  { value: 'tripod',      label: 'Tripod / stand',icon: '🎯' },
  { value: 'audio',       label: 'Audio',         icon: '🎙️' },
  { value: 'accessory',   label: 'Accessory',     icon: '🔧' },
  { value: 'other',       label: 'Other',         icon: '📦' },
]

const CONDITIONS: { value: GearCondition; label: string; color: string }[] = [
  { value: 'excellent', label: 'Excellent', color: '#276840' },
  { value: 'good',      label: 'Good',      color: 'var(--color-steel-600)' },
  { value: 'fair',      label: 'Fair',      color: 'var(--color-gold-warm)' },
  { value: 'poor',      label: 'Poor',      color: '#b91c1c' },
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

const SAMPLE_GEAR: GearItem[] = [
  {
    id: '1',
    category: 'camera_body',
    make: 'Sony',
    model: 'A7 IV',
    serialNumber: '1234567',
    condition: 'excellent',
    purchaseDate: '2023-01-15',
    purchasePrice: '2500',
    insuranceValue: '2200',
    warrantyExpiration: '2026-01-15',
    assignedTo: '',
    notes: 'Primary body',
  },
  {
    id: '2',
    category: 'lens',
    make: 'Sony',
    model: '35mm f/1.4 GM',
    serialNumber: '7654321',
    condition: 'excellent',
    purchaseDate: '2023-03-01',
    purchasePrice: '1400',
    insuranceValue: '1300',
    warrantyExpiration: '2026-03-01',
    assignedTo: '',
    notes: '',
  },
]

function emptyItem(): GearItem {
  return {
    id: `gear-${Date.now()}`,
    category: 'camera_body',
    make: '',
    model: '',
    serialNumber: '',
    condition: 'excellent',
    purchaseDate: '',
    purchasePrice: '',
    insuranceValue: '',
    warrantyExpiration: '',
    assignedTo: '',
    notes: '',
  }
}

function GearForm({ item, onSave, onCancel }: {
  item: GearItem
  onSave: (item: GearItem) => void
  onCancel: () => void
}) {
  const [form, setForm] = useState(item)

  function set(field: keyof GearItem, value: string) {
    setForm(p => ({ ...p, [field]: value }))
  }

  return (
    <div className="space-y-4">
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        <div style={{ gridColumn: 'span 2' }}>
          <label style={labelStyle}>Category</label>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {CATEGORIES.map(cat => (
              <button
                key={cat.value}
                onClick={() => set('category', cat.value)}
                style={{
                  padding: '6px 12px',
                  borderRadius: '20px',
                  fontSize: '12px',
                  fontWeight: 500,
                  border: '1px solid var(--color-navy-200)',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  background: form.category === cat.value ? 'var(--color-navy-800)' : 'white',
                  color: form.category === cat.value ? 'white' : 'var(--color-navy-600)',
                }}
              >
                {cat.icon} {cat.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label style={labelStyle}>Make</label>
          <input value={form.make} onChange={e => set('make', e.target.value)} placeholder="e.g. Sony" style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>Model</label>
          <input value={form.model} onChange={e => set('model', e.target.value)} placeholder="e.g. A7 IV" style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>Serial number</label>
          <input value={form.serialNumber} onChange={e => set('serialNumber', e.target.value)} placeholder="Optional" style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>Condition</label>
          <select value={form.condition} onChange={e => set('condition', e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
            {CONDITIONS.map(c => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label style={labelStyle}>Purchase date</label>
          <input type="date" value={form.purchaseDate} onChange={e => set('purchaseDate', e.target.value)} style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>Purchase price</label>
          <div style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-navy-400)', fontSize: '13px' }}>$</span>
            <input type="number" value={form.purchasePrice} onChange={e => set('purchasePrice', e.target.value)} min={0} style={{ ...inputStyle, paddingLeft: '24px' }} />
          </div>
        </div>
        <div>
          <label style={labelStyle}>Insurance value</label>
          <div style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-navy-400)', fontSize: '13px' }}>$</span>
            <input type="number" value={form.insuranceValue} onChange={e => set('insuranceValue', e.target.value)} min={0} style={{ ...inputStyle, paddingLeft: '24px' }} />
          </div>
        </div>
        <div>
          <label style={labelStyle}>Warranty expiration</label>
          <input type="date" value={form.warrantyExpiration} onChange={e => set('warrantyExpiration', e.target.value)} style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>Assigned to</label>
          <input value={form.assignedTo} onChange={e => set('assignedTo', e.target.value)} placeholder="e.g. Second shooter name" style={inputStyle} />
        </div>
        <div style={{ gridColumn: 'span 2' }}>
          <label style={labelStyle}>Notes</label>
          <textarea value={form.notes} onChange={e => set('notes', e.target.value)} rows={2} style={{ ...inputStyle, resize: 'vertical' as const }} placeholder="Any additional notes..." />
        </div>
      </div>

      <div className="flex gap-2">
        <Button size="sm" onClick={() => onSave(form)}>Save</Button>
        <Button size="sm" variant="ghost" onClick={onCancel}>Cancel</Button>
      </div>
    </div>
  )
}

export default function GearPage() {
  const [gear, setGear] = useState<GearItem[]>(SAMPLE_GEAR)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [adding, setAdding] = useState(false)
  const [filterCategory, setFilterCategory] = useState<GearCategory | 'all'>('all')
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  function handleSave(item: GearItem) {
    setGear(prev => {
      const exists = prev.find(g => g.id === item.id)
      return exists ? prev.map(g => g.id === item.id ? item : g) : [...prev, item]
    })
    setEditingId(null)
    setAdding(false)
  }

  function handleDelete(id: string) {
    setGear(prev => prev.filter(g => g.id !== id))
    setConfirmDelete(null)
  }

  const filtered = filterCategory === 'all' ? gear : gear.filter(g => g.category === filterCategory)

  const totalInsuranceValue = gear.reduce((sum, g) => sum + (parseFloat(g.insuranceValue) || 0), 0)
  const totalPurchaseValue = gear.reduce((sum, g) => sum + (parseFloat(g.purchasePrice) || 0), 0)

  function getCategoryIcon(cat: GearCategory) {
    return CATEGORIES.find(c => c.value === cat)?.icon ?? '📦'
  }

  function getCategoryLabel(cat: GearCategory) {
    return CATEGORIES.find(c => c.value === cat)?.label ?? 'Other'
  }

  function getConditionColor(cond: GearCondition) {
    return CONDITIONS.find(c => c.value === cond)?.color ?? 'var(--color-navy-400)'
  }

  function parseLocalDate(dateStr: string) {
    if (!dateStr) return null
    const [year, month, day] = dateStr.split('-').map(Number)
    return new Date(year, month - 1, day)
  }

  function formatDate(dateStr: string) {
    const d = parseLocalDate(dateStr)
    if (!d) return '—'
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  function isWarrantyExpiringSoon(dateStr: string) {
    const d = parseLocalDate(dateStr)
    if (!d) return false
    const diff = d.getTime() - new Date().getTime()
    return diff > 0 && diff < 1000 * 60 * 60 * 24 * 90 // within 90 days
  }

  function isWarrantyExpired(dateStr: string) {
    const d = parseLocalDate(dateStr)
    if (!d) return false
    return d.getTime() < new Date().getTime()
  }

  return (
    <AppShell>
      <div className="px-10 py-10 max-w-4xl">
        <PageHeader
          title="Gear catalog"
          subtitle={`${gear.length} items · $${totalInsuranceValue.toLocaleString()} insured value`}
          action={
            !adding ? (
              <Button size="sm" onClick={() => setAdding(true)}>+ Add gear</Button>
            ) : undefined
          }
        />

        {/* Summary cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '24px' }}>
          <Card className="p-4">
            <p style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-navy-400)', marginBottom: '4px' }}>Total items</p>
            <p style={{ fontSize: '24px', fontWeight: 700, color: 'var(--color-navy-900)' }}>{gear.length}</p>
          </Card>
          <Card className="p-4">
            <p style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-navy-400)', marginBottom: '4px' }}>Purchase value</p>
            <p style={{ fontSize: '24px', fontWeight: 700, color: 'var(--color-navy-900)' }}>${totalPurchaseValue.toLocaleString()}</p>
          </Card>
          <Card className="p-4">
            <p style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-navy-400)', marginBottom: '4px' }}>Insured value</p>
            <p style={{ fontSize: '24px', fontWeight: 700, color: 'var(--color-navy-900)' }}>${totalInsuranceValue.toLocaleString()}</p>
          </Card>
        </div>

        {/* Add form */}
        {adding && (
          <Card className="p-6 mb-6">
            <h3 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-navy-700)', marginBottom: '16px' }}>New gear item</h3>
            <GearForm item={emptyItem()} onSave={handleSave} onCancel={() => setAdding(false)} />
          </Card>
        )}

        {/* Category filter */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
          <button
            onClick={() => setFilterCategory('all')}
            style={{
              padding: '5px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 500,
              border: '1px solid var(--color-navy-200)', cursor: 'pointer', fontFamily: 'inherit',
              background: filterCategory === 'all' ? 'var(--color-navy-800)' : 'white',
              color: filterCategory === 'all' ? 'white' : 'var(--color-navy-600)',
            }}
          >
            All ({gear.length})
          </button>
          {CATEGORIES.filter(cat => gear.some(g => g.category === cat.value)).map(cat => (
            <button
              key={cat.value}
              onClick={() => setFilterCategory(cat.value)}
              style={{
                padding: '5px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 500,
                border: '1px solid var(--color-navy-200)', cursor: 'pointer', fontFamily: 'inherit',
                background: filterCategory === cat.value ? 'var(--color-navy-800)' : 'white',
                color: filterCategory === cat.value ? 'white' : 'var(--color-navy-600)',
              }}
            >
              {cat.icon} {cat.label} ({gear.filter(g => g.category === cat.value).length})
            </button>
          ))}
        </div>

        {/* Gear list */}
        <div className="space-y-3">
          {filtered.length === 0 && (
            <Card className="p-8 text-center">
              <p style={{ fontSize: '13px', color: 'var(--color-navy-400)' }}>No gear in this category yet.</p>
            </Card>
          )}
          {filtered.map(item => (
            <Card key={item.id} className="p-5">
              {editingId === item.id ? (
                <GearForm item={item} onSave={handleSave} onCancel={() => setEditingId(null)} />
              ) : (
                <div>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <span style={{ fontSize: '16px' }}>{getCategoryIcon(item.category)}</span>
                        <p style={{ fontSize: '15px', fontWeight: 600, color: 'var(--color-navy-800)' }}>
                          {item.make} {item.model}
                        </p>
                        <span style={{ fontSize: '11px', fontWeight: 600, color: getConditionColor(item.condition), background: 'var(--color-navy-50)', padding: '2px 8px', borderRadius: '20px' }}>
                          {item.condition}
                        </span>
                        {item.warrantyExpiration && isWarrantyExpired(item.warrantyExpiration) && (
                          <span style={{ fontSize: '11px', color: '#b91c1c', background: '#fef2f2', padding: '2px 8px', borderRadius: '20px' }}>
                            Warranty expired
                          </span>
                        )}
                        {item.warrantyExpiration && isWarrantyExpiringSoon(item.warrantyExpiration) && !isWarrantyExpired(item.warrantyExpiration) && (
                          <span style={{ fontSize: '11px', color: 'var(--color-gold-warm)', background: '#fef3e2', padding: '2px 8px', borderRadius: '20px' }}>
                            Warranty expiring soon
                          </span>
                        )}
                      </div>
                      <p style={{ fontSize: '11px', color: 'var(--color-navy-400)', marginBottom: '8px' }}>
                        {getCategoryLabel(item.category)}
                        {item.serialNumber && ` · S/N: ${item.serialNumber}`}
                        {item.assignedTo && ` · Assigned to: ${item.assignedTo}`}
                      </p>
                      <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                        {item.purchasePrice && (
                          <div>
                            <span style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--color-navy-300)' }}>Purchased</span>
                            <p style={{ fontSize: '13px', color: 'var(--color-navy-700)' }}>${parseFloat(item.purchasePrice).toLocaleString()} · {formatDate(item.purchaseDate)}</p>
                          </div>
                        )}
                        {item.insuranceValue && (
                          <div>
                            <span style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--color-navy-300)' }}>Insured for</span>
                            <p style={{ fontSize: '13px', color: 'var(--color-navy-700)' }}>${parseFloat(item.insuranceValue).toLocaleString()}</p>
                          </div>
                        )}
                        {item.warrantyExpiration && (
                          <div>
                            <span style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--color-navy-300)' }}>Warranty</span>
                            <p style={{ fontSize: '13px', color: isWarrantyExpired(item.warrantyExpiration) ? '#b91c1c' : 'var(--color-navy-700)' }}>{formatDate(item.warrantyExpiration)}</p>
                          </div>
                        )}
                      </div>
                      {item.notes && (
                        <p style={{ fontSize: '12px', color: 'var(--color-navy-400)', marginTop: '8px', fontStyle: 'italic' }}>{item.notes}</p>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                      <Button size="sm" variant="secondary" onClick={() => setEditingId(item.id)}>Edit</Button>
                      <button
                        onClick={() => setConfirmDelete(item.id)}
                        style={{ fontSize: '12px', color: 'var(--color-navy-300)', background: 'none', border: 'none', cursor: 'pointer', padding: '0 4px', fontFamily: 'inherit', transition: 'color 0.15s' }}
                        onMouseEnter={e => (e.currentTarget.style.color = '#ef4444')}
                        onMouseLeave={e => (e.currentTarget.style.color = 'var(--color-navy-300)')}
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </Card>
          ))}
        </div>
      </div>

      {/* Delete confirmation */}
      {confirmDelete && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div style={{ background: 'white', borderRadius: '12px', padding: '24px', maxWidth: '360px', width: '90%', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
            <p className="font-medium text-sm mb-2" style={{ color: 'var(--color-navy-800)' }}>Remove gear item?</p>
            <p className="text-xs mb-6" style={{ color: 'var(--color-navy-400)' }}>This cannot be undone.</p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setConfirmDelete(null)} style={{ fontSize: '13px', padding: '8px 16px', borderRadius: '8px', border: '1px solid var(--color-navy-200)', background: 'white', cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
              <button onClick={() => handleDelete(confirmDelete)} style={{ fontSize: '13px', padding: '8px 16px', borderRadius: '8px', border: 'none', background: '#ef4444', color: 'white', cursor: 'pointer', fontFamily: 'inherit' }}>Remove</button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  )
}