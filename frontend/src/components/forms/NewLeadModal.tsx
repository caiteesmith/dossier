import { useState } from 'react'
import { Button } from '@/components/ui'
import { useAddLead } from '@/hooks/useData'
import type { LeadSource } from '@/types'

interface Props {
  onClose: () => void
}

const SOURCES: { value: LeadSource; label: string }[] = [
  { value: 'website',          label: 'Website' },
  { value: 'instagram',        label: 'Instagram' },
  { value: 'referral_client',  label: 'Client referral' },
  { value: 'referral_vendor',  label: 'Vendor referral' },
  { value: 'google',           label: 'Google' },
  { value: 'wedding_wire',     label: 'WeddingWire' },
  { value: 'the_knot',         label: 'The Knot' },
  { value: 'other',            label: 'Other' },
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
  transition: 'border-color 0.15s',
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

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label style={labelStyle}>
        {label}{required && <span style={{ color: '#b91c1c', marginLeft: '3px' }}>*</span>}
      </label>
      {children}
    </div>
  )
}

export default function NewLeadModal({ onClose }: Props) {
  const addLead = useAddLead()
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    partnerName: '',
    email: '',
    phone: '',
    weddingDate: '',
    venueName: '',
    venueLocation: '',
    source: '' as LeadSource | '',
    referralName: '',
    budget: '',
    notes: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  function set(field: string, value: string) {
    setForm(p => ({ ...p, [field]: value }))
    if (errors[field]) setErrors(p => ({ ...p, [field]: '' }))
  }

  function validate() {
    const e: Record<string, string> = {}
    if (!form.firstName.trim()) e.firstName = 'Required'
    if (!form.lastName.trim())  e.lastName  = 'Required'
    if (!form.email.trim())     e.email     = 'Required'
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Invalid email'
    return e
  }

  function handleSubmit() {
    const e = validate()
    if (Object.keys(e).length) { setErrors(e); return }

    addLead.mutate({
      firstName:     form.firstName.trim(),
      lastName:      form.lastName.trim(),
      partnerName:   form.partnerName.trim() || undefined,
      email:         form.email.trim(),
      phone:         form.phone.trim() || undefined,
      weddingDate:   form.weddingDate || undefined,
      venueName:     form.venueName.trim() || undefined,
      venueLocation: form.venueLocation.trim() || undefined,
      source:        (form.source as LeadSource) || undefined,
      referralName:  form.referralName.trim() || undefined,
      budget:        form.budget ? parseFloat(form.budget) : undefined,
      notes:         form.notes.trim() || undefined,
    }, { onSuccess: onClose })
  }

  const showReferral = form.source === 'referral_client' || form.source === 'referral_vendor'

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{ position: 'fixed', inset: 0, background: 'rgba(13,21,37,0.5)', zIndex: 40, backdropFilter: 'blur(2px)' }}
      />

      {/* Modal */}
      <div style={{
        position: 'fixed', inset: 0, zIndex: 50,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '24px',
      }}>
        <div style={{
          background: 'white', borderRadius: '16px', width: '100%', maxWidth: '560px',
          maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column',
          boxShadow: '0 24px 64px rgba(13,21,37,0.25)',
        }}>
          {/* Header */}
          <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid var(--color-navy-100)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--color-navy-900)' }}>New lead</h2>
              <p style={{ fontSize: '12px', color: 'var(--color-navy-400)', marginTop: '2px' }}>Add a new inquiry to your pipeline</p>
            </div>
            <button onClick={onClose} style={{ fontSize: '18px', color: 'var(--color-navy-400)', background: 'none', border: 'none', cursor: 'pointer', lineHeight: 1, padding: '4px' }}>×</button>
          </div>

          {/* Body */}
          <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>

              <Field label="First name" required>
                <input value={form.firstName} onChange={e => set('firstName', e.target.value)} style={{ ...inputStyle, borderColor: errors.firstName ? '#fca5a5' : undefined }} autoFocus />
                {errors.firstName && <p style={{ fontSize: '11px', color: '#b91c1c', marginTop: '3px' }}>{errors.firstName}</p>}
              </Field>

              <Field label="Last name" required>
                <input value={form.lastName} onChange={e => set('lastName', e.target.value)} style={{ ...inputStyle, borderColor: errors.lastName ? '#fca5a5' : undefined }} />
                {errors.lastName && <p style={{ fontSize: '11px', color: '#b91c1c', marginTop: '3px' }}>{errors.lastName}</p>}
              </Field>

              <div style={{ gridColumn: 'span 2' }}>
                <Field label="Partner's name">
                  <input value={form.partnerName} onChange={e => set('partnerName', e.target.value)} placeholder="e.g. Alex" style={inputStyle} />
                </Field>
              </div>

              <div style={{ gridColumn: 'span 2' }}>
                <Field label="Email" required>
                  <input type="email" value={form.email} onChange={e => set('email', e.target.value)} style={{ ...inputStyle, borderColor: errors.email ? '#fca5a5' : undefined }} />
                  {errors.email && <p style={{ fontSize: '11px', color: '#b91c1c', marginTop: '3px' }}>{errors.email}</p>}
                </Field>
              </div>

              <Field label="Phone">
                <input type="tel" value={form.phone} onChange={e => set('phone', e.target.value)} style={inputStyle} />
              </Field>

              <Field label="Wedding date">
                <input type="date" value={form.weddingDate} onChange={e => set('weddingDate', e.target.value)} style={inputStyle} />
              </Field>

              <div style={{ gridColumn: 'span 2' }}>
                <Field label="Venue name">
                  <input value={form.venueName} onChange={e => set('venueName', e.target.value)} placeholder="e.g. The Barn at Gibbet Hill" style={inputStyle} />
                </Field>
              </div>

              <Field label="Venue location">
                <input value={form.venueLocation} onChange={e => set('venueLocation', e.target.value)} placeholder="City, State" style={inputStyle} />
              </Field>

              <Field label="Budget">
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-navy-400)', fontSize: '13px' }}>$</span>
                  <input type="number" value={form.budget} onChange={e => set('budget', e.target.value)} min={0} step={100} style={{ ...inputStyle, paddingLeft: '24px' }} />
                </div>
              </Field>

              <Field label="How they found you">
                <select value={form.source} onChange={e => set('source', e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
                  <option value="">Select source</option>
                  {SOURCES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              </Field>

              {showReferral && (
                <Field label="Referred by">
                  <input value={form.referralName} onChange={e => set('referralName', e.target.value)} placeholder="Name of referrer" style={inputStyle} />
                </Field>
              )}

              {!showReferral && <div />}

              <div style={{ gridColumn: 'span 2' }}>
                <Field label="Notes">
                  <textarea value={form.notes} onChange={e => set('notes', e.target.value)} rows={3} placeholder="Anything notable from their inquiry..." style={{ ...inputStyle, resize: 'vertical' as const }} />
                </Field>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div style={{ padding: '16px 24px', borderTop: '1px solid var(--color-navy-100)', display: 'flex', gap: '8px', justifyContent: 'flex-end', background: 'var(--color-fog)' }}>
            <Button variant="ghost" onClick={onClose}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={addLead.isPending}>
              {addLead.isPending ? 'Adding...' : 'Add lead'}
            </Button>
          </div>
        </div>
      </div>
    </>
  )
}