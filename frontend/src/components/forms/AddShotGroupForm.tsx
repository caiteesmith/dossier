import { useState } from 'react'
import { Button } from '@/components/ui'
import { useAddShotGroup } from '@/hooks/useData'

interface Props {
  bookingId: string
  onClose: () => void
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

const PRESETS = [
  "Bride's family", "Groom's family", "Wedding party",
  "Couple portraits", "Ceremony details", "Reception details",
]

export default function AddShotGroupForm({ bookingId, onClose }: Props) {
  const addGroup = useAddShotGroup()
  const [name, setName] = useState('')
  const [items, setItems] = useState('')
  const [error, setError] = useState('')

  function handleSubmit() {
    if (!name.trim()) { setError('Group name is required'); return }
    const shotItems = items
      .split('\n')
      .map(s => s.trim())
      .filter(Boolean)

    addGroup.mutate({
      bookingId,
      name: name.trim(),
      items: shotItems,
    }, { onSuccess: onClose })
  }

  return (
    <div style={{ background: 'var(--color-navy-50)', borderRadius: '12px', border: '1px solid var(--color-navy-100)', padding: '18px', marginTop: '12px' }}>
      <h4 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-navy-700)', marginBottom: '14px' }}>Add shot group</h4>

      <div style={{ marginBottom: '12px' }}>
        <label style={labelStyle}>Group name <span style={{ color: '#b91c1c' }}>*</span></label>
        <input
          value={name}
          onChange={e => { setName(e.target.value); setError('') }}
          placeholder="e.g. Bride's family"
          style={{ ...inputStyle, borderColor: error ? '#fca5a5' : undefined }}
          autoFocus
        />
        {error && <p style={{ fontSize: '11px', color: '#b91c1c', marginTop: '3px' }}>{error}</p>}

        {/* Presets */}
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '8px' }}>
          {PRESETS.map(preset => (
            <button
              key={preset}
              onClick={() => { setName(preset); setError('') }}
              style={{
                fontSize: '11px', padding: '3px 9px', borderRadius: '20px', cursor: 'pointer',
                fontFamily: 'inherit', border: '1px solid var(--color-navy-200)',
                background: name === preset ? 'var(--color-navy-800)' : 'white',
                color: name === preset ? 'white' : 'var(--color-navy-500)',
              }}
            >
              {preset}
            </button>
          ))}
        </div>
      </div>

      <div style={{ marginBottom: '14px' }}>
        <label style={labelStyle}>Shots (one per line, optional)</label>
        <textarea
          value={items}
          onChange={e => setItems(e.target.value)}
          rows={4}
          placeholder={"Bride + parents\nBride + siblings\nBride + full family"}
          style={{ ...inputStyle, resize: 'vertical' as const }}
        />
        <p style={{ fontSize: '11px', color: 'var(--color-navy-300)', marginTop: '4px' }}>
          You can add shots now or later by editing the group.
        </p>
      </div>

      <div style={{ display: 'flex', gap: '8px' }}>
        <Button size="sm" onClick={handleSubmit} disabled={addGroup.isPending}>
          {addGroup.isPending ? 'Adding...' : 'Add group'}
        </Button>
        <Button size="sm" variant="ghost" onClick={onClose}>Cancel</Button>
      </div>
    </div>
  )
}