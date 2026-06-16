import { useState, useEffect } from 'react'
import { Card, Button } from '@/components/ui'
import { useBookingDetail, useUpdateBooking } from '@/hooks/useData'
import { api } from '@/lib/api'

interface Props {
  bookingId: string
}

interface AlternateContact {
  name: string
  role: string
  phone: string
}

interface DayOfDetails {
  leadPhotographerName?: string
  leadPhotographerPhone?: string
  secondShooterName?: string
  secondShooterPhone?: string
  coverageStart?: string
  coverageEnd?: string
  guestCount?: string
  weddingParty?: string
  dressCode?: string
  mostImportantPhotos?: string
  brideGettingReadyLocation?: string
  groomGettingReadyLocation?: string
  firstLookLocation?: string
  portraitsLocation?: string
  ceremonyLocation?: string
  cocktailHourLocation?: string
  sunsetPhotosLocation?: string
  ceremonyRestrictions?: string
  coordinatorName?: string
  coordinatorPhone?: string
  alternateContactsPartnerOne?: AlternateContact[]
  alternateContactsPartnerTwo?: AlternateContact[]
  parkingNotes?: string
  receptionNotes?: string
  dayOfNotes?: string
}

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

const sectionLabel: React.CSSProperties = {
  fontSize: '11px',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.08em',
  color: 'var(--color-navy-400)',
  fontWeight: 500,
  marginBottom: '10px',
}

function Field({ label, value, onChange, placeholder, hint }: {
  label: string; value: string; onChange: (v: string) => void
  placeholder?: string; hint?: string
}) {
  return (
    <div>
      <label style={labelStyle}>{label}</label>
      <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} style={inputStyle} />
      {hint && <p style={{ fontSize: '11px', color: 'var(--color-navy-300)', marginTop: '4px' }}>{hint}</p>}
    </div>
  )
}

function TextArea({ label, value, onChange, placeholder, rows = 3 }: {
  label: string; value: string; onChange: (v: string) => void
  placeholder?: string; rows?: number
}) {
  return (
    <div>
      <label style={labelStyle}>{label}</label>
      <textarea
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        style={{ ...inputStyle, resize: 'vertical' as const, lineHeight: '1.5' }}
      />
    </div>
  )
}

function ContactsEditor({ label, contacts, onChange }: {
  label: string
  contacts: AlternateContact[]
  onChange: (c: AlternateContact[]) => void
}) {
  function update(i: number, field: keyof AlternateContact, value: string) {
    const updated = contacts.map((c, idx) => idx === i ? { ...c, [field]: value } : c)
    onChange(updated)
  }
  function add() {
    onChange([...contacts, { name: '', role: '', phone: '' }])
  }
  function remove(i: number) {
    onChange(contacts.filter((_, idx) => idx !== i))
  }

  return (
    <div>
      <p style={sectionLabel}>{label}</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {contacts.map((c, i) => (
          <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: '8px', alignItems: 'center' }}>
            <input
              value={c.name}
              onChange={e => update(i, 'name', e.target.value)}
              placeholder="Name"
              style={{ ...inputStyle, fontSize: '12px', padding: '7px 10px' }}
            />
            <input
              value={c.role}
              onChange={e => update(i, 'role', e.target.value)}
              placeholder="Role (e.g. MOH)"
              style={{ ...inputStyle, fontSize: '12px', padding: '7px 10px' }}
            />
            <input
              value={c.phone}
              onChange={e => update(i, 'phone', e.target.value)}
              placeholder="(555) 000-0000"
              style={{ ...inputStyle, fontSize: '12px', padding: '7px 10px' }}
            />
            <button
              onClick={() => remove(i)}
              style={{ fontSize: '14px', color: 'var(--color-navy-300)', background: 'none', border: 'none', cursor: 'pointer', padding: '0 4px', lineHeight: 1 }}
              onMouseEnter={e => (e.currentTarget.style.color = '#ef4444')}
              onMouseLeave={e => (e.currentTarget.style.color = 'var(--color-navy-300)')}
            >×</button>
          </div>
        ))}
        <button
          onClick={add}
          style={{ fontSize: '12px', color: 'var(--color-steel-500)', background: 'none', border: '1px dashed var(--color-navy-200)', borderRadius: '6px', padding: '6px 12px', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left' }}
        >
          + Add contact
        </button>
      </div>
    </div>
  )
}

export default function DayOfTab({ bookingId }: Props) {
  const { data } = useBookingDetail(bookingId)
  const updateBooking = useUpdateBooking()
  const [saved, setSaved] = useState(false)
  const [form, setForm] = useState<DayOfDetails>({
    leadPhotographerName: '',
    leadPhotographerPhone: '',
    secondShooterName: '',
    secondShooterPhone: '',
    coverageStart: '',
    coverageEnd: '',
    guestCount: '',
    weddingParty: '',
    dressCode: '',
    mostImportantPhotos: '',
    brideGettingReadyLocation: '',
    groomGettingReadyLocation: '',
    firstLookLocation: '',
    portraitsLocation: '',
    ceremonyLocation: '',
    cocktailHourLocation: '',
    sunsetPhotosLocation: '',
    ceremonyRestrictions: '',
    coordinatorName: '',
    coordinatorPhone: '',
    alternateContactsPartnerOne: [],
    alternateContactsPartnerTwo: [],
    parkingNotes: '',
    receptionNotes: '',
    dayOfNotes: '',
  })

  useEffect(() => {
    if (!data) return
    const details = (data as any).dayOfDetails

    api.get('/api/photographer/me').then(r => {
      const p = r.data
      const defaultName = `${p.firstName ?? ''} ${p.lastName ?? ''}`.trim()
      const defaultPhone = p.phone ?? ''
      const saved = details && typeof details === 'object' ? details as any : {}
      setForm(prev => ({
        ...prev,
        ...saved,
        leadPhotographerName: saved.leadPhotographerName || defaultName,
        leadPhotographerPhone: saved.leadPhotographerPhone || defaultPhone,
        alternateContactsPartnerOne: saved.alternateContactsPartnerOne ?? [],
        alternateContactsPartnerTwo: saved.alternateContactsPartnerTwo ?? [],
      }))
    }).catch(() => {
      if (details && typeof details === 'object') {
        const saved = details as any
        setForm(prev => ({
          ...prev,
          ...saved,
          alternateContactsPartnerOne: saved.alternateContactsPartnerOne ?? [],
          alternateContactsPartnerTwo: saved.alternateContactsPartnerTwo ?? [],
        }))
      }
    })
  }, [data])

  function set(field: keyof DayOfDetails, value: any) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  async function handleSave() {
    await updateBooking.mutateAsync({
      id: bookingId,
      dayOfDetails: form,
    } as any)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  if (!data) return null

  return (
    <div className="space-y-6 max-w-2xl">

      {/* Photographers */}
      <Card className="p-6 space-y-4">
        <h3 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-navy-700)' }}>Photographers</h3>
        <p style={{ fontSize: '12px', color: 'var(--color-navy-400)' }}>Defaults to your account info — edit to override for this booking.</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <Field label="Lead photographer name" value={form.leadPhotographerName ?? ''} onChange={v => set('leadPhotographerName', v)} placeholder="Your name" />
          <Field label="Lead photographer phone" value={form.leadPhotographerPhone ?? ''} onChange={v => set('leadPhotographerPhone', v)} placeholder="(555) 000-0000" />
        </div>
        <div style={{ borderTop: '1px solid var(--color-navy-100)', paddingTop: '16px' }}>
          <p style={sectionLabel}>Second shooter</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <Field label="Second shooter name" value={form.secondShooterName ?? ''} onChange={v => set('secondShooterName', v)} placeholder="Full name" />
            <Field label="Second shooter phone" value={form.secondShooterPhone ?? ''} onChange={v => set('secondShooterPhone', v)} placeholder="(555) 000-0000" />
          </div>
        </div>
      </Card>

      {/* Wedding details */}
      <Card className="p-6 space-y-4">
        <h3 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-navy-700)' }}>Wedding details</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <Field label="Coverage start time" value={form.coverageStart ?? ''} onChange={v => set('coverageStart', v)} placeholder="e.g. 1:00pm" />
          <Field label="Coverage end time" value={form.coverageEnd ?? ''} onChange={v => set('coverageEnd', v)} placeholder="e.g. 9:00pm" />
          <Field label="Guest count" value={form.guestCount ?? ''} onChange={v => set('guestCount', v)} placeholder="e.g. 120" />
          <Field label="Dress code" value={form.dressCode ?? ''} onChange={v => set('dressCode', v)} placeholder="e.g. Black tie, Formal" />
        </div>
        <Field label="Wedding party" value={form.weddingParty ?? ''} onChange={v => set('weddingParty', v)} placeholder="e.g. 3 bridesmaids, 3 groomsmen (Sarah, Kate, Jess | Mike, Dan, Chris)" />
        <TextArea label="Most important photos" value={form.mostImportantPhotos ?? ''} onChange={v => set('mostImportantPhotos', v)} placeholder="e.g. Bride and groom portraits, first dance, grandparents..." rows={2} />
      </Card>

      {/* Locations */}
      <Card className="p-6 space-y-4">
        <h3 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-navy-700)' }}>Locations</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <Field label={`${data.partnerOneName} getting ready`} value={form.brideGettingReadyLocation ?? ''} onChange={v => set('brideGettingReadyLocation', v)} placeholder="Hotel, suite, address..." />
          <Field label={`${data.partnerTwoName} getting ready`} value={form.groomGettingReadyLocation ?? ''} onChange={v => set('groomGettingReadyLocation', v)} placeholder="Hotel, suite, address..." />
          <Field label="First look" value={form.firstLookLocation ?? ''} onChange={v => set('firstLookLocation', v)} placeholder="e.g. Vineyard, garden..." />
          <Field label="Portraits" value={form.portraitsLocation ?? ''} onChange={v => set('portraitsLocation', v)} placeholder="e.g. Vineyard, lawn..." />
          <Field label="Ceremony" value={form.ceremonyLocation ?? ''} onChange={v => set('ceremonyLocation', v)} placeholder="e.g. Lawn, chapel..." />
          <Field label="Cocktail hour" value={form.cocktailHourLocation ?? ''} onChange={v => set('cocktailHourLocation', v)} placeholder="e.g. Between lawn and clubhouse..." />
          <Field label="Sunset / golden hour photos" value={form.sunsetPhotosLocation ?? ''} onChange={v => set('sunsetPhotosLocation', v)} placeholder="e.g. Vineyard..." />
          <Field label="Parking & directions" value={form.parkingNotes ?? ''} onChange={v => set('parkingNotes', v)} placeholder="Where to park, entrance to use..." />
        </div>
        <TextArea label="Reception notes" value={form.receptionNotes ?? ''} onChange={v => set('receptionNotes', v)} placeholder="Room layout, special moments to capture..." rows={2} />
      </Card>

      {/* Coordinator */}
      <Card className="p-6 space-y-4">
        <h3 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-navy-700)' }}>Day-of coordinator</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <Field label="Coordinator name" value={form.coordinatorName ?? ''} onChange={v => set('coordinatorName', v)} placeholder="Full name" />
          <Field label="Coordinator phone" value={form.coordinatorPhone ?? ''} onChange={v => set('coordinatorPhone', v)} placeholder="(555) 000-0000" />
        </div>
      </Card>

      {/* Alternate contacts */}
      <Card className="p-6 space-y-6">
        <h3 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-navy-700)' }}>Alternate contacts</h3>
        <p style={{ fontSize: '12px', color: 'var(--color-navy-400)', marginTop: '-8px' }}>People to reach if you can't get the couple on the day.</p>
        <ContactsEditor
          label={`Contacts for ${data.partnerOneName}`}
          contacts={form.alternateContactsPartnerOne ?? []}
          onChange={v => set('alternateContactsPartnerOne', v)}
        />
        <ContactsEditor
          label={`Contacts for ${data.partnerTwoName}`}
          contacts={form.alternateContactsPartnerTwo ?? []}
          onChange={v => set('alternateContactsPartnerTwo', v)}
        />
      </Card>

      {/* Ceremony */}
      <Card className="p-6 space-y-4">
        <h3 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-navy-700)' }}>Ceremony restrictions</h3>
        <TextArea label="Restrictions" value={form.ceremonyRestrictions ?? ''} onChange={v => set('ceremonyRestrictions', v)} placeholder="e.g. Unplugged ceremony, no flash during vows..." rows={2} />
      </Card>

      {/* Day-of notes */}
      <Card className="p-6 space-y-4">
        <h3 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-navy-700)' }}>Day-of notes</h3>
        <TextArea label="Additional notes for the day-of sheet" value={form.dayOfNotes ?? ''} onChange={v => set('dayOfNotes', v)} placeholder="Anything else the team needs to know..." rows={4} />
      </Card>

      <Button onClick={handleSave} disabled={updateBooking.isPending}>
        {updateBooking.isPending ? 'Saving...' : saved ? '✓ Saved' : 'Save day-of details'}
      </Button>
    </div>
  )
}