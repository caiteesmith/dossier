import { useState } from 'react'
import { Button } from '@/components/ui'
import { useAddVendor, useUpdateVendor, useDeleteVendor } from '@/hooks/useData'
import type { Vendor } from '@/types'

interface Props {
  bookingId: string
  vendors: Vendor[]
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

interface VendorFormProps {
  initial?: Vendor
  bookingId: string
  onClose: () => void
}

function VendorForm({ initial, bookingId, onClose }: VendorFormProps) {
  const isEdit = !!initial
  const addVendor    = useAddVendor()
  const updateVendor = useUpdateVendor()

  const knownRole = initial?.role && ROLES.includes(initial.role) ? initial.role : initial?.role ? 'Other' : ''
  const [form, setForm] = useState({
    role:       knownRole,
    customRole: knownRole === 'Other' ? (initial?.role ?? '') : '',
    name:       initial?.name  ?? '',
    phone:      initial?.phone ?? '',
    email:      initial?.email ?? '',
    notes:      initial?.notes ?? '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  function set(field: string, value: string) {
    setForm(p => ({ ...p, [field]: value }))
    if (errors[field]) setErrors(p => ({ ...p, [field]: '' }))
  }

  function handleSubmit() {
    const e: Record<string, string> = {}
    const role = form.role === 'Other' ? form.customRole.trim() : form.role
    if (!role)             e.role = 'Required'
    if (!form.name.trim()) e.name = 'Required'
    if (Object.keys(e).length) { setErrors(e); return }

    const payload = {
      role,
      name:  form.name.trim(),
      phone: form.phone.trim() || undefined,
      email: form.email.trim() || undefined,
      notes: form.notes.trim() || undefined,
    }

    if (isEdit) {
      updateVendor.mutate({ bookingId, vendorId: initial!.id, ...payload }, { onSuccess: onClose })
    } else {
      addVendor.mutate({ bookingId, ...payload }, { onSuccess: onClose })
    }
  }

  const isPending = addVendor.isPending || updateVendor.isPending

  return (
    <div style={{ background: 'var(--color-navy-50)', borderRadius: '12px', border: '1px solid var(--color-navy-100)', padding: '18px' }}>
      <h4 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-navy-700)', marginBottom: '14px' }}>
        {isEdit ? 'Edit vendor' : 'Add vendor'}
      </h4>
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
          <input value={form.name} onChange={e => set('name', e.target.value)} placeholder="Full name or company" style={{ ...inputStyle, borderColor: errors.name ? '#fca5a5' : undefined }} />
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
        <Button size="sm" onClick={handleSubmit} disabled={isPending}>
          {isPending ? 'Saving…' : isEdit ? 'Save changes' : 'Add vendor'}
        </Button>
        <Button size="sm" variant="ghost" onClick={onClose}>Cancel</Button>
      </div>
    </div>
  )
}

export default function VendorsTab({ bookingId, vendors }: Props) {
  const [showAdd, setShowAdd]     = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const deleteVendor = useDeleteVendor()

  async function handleDelete(vendorId: string, name: string) {
    if (!confirm(`Remove ${name}?`)) return
    setDeletingId(vendorId)
    await deleteVendor.mutateAsync({ bookingId, vendorId })
    setDeletingId(null)
  }

  return (
    <div className="space-y-2">
      <div style={{ borderRadius: '12px', border: '1px solid var(--color-navy-100)', overflow: 'hidden', background: 'white' }}>
        {vendors.length === 0 && (
          <div className="px-6 py-8 text-center">
            <p className="text-sm italic" style={{ color: 'var(--color-navy-400)' }}>No vendors added yet</p>
          </div>
        )}
        {vendors.map((vendor, i) => (
          <div key={vendor.id}>
            {editingId === vendor.id ? (
              <div style={{ padding: '12px', borderTop: i === 0 ? 'none' : '1px solid var(--color-navy-100)' }}>
                <VendorForm
                  initial={vendor}
                  bookingId={bookingId}
                  onClose={() => setEditingId(null)}
                />
              </div>
            ) : (
              <div
                className="flex items-center justify-between px-6 py-4 group transition-opacity"
                style={{
                  borderTop: i === 0 ? 'none' : '1px solid var(--color-navy-100)',
                  opacity: deletingId === vendor.id ? 0.4 : 1,
                }}
              >
                <div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs uppercase tracking-widest w-28 shrink-0" style={{ color: 'var(--color-navy-400)' }}>{vendor.role}</span>
                    <span className="text-sm font-medium" style={{ color: 'var(--color-navy-800)' }}>{vendor.name}</span>
                  </div>
                  {vendor.notes && (
                    <p className="text-xs italic mt-1" style={{ color: 'var(--color-navy-400)', marginLeft: '124px' }}>{vendor.notes}</p>
                  )}
                </div>
                <div className="flex items-center gap-4">
                  {vendor.phone && (
                    <a href={'tel:' + vendor.phone} className="text-sm hover:opacity-70" style={{ color: 'var(--color-steel-500)' }}>📞 {vendor.phone}</a>
                  )}
                  {vendor.email && (
                    <a href={'mailto:' + vendor.email} className="text-xs hover:opacity-70" style={{ color: 'var(--color-steel-500)' }}>{vendor.email}</a>
                  )}
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => setEditingId(vendor.id)}
                      className="text-xs hover:opacity-70 transition-opacity"
                      style={{ color: 'var(--color-navy-400)' }}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(vendor.id, vendor.name)}
                      className="text-xs hover:opacity-70 transition-opacity"
                      style={{ color: '#b91c1c' }}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {showAdd ? (
        <VendorForm bookingId={bookingId} onClose={() => setShowAdd(false)} />
      ) : (
        <button
          onClick={() => setShowAdd(true)}
          style={{ marginTop: '8px', fontSize: '13px', color: 'var(--color-navy-400)', background: 'none', border: '1px dashed var(--color-navy-200)', borderRadius: '8px', padding: '8px 16px', cursor: 'pointer', fontFamily: 'inherit', width: '100%' }}
        >
          + Add vendor
        </button>
      )}
    </div>
  )
}