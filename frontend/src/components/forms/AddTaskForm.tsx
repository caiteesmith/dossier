import { useState } from 'react'
import { Button } from '@/components/ui'
import { useAddTask } from '@/hooks/useData'
import type { TaskCategory } from '@/types'

interface Props {
  bookingId: string
  onClose: () => void
}

const CATEGORIES: { value: TaskCategory; label: string }[] = [
  { value: 'admin',        label: 'Studio admin' },
  { value: 'client',       label: 'Client action' },
  { value: 'day_of',       label: 'Day of' },
  { value: 'post_wedding', label: 'Post-wedding' },
  { value: 'manual',       label: 'Other' },
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

export default function AddTaskForm({ bookingId, onClose }: Props) {
  const addTask = useAddTask()
  const [form, setForm] = useState({ title: '', category: 'admin' as TaskCategory, dueDate: '' })
  const [error, setError] = useState('')

  function handleSubmit() {
    if (!form.title.trim()) { setError('Task title is required'); return }
    addTask.mutate({
      bookingId,
      title:    form.title.trim(),
      category: form.category,
      dueDate:  form.dueDate || undefined,
    }, { onSuccess: onClose })
  }

  return (
    <div style={{ background: 'var(--color-navy-50)', borderRadius: '12px', border: '1px solid var(--color-navy-100)', padding: '16px', marginTop: '8px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '10px', alignItems: 'end' }}>
        <div>
          <label style={labelStyle}>Task <span style={{ color: '#b91c1c' }}>*</span></label>
          <input
            value={form.title}
            onChange={e => { setForm(p => ({ ...p, title: e.target.value })); setError('') }}
            placeholder="e.g. Send second shooter contract"
            style={{ ...inputStyle, borderColor: error ? '#fca5a5' : undefined }}
            autoFocus
            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
          />
          {error && <p style={{ fontSize: '11px', color: '#b91c1c', marginTop: '3px' }}>{error}</p>}
        </div>

        <div>
          <label style={labelStyle}>Category</label>
          <select value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value as TaskCategory }))} style={{ ...inputStyle, cursor: 'pointer' }}>
            {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
        </div>

        <div>
          <label style={labelStyle}>Due date</label>
          <input type="date" value={form.dueDate} onChange={e => setForm(p => ({ ...p, dueDate: e.target.value }))} style={inputStyle} />
        </div>
      </div>

      <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
        <Button size="sm" onClick={handleSubmit} disabled={addTask.isPending}>
          {addTask.isPending ? 'Adding...' : 'Add task'}
        </Button>
        <Button size="sm" variant="ghost" onClick={onClose}>Cancel</Button>
      </div>
    </div>
  )
}