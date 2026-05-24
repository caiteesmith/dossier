import { useState } from 'react'
import { Button } from '@/components/ui'
import { useAddVendor } from '@/hooks/useData'

interface Props {
  bookingId: string
  onClose: () => void
}

const ROLES = [
  'Planner', 'Coordinator', 'DJ', 'Band', 'Florist', 'Caterer',
  'Officiant', 'Hair', 'Makeup', 'Videographer', 'Baker/Cake',
  'Transportation', 'Venue coordinator', 'Photo booth', 'Other',
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

export default function AddVendorForm({ bookingId, onClose }: Props) {
  const addVendor = useAddVendor()
  const [form, setForm] = useState({ role: '', customRole: '', name: '', phone: '', email: '', notes: '' })
  const [errors, setErrors] = useState<Record<string, string>>({})

  function set(field: string, value: string) {
    setForm(p => ({ ...p, [field]: value }))
    if (errors[field]) setErrors(p => ({ ...p, [field]: '' }))
  }

  function handleSubmit() {
    const e: Record<string, string> = {}
    const role = form.role === 'Other' ? form.customRole.trim() : form.role
    if (!role)            e.role = 'Required'
    if (!form.name.trim()) e.name = 'Required'
    if (Object.keys(e).length) { setErrors(e); return }

    addVendor.mutate({
      bookingId,
      role,
      name:  form.name.trim(),
      phone: form.phone.trim() || undefined,
      email: form.email.trim() || undefined,
      notes: form.notes.trim() || undefined,
    }, { onSuccess: onClose })
  }

  return (
    <div style={{ background: 'var(--color-navy-50)', borderRadius: '12px', border: '1px solid var(--color-navy-100)', padding: '18px', marginTop: '12px' }}>
      <h4 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-navy-700)', marginBottom: '14px' }}>Add vendor</h4>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        <div>
          <label style={labelStyle}>Role <span style={{ color: '#b91c1c' }}>*</span></label>
          <select value={form.role} onChange={e => set('role', e.target.value)} style={{ ...inputStyle, cursor: 'pointer', borderColor: errors.role ? '#fca5a5' : undefined }}>
            <option value="">Select role</option>
            {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
          {errors.role && <p style={{ fontSize: '11px', color: '#b91c1c', marginTop: '3px' }}>{errors.role}</p>}
        </div>

        {form.role === 'Other' ? (
          <div>
            <label style={labelStyle}>Custom role</label>
            <input value={form.customRole} onChange={e => set('customRole', e.target.value)} placeholder="e.g. Lighting designer" style={inputStyle} autoFocus />
          </div>
        ) : <div />}

        <div style={{ gridColumn: 'span 2' }}>
          <label style={labelStyle}>Name <span style={{ color: '#b91c1c' }}>*</span></label>
          <input value={form.name} onChange={e => set('name', e.target.value)} placeholder="Full name or company" style={{ ...inputStyle, borderColor: errors.name ? '#fca5a5' : undefined }} autoFocus={form.role !== 'Other'} />
          {errors.name && <p style={{ fontSize: '11px', color: '#b91c1c', marginTop: '3px' }}>{errors.name}</p>}
        </div>

        <div>
          <label style={labelStyle}>Phone</label>
          <input type="tel" value={form.phone} onChange={e => set('phone', e.target.value)} style={inputStyle} />
        </div>

        <div>
          <label style={labelStyle}>Email</label>
          <input type="email" value={form.email} onChange={e => set('email', e.target.value)} style={inputStyle} />
        </div>

        <div style={{ gridColumn: 'span 2' }}>
          <label style={labelStyle}>Notes</label>
          <input value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="e.g. Contact day-of only" style={inputStyle} />
        </div>
      </div>

      <div style={{ display: 'flex', gap: '8px', marginTop: '14px' }}>
        <Button size="sm" onClick={handleSubmit} disabled={addVendor.isPending}>
          {addVendor.isPending ? 'Adding...' : 'Add vendor'}
        </Button>
        <Button size="sm" variant="ghost" onClick={onClose}>Cancel</Button>
      </div>
    </div>
  )
}