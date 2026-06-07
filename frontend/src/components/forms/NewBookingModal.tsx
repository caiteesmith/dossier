import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui'
import { useAddBooking } from '@/hooks/useData'
import { SAMPLE_PACKAGES } from '@/data/sample'
import type { Lead } from '@/types'

interface Props {
  onClose: () => void
  prefill?: Partial<Lead>
  leadId?: string
}

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

function Field({ label, required, span2, children }: {
  label: string; required?: boolean; span2?: boolean; children: React.ReactNode
}) {
  return (
    <div style={span2 ? { gridColumn: 'span 2' } : {}}>
      <label style={lS}>
        {label}{required && <span style={{ color: '#b91c1c', marginLeft: '3px' }}>*</span>}
      </label>
      {children}
    </div>
  )
}

type Section = 'couple' | 'wedding' | 'venue' | 'package' | 'notes'

const SECTIONS: { id: Section; label: string }[] = [
  { id: 'couple',  label: 'Couple' },
  { id: 'wedding', label: 'Wedding day' },
  { id: 'venue',   label: 'Venue' },
  { id: 'package', label: 'Package' },
  { id: 'notes',   label: 'Notes' },
]

export default function NewBookingModal({ onClose, prefill, leadId }: Props) {
  const addBooking = useAddBooking()
  const navigate = useNavigate()
  const [section, setSection] = useState<Section>('couple')
  const [errors, setErrors] = useState<Record<string, string>>({})

  const activePackage = SAMPLE_PACKAGES.find(p => p.isActive)

  const [form, setForm] = useState({
    partnerOneName:      prefill ? `${prefill.firstName ?? ''} ${prefill.lastName ?? ''}`.trim() : '',
    partnerTwoName:      prefill?.partnerName ?? '',
    partnerOneLegalName: '',
    partnerTwoLegalName: '',
    marriedSurname:      '',
    email:               prefill?.email ?? '',
    phone:               prefill?.phone ?? '',
    mailingAddress:      '',
    mailingCity:         '',
    mailingState:        '',
    mailingZip:          '',
    weddingDate:    prefill?.weddingDate ?? '',
    ceremonyTime:   '',
    cocktailTime:   '',
    receptionTime:  '',
    venueName:      prefill?.venueName ?? '',
    venueAddress:   prefill?.venueLocation ?? '',
    venueLat:       '',
    venueLng:       '',
    packageName:    activePackage?.name ?? '',
    packagePrice:   activePackage?.price ? String(activePackage.price) : '',
    hoursCovered:   activePackage?.hoursCovered ? String(activePackage.hoursCovered) : '',
    secondShooter:       '',
    secondShooterEmail:  '',
    secondShooterPhone:  '',
    notes:          prefill?.notes ?? '',
    internalNotes:  '',
  })

  function set(field: keyof typeof form, value: string) {
    setForm(p => ({ ...p, [field]: value }))
    if (errors[field]) setErrors(p => ({ ...p, [field]: '' }))
  }

  function validateSection(s: Section): Record<string, string> {
    const e: Record<string, string> = {}
    if (s === 'couple') {
      if (!form.partnerOneName.trim()) e.partnerOneName = 'Required'
      if (!form.partnerTwoName.trim()) e.partnerTwoName = 'Required'
      if (!form.email.trim()) e.email = 'Required'
      else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Invalid email'
    }
    if (s === 'wedding') {
      if (!form.weddingDate) e.weddingDate = 'Required'
    }
    if (s === 'venue') {
      if (!form.venueName.trim()) e.venueName = 'Required'
    }
    if (s === 'package') {
      if (!form.packageName.trim()) e.packageName = 'Required'
    }
    return e
  }

  function goTo(s: Section) {
    const e = validateSection(section)
    if (Object.keys(e).length) { setErrors(e); return }
    setSection(s)
  }

  function nextSection() {
    const idx = SECTIONS.findIndex(s => s.id === section)
    if (idx < SECTIONS.length - 1) goTo(SECTIONS[idx + 1].id)
  }

  function prevSection() {
    const idx = SECTIONS.findIndex(s => s.id === section)
    if (idx > 0) setSection(SECTIONS[idx - 1].id)
  }

  function handleSubmit() {
    const allErrors: Record<string, string> = {}
    SECTIONS.forEach(s => Object.assign(allErrors, validateSection(s.id)))
    if (Object.keys(allErrors).length) { setErrors(allErrors); return }

    addBooking.mutate({
      leadId,
      partnerOneName: form.partnerOneName.trim(),
      partnerTwoName: form.partnerTwoName.trim(),
      email:               form.email.trim(),
      phone:               form.phone.trim() || undefined,
      partnerOneLegalName: form.partnerOneLegalName.trim() || undefined,
      partnerTwoLegalName: form.partnerTwoLegalName.trim() || undefined,
      marriedSurname:      form.marriedSurname.trim() || undefined,
      mailingAddress:      form.mailingAddress.trim() || undefined,
      mailingCity:         form.mailingCity.trim() || undefined,
      mailingState:        form.mailingState.trim() || undefined,
      mailingZip:          form.mailingZip.trim() || undefined,
      weddingDate:    form.weddingDate,
      venueName:      form.venueName.trim(),
      venueAddress:   form.venueAddress.trim() || undefined,
      venueLat:       form.venueLat ? parseFloat(form.venueLat) : undefined,
      venueLng:       form.venueLng ? parseFloat(form.venueLng) : undefined,
      packageName:    form.packageName.trim(),
      packagePrice:   form.packagePrice ? parseFloat(form.packagePrice) : undefined,
      hoursCovered:   form.hoursCovered ? parseFloat(form.hoursCovered) : undefined,
      notes:          form.notes.trim() || undefined,
    }, {
      onSuccess: (newBooking) => {
        onClose()
        navigate(`/bookings/${newBooking.id}`)
      }
    })
  }

  const sectionIdx = SECTIONS.findIndex(s => s.id === section)
  const isLast = sectionIdx === SECTIONS.length - 1
  const isFirst = sectionIdx === 0

  const errField = (field: string) => errors[field]
    ? <p style={{ fontSize: '11px', color: '#b91c1c', marginTop: '3px' }}>{errors[field]}</p>
    : null

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(13,21,37,0.5)', zIndex: 40, backdropFilter: 'blur(2px)' }} />
      <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
        <div style={{ background: 'white', borderRadius: '16px', width: '100%', maxWidth: '600px', maxHeight: '92vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 24px 64px rgba(13,21,37,0.25)' }}>

          {/* Header */}
          <div style={{ padding: '20px 24px 0', borderBottom: '1px solid var(--color-navy-100)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
              <div>
                <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--color-navy-900)' }}>
                  {prefill ? 'Convert to booking' : 'New booking'}
                </h2>
                {prefill && (
                  <p style={{ fontSize: '12px', color: 'var(--color-navy-400)', marginTop: '2px' }}>
                    Pre-filled from lead — review and complete
                  </p>
                )}
              </div>
              <button onClick={onClose} style={{ fontSize: '18px', color: 'var(--color-navy-400)', background: 'none', border: 'none', cursor: 'pointer', lineHeight: 1, padding: '4px' }}>×</button>
            </div>

            <div style={{ display: 'flex', gap: '4px', marginBottom: '-1px' }}>
              {SECTIONS.map((s, i) => {
                const sectionErrors = Object.keys(validateSection(s.id)).length > 0 && Object.keys(errors).some(k => validateSection(s.id)[k])
                return (
                  <button key={s.id} onClick={() => goTo(s.id)}
                    style={{
                      padding: '8px 14px', fontSize: '12px', fontWeight: 500,
                      background: 'transparent', border: 'none',
                      borderBottom: `2px solid ${section === s.id ? 'var(--color-navy-800)' : 'transparent'}`,
                      color: section === s.id ? 'var(--color-navy-900)' : sectionErrors ? '#b91c1c' : i < sectionIdx ? 'var(--color-steel-500)' : 'var(--color-navy-400)',
                      cursor: 'pointer', fontFamily: 'inherit', marginBottom: '-1px', whiteSpace: 'nowrap',
                    }}>
                    {i < sectionIdx && !sectionErrors ? '✓ ' : ''}{s.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Body */}
          <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1 }}>
            {section === 'couple' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <p style={{ gridColumn: 'span 2', fontSize: '11px', textTransform: 'uppercase' as const, letterSpacing: '0.08em', color: 'var(--color-navy-400)', fontWeight: 600, margin: 0 }}>Names</p>
                <Field label="Partner 1 full name" required>
                  <input value={form.partnerOneName} onChange={e => set('partnerOneName', e.target.value)} style={{ ...iS, borderColor: errors.partnerOneName ? '#fca5a5' : undefined }} autoFocus placeholder="e.g. Lauren Mitchell" />
                  {errField('partnerOneName')}
                </Field>
                <Field label="Partner 2 full name" required>
                  <input value={form.partnerTwoName} onChange={e => set('partnerTwoName', e.target.value)} style={{ ...iS, borderColor: errors.partnerTwoName ? '#fca5a5' : undefined }} placeholder="e.g. Chris Mitchell" />
                  {errField('partnerTwoName')}
                </Field>
                <Field label="Partner 1 legal name">
                  <input value={form.partnerOneLegalName} onChange={e => set('partnerOneLegalName', e.target.value)} placeholder="As it appears on ID" style={iS} />
                </Field>
                <Field label="Partner 2 legal name">
                  <input value={form.partnerTwoLegalName} onChange={e => set('partnerTwoLegalName', e.target.value)} placeholder="As it appears on ID" style={iS} />
                </Field>
                <Field label="Married surname" span2>
                  <input value={form.marriedSurname} onChange={e => set('marriedSurname', e.target.value)} placeholder="e.g. Mitchell, Mitchell-Chen" style={iS} />
                </Field>
                <div style={{ gridColumn: 'span 2', borderTop: '1px solid var(--color-navy-100)', paddingTop: '14px' }}>
                  <p style={{ fontSize: '11px', textTransform: 'uppercase' as const, letterSpacing: '0.08em', color: 'var(--color-navy-400)', fontWeight: 600, marginBottom: '12px' }}>Contact</p>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div style={{ gridColumn: 'span 2' }}>
                      <label style={lS}>Email <span style={{ color: '#b91c1c' }}>*</span></label>
                      <input type="email" value={form.email} onChange={e => set('email', e.target.value)} style={{ ...iS, borderColor: errors.email ? '#fca5a5' : undefined }} />
                      {errField('email')}
                    </div>
                    <div>
                      <label style={lS}>Phone</label>
                      <input type="tel" value={form.phone} onChange={e => set('phone', e.target.value)} style={iS} />
                    </div>
                  </div>
                </div>
                <div style={{ gridColumn: 'span 2', borderTop: '1px solid var(--color-navy-100)', paddingTop: '14px' }}>
                  <p style={{ fontSize: '11px', textTransform: 'uppercase' as const, letterSpacing: '0.08em', color: 'var(--color-navy-400)', fontWeight: 600, marginBottom: '12px' }}>Mailing address</p>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div style={{ gridColumn: 'span 2' }}>
                      <label style={lS}>Street address</label>
                      <input value={form.mailingAddress} onChange={e => set('mailingAddress', e.target.value)} placeholder="123 Main St, Apt 4B" style={iS} />
                    </div>
                    <div>
                      <label style={lS}>City</label>
                      <input value={form.mailingCity} onChange={e => set('mailingCity', e.target.value)} style={iS} />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                      <div><label style={lS}>State</label><input value={form.mailingState} onChange={e => set('mailingState', e.target.value)} placeholder="NY" style={iS} /></div>
                      <div><label style={lS}>ZIP</label><input value={form.mailingZip} onChange={e => set('mailingZip', e.target.value)} placeholder="12345" style={iS} /></div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {section === 'wedding' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <Field label="Wedding date" required span2>
                  <input type="date" value={form.weddingDate} onChange={e => set('weddingDate', e.target.value)} style={{ ...iS, borderColor: errors.weddingDate ? '#fca5a5' : undefined }} />
                  {errField('weddingDate')}
                </Field>
                <Field label="Ceremony start"><input type="time" value={form.ceremonyTime} onChange={e => set('ceremonyTime', e.target.value)} style={iS} /></Field>
                <Field label="Cocktail hour start"><input type="time" value={form.cocktailTime} onChange={e => set('cocktailTime', e.target.value)} style={iS} /></Field>
                <Field label="Reception start"><input type="time" value={form.receptionTime} onChange={e => set('receptionTime', e.target.value)} style={iS} /></Field>
              </div>
            )}

            {section === 'venue' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <Field label="Venue name" required span2>
                  <input value={form.venueName} onChange={e => set('venueName', e.target.value)} style={{ ...iS, borderColor: errors.venueName ? '#fca5a5' : undefined }} placeholder="e.g. Whiteface Lodge" autoFocus />
                  {errField('venueName')}
                </Field>
                <Field label="Venue address" span2>
                  <input value={form.venueAddress} onChange={e => set('venueAddress', e.target.value)} placeholder="123 Main St, City, State" style={iS} />
                </Field>
                <Field label="Latitude"><input value={form.venueLat} onChange={e => set('venueLat', e.target.value)} placeholder="e.g. 44.3793" style={iS} /></Field>
                <Field label="Longitude"><input value={form.venueLng} onChange={e => set('venueLng', e.target.value)} placeholder="e.g. -73.9799" style={iS} /></Field>
                <p style={{ gridColumn: 'span 2', fontSize: '11px', color: 'var(--color-navy-300)', lineHeight: '1.5' }}>
                  Latitude and longitude enable live weather forecasts and accurate sunset/golden hour times.
                </p>
              </div>
            )}

            {section === 'package' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div style={{ gridColumn: 'span 2', display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '4px' }}>
                  {SAMPLE_PACKAGES.filter(p => p.isActive).map(pkg => (
                    <button key={pkg.id} onClick={() => { set('packageName', pkg.name); set('packagePrice', String(pkg.price)); set('hoursCovered', String(pkg.hoursCovered ?? '')) }}
                      style={{ padding: '6px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: 500, border: '1px solid var(--color-navy-200)', cursor: 'pointer', fontFamily: 'inherit', background: form.packageName === pkg.name ? 'var(--color-navy-800)' : 'white', color: form.packageName === pkg.name ? 'white' : 'var(--color-navy-600)' }}>
                      {pkg.name} — ${pkg.price.toLocaleString()}
                    </button>
                  ))}
                </div>
                <Field label="Package name" required span2>
                  <input value={form.packageName} onChange={e => set('packageName', e.target.value)} style={{ ...iS, borderColor: errors.packageName ? '#fca5a5' : undefined }} placeholder="e.g. Signature" />
                  {errField('packageName')}
                </Field>
                <Field label="Package price">
                  <div style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-navy-400)', fontSize: '13px' }}>$</span>
                    <input type="number" value={form.packagePrice} onChange={e => set('packagePrice', e.target.value)} min={0} step={100} style={{ ...iS, paddingLeft: '24px' }} />
                  </div>
                </Field>
                <Field label="Hours covered"><input type="number" value={form.hoursCovered} onChange={e => set('hoursCovered', e.target.value)} min={1} step={0.5} style={iS} /></Field>
                <div style={{ gridColumn: 'span 2', borderTop: '1px solid var(--color-navy-100)', paddingTop: '14px', marginTop: '4px' }}>
                  <p style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-navy-400)', fontWeight: 600, marginBottom: '12px' }}>Second shooter (optional)</p>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <Field label="Name" span2><input value={form.secondShooter} onChange={e => set('secondShooter', e.target.value)} placeholder="Full name" style={iS} /></Field>
                    <Field label="Email"><input type="email" value={form.secondShooterEmail} onChange={e => set('secondShooterEmail', e.target.value)} style={iS} /></Field>
                    <Field label="Phone"><input type="tel" value={form.secondShooterPhone} onChange={e => set('secondShooterPhone', e.target.value)} style={iS} /></Field>
                  </div>
                </div>
              </div>
            )}

            {section === 'notes' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '14px' }}>
                <Field label="Notes for the couple (visible in their portal)">
                  <textarea value={form.notes} onChange={e => set('notes', e.target.value)} rows={4} placeholder="Anything to communicate to the couple..." style={{ ...iS, resize: 'vertical' as const }} />
                </Field>
                <Field label="Internal notes (not visible to couple)">
                  <textarea value={form.internalNotes} onChange={e => set('internalNotes', e.target.value)} rows={4} placeholder="Notes for yourself..." style={{ ...iS, resize: 'vertical' as const }} />
                </Field>
              </div>
            )}
          </div>

          {/* Footer */}
          <div style={{ padding: '14px 24px', borderTop: '1px solid var(--color-navy-100)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--color-fog)' }}>
            <button onClick={prevSection} disabled={isFirst} style={{ fontSize: '13px', color: isFirst ? 'var(--color-navy-200)' : 'var(--color-navy-500)', background: 'none', border: 'none', cursor: isFirst ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>← Back</button>
            <span style={{ fontSize: '12px', color: 'var(--color-navy-400)' }}>{sectionIdx + 1} of {SECTIONS.length}</span>
            {isLast ? (
              <Button onClick={handleSubmit} disabled={addBooking.isPending}>
                {addBooking.isPending ? 'Creating...' : 'Create booking'}
              </Button>
            ) : (
              <Button onClick={nextSection}>Next →</Button>
            )}
          </div>
        </div>
      </div>
    </>
  )
}