import { useState, useRef } from 'react'
import AppShell from '@/components/layout/AppShell'
import { Card, Button, PageHeader } from '@/components/ui'

type ExpenseCategory =
  | 'equipment'
  | 'gas'
  | 'travel'
  | 'education'
  | 'software'
  | 'marketing'
  | 'meals'
  | 'studio_rental'
  | 'insurance'
  | 'other'

interface Expense {
  id: string
  date: string
  description: string
  category: ExpenseCategory
  amount: number
  reimbursable: boolean
  reimbursed: boolean
  receiptName: string
  receiptUrl: string
  notes: string
}

const CATEGORIES: { value: ExpenseCategory; label: string; icon: string }[] = [
  { value: 'equipment',     label: 'Equipment',      icon: '📷' },
  { value: 'gas',           label: 'Gas',            icon: '⛽' },
  { value: 'travel',        label: 'Travel',         icon: '✈️' },
  { value: 'education',     label: 'Education',      icon: '📚' },
  { value: 'software',      label: 'Software',       icon: '💻' },
  { value: 'marketing',     label: 'Marketing',      icon: '📣' },
  { value: 'meals',         label: 'Meals',          icon: '🍽️' },
  { value: 'studio_rental', label: 'Studio rental',  icon: '🏠' },
  { value: 'insurance',     label: 'Insurance',      icon: '🛡️' },
  { value: 'other',         label: 'Other',          icon: '📦' },
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

function getCategoryInfo(cat: ExpenseCategory) {
  return CATEGORIES.find(c => c.value === cat) ?? CATEGORIES[CATEGORIES.length - 1]
}

function emptyExpense(): Expense {
  return {
    id: `exp-${Date.now()}`,
    date: new Date().toISOString().split('T')[0],
    description: '',
    category: 'equipment',
    amount: 0,
    reimbursable: false,
    reimbursed: false,
    receiptName: '',
    receiptUrl: '',
    notes: '',
  }
}

type SortField = 'date' | 'amount' | 'category'
type FilterYear = 'all' | string

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [showAdd, setShowAdd] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const [filterCategory, setFilterCategory] = useState<ExpenseCategory | 'all'>('all')
  const [filterYear, setFilterYear] = useState<FilterYear>(String(new Date().getFullYear()))
  const [sortField, setSortField] = useState<SortField>('date')
  const [form, setForm] = useState<Expense>(emptyExpense())
  const fileInputRef = useRef<HTMLInputElement>(null)

  function setFormField<K extends keyof Expense>(field: K, value: Expense[K]) {
    setForm(p => ({ ...p, [field]: value }))
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setFormField('receiptName', file.name)
    setFormField('receiptUrl', URL.createObjectURL(file))
  }

  function handleSave() {
    if (!form.description.trim() || form.amount <= 0) return
    if (editingId) {
      setExpenses(prev => prev.map(e => e.id === editingId ? { ...form, id: editingId } : e))
      setEditingId(null)
    } else {
      setExpenses(prev => [...prev, { ...form, id: `exp-${Date.now()}` }])
      setShowAdd(false)
    }
    setForm(emptyExpense())
  }

  function handleEdit(exp: Expense) {
    setForm(exp)
    setEditingId(exp.id)
    setShowAdd(false)
  }

  function handleDelete(id: string) {
    setExpenses(prev => prev.filter(e => e.id !== id))
    setConfirmDelete(null)
  }

  function handleCancel() {
    setShowAdd(false)
    setEditingId(null)
    setForm(emptyExpense())
  }

  const years = Array.from(new Set(expenses.map(e => e.date.split('-')[0]))).sort().reverse()

  const filtered = expenses
    .filter(e => filterCategory === 'all' || e.category === filterCategory)
    .filter(e => filterYear === 'all' || e.date.startsWith(filterYear))
    .sort((a, b) => {
      if (sortField === 'date') return b.date.localeCompare(a.date)
      if (sortField === 'amount') return b.amount - a.amount
      return a.category.localeCompare(b.category)
    })

  const totalFiltered = filtered.reduce((sum, e) => sum + e.amount, 0)
  const totalReimbursable = filtered.filter(e => e.reimbursable && !e.reimbursed).reduce((sum, e) => sum + e.amount, 0)

  const byCategory = CATEGORIES.map(cat => ({
    ...cat,
    total: filtered.filter(e => e.category === cat.value).reduce((sum, e) => sum + e.amount, 0),
    count: filtered.filter(e => e.category === cat.value).length,
  })).filter(c => c.count > 0).sort((a, b) => b.total - a.total)

  return (
    <AppShell>
      <div className="px-10 py-10 max-w-4xl">
        <PageHeader
          title="Expense tracking"
          subtitle="Track business expenses for tax deductions"
          action={
            !showAdd && !editingId ? (
              <Button size="sm" onClick={() => setShowAdd(true)}>+ Add expense</Button>
            ) : undefined
          }
        />

        {/* Summary */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '24px' }}>
          <Card className="p-4">
            <p style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-navy-400)', marginBottom: '4px' }}>
              Total {filterYear !== 'all' ? filterYear : ''} expenses
            </p>
            <p style={{ fontSize: '24px', fontWeight: 700, color: 'var(--color-navy-900)' }}>${totalFiltered.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
          </Card>
          <Card className="p-4">
            <p style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-navy-400)', marginBottom: '4px' }}>Reimbursable outstanding</p>
            <p style={{ fontSize: '24px', fontWeight: 700, color: totalReimbursable > 0 ? '#b91c1c' : 'var(--color-navy-900)' }}>${totalReimbursable.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
          </Card>
          <Card className="p-4">
            <p style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-navy-400)', marginBottom: '4px' }}>Transactions</p>
            <p style={{ fontSize: '24px', fontWeight: 700, color: 'var(--color-navy-900)' }}>{filtered.length}</p>
          </Card>
        </div>

        {/* Category breakdown */}
        {byCategory.length > 0 && (
          <Card className="p-5 mb-6">
            <p style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-navy-400)', marginBottom: '12px', fontWeight: 600 }}>By category</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {byCategory.map(cat => (
                <div key={cat.value} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '14px', width: '20px' }}>{cat.icon}</span>
                  <span style={{ fontSize: '12px', color: 'var(--color-navy-600)', width: '130px', flexShrink: 0 }}>{cat.label}</span>
                  <div style={{ flex: 1, height: '6px', background: 'var(--color-navy-100)', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', background: 'var(--color-navy-700)', borderRadius: '3px', width: `${(cat.total / totalFiltered) * 100}%`, transition: 'width 0.3s' }} />
                  </div>
                  <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-navy-700)', width: '80px', textAlign: 'right', flexShrink: 0 }}>
                    ${cat.total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                  <span style={{ fontSize: '11px', color: 'var(--color-navy-400)', width: '24px', textAlign: 'right', flexShrink: 0 }}>{cat.count}</span>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Add / Edit form */}
        {(showAdd || editingId) && (
          <Card className="p-6 mb-6">
            <h3 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-navy-700)', marginBottom: '16px' }}>
              {editingId ? 'Edit expense' : 'New expense'}
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div style={{ gridColumn: 'span 2' }}>
                <label style={labelStyle}>Category</label>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {CATEGORIES.map(cat => (
                    <button
                      key={cat.value}
                      onClick={() => setFormField('category', cat.value)}
                      style={{
                        padding: '6px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 500,
                        border: '1px solid var(--color-navy-200)', cursor: 'pointer', fontFamily: 'inherit',
                        background: form.category === cat.value ? 'var(--color-navy-800)' : 'white',
                        color: form.category === cat.value ? 'white' : 'var(--color-navy-600)',
                      }}
                    >
                      {cat.icon} {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ gridColumn: 'span 2' }}>
                <label style={labelStyle}>Description</label>
                <input value={form.description} onChange={e => setFormField('description', e.target.value)} placeholder="e.g. Adobe Creative Cloud subscription" style={inputStyle} autoFocus />
              </div>

              <div>
                <label style={labelStyle}>Date</label>
                <input type="date" value={form.date} onChange={e => setFormField('date', e.target.value)} style={inputStyle} />
              </div>

              <div>
                <label style={labelStyle}>Amount</label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-navy-400)', fontSize: '13px' }}>$</span>
                  <input
                    type="number"
                    value={form.amount || ''}
                    onChange={e => setFormField('amount', parseFloat(e.target.value) || 0)}
                    min={0}
                    step={0.01}
                    placeholder="0.00"
                    style={{ ...inputStyle, paddingLeft: '24px' }}
                  />
                </div>
              </div>

              <div>
                <label style={labelStyle}>Receipt</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    style={{ ...inputStyle, cursor: 'pointer', textAlign: 'left', color: form.receiptName ? 'var(--color-navy-700)' : 'var(--color-navy-400)', width: 'auto', flex: 1 }}
                  >
                    {form.receiptName ? `📎 ${form.receiptName}` : 'Upload receipt...'}
                  </button>
                  {form.receiptName && (
                    <button onClick={() => { setFormField('receiptName', ''); setFormField('receiptUrl', '') }} style={{ fontSize: '12px', color: 'var(--color-navy-400)', background: 'none', border: 'none', cursor: 'pointer', padding: '0 4px' }}>✕</button>
                  )}
                </div>
                <input ref={fileInputRef} type="file" onChange={handleFileChange} style={{ display: 'none' }} accept=".pdf,.jpg,.jpeg,.png" />
              </div>

              <div>
                <label style={labelStyle}>Notes</label>
                <input value={form.notes} onChange={e => setFormField('notes', e.target.value)} placeholder="Optional" style={inputStyle} />
              </div>

              <div style={{ gridColumn: 'span 2', display: 'flex', gap: '20px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', color: 'var(--color-navy-600)' }}>
                  <input type="checkbox" checked={form.reimbursable} onChange={e => setFormField('reimbursable', e.target.checked)} />
                  Reimbursable by client
                </label>
                {form.reimbursable && (
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', color: 'var(--color-navy-600)' }}>
                    <input type="checkbox" checked={form.reimbursed} onChange={e => setFormField('reimbursed', e.target.checked)} />
                    Already reimbursed
                  </label>
                )}
              </div>
            </div>

            <div className="flex gap-2 mt-4">
              <Button size="sm" onClick={handleSave} disabled={!form.description.trim() || form.amount <= 0}>
                {editingId ? 'Save changes' : 'Add expense'}
              </Button>
              <Button size="sm" variant="ghost" onClick={handleCancel}>Cancel</Button>
            </div>
          </Card>
        )}

        {/* Filters */}
        {expenses.length > 0 && (
          <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              <button onClick={() => setFilterCategory('all')} style={{ padding: '5px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 500, border: '1px solid var(--color-navy-200)', cursor: 'pointer', fontFamily: 'inherit', background: filterCategory === 'all' ? 'var(--color-navy-800)' : 'white', color: filterCategory === 'all' ? 'white' : 'var(--color-navy-600)' }}>
                All
              </button>
              {CATEGORIES.filter(cat => expenses.some(e => e.category === cat.value)).map(cat => (
                <button key={cat.value} onClick={() => setFilterCategory(cat.value)} style={{ padding: '5px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 500, border: '1px solid var(--color-navy-200)', cursor: 'pointer', fontFamily: 'inherit', background: filterCategory === cat.value ? 'var(--color-navy-800)' : 'white', color: filterCategory === cat.value ? 'white' : 'var(--color-navy-600)' }}>
                  {cat.icon} {cat.label}
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', gap: '6px', marginLeft: 'auto' }}>
              {['all', ...years].map(y => (
                <button key={y} onClick={() => setFilterYear(y)} style={{ padding: '5px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 500, border: '1px solid var(--color-navy-200)', cursor: 'pointer', fontFamily: 'inherit', background: filterYear === y ? 'var(--color-steel-600)' : 'white', color: filterYear === y ? 'white' : 'var(--color-navy-600)' }}>
                  {y === 'all' ? 'All years' : y}
                </button>
              ))}
              <select value={sortField} onChange={e => setSortField(e.target.value as SortField)} style={{ padding: '5px 12px', borderRadius: '20px', fontSize: '12px', border: '1px solid var(--color-navy-200)', cursor: 'pointer', fontFamily: 'inherit', background: 'white', color: 'var(--color-navy-600)' }}>
                <option value="date">Sort: Date</option>
                <option value="amount">Sort: Amount</option>
                <option value="category">Sort: Category</option>
              </select>
            </div>
          </div>
        )}

        {/* Expense list */}
        {expenses.length === 0 && !showAdd ? (
          <Card className="p-10 text-center">
            <p style={{ fontSize: '32px', marginBottom: '12px' }}>💸</p>
            <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-navy-700)', marginBottom: '4px' }}>No expenses yet</p>
            <p style={{ fontSize: '13px', color: 'var(--color-navy-400)', marginBottom: '16px' }}>Track business expenses for tax deductions.</p>
            <Button size="sm" onClick={() => setShowAdd(true)}>+ Add your first expense</Button>
          </Card>
        ) : (
          <Card>
            <div>
              {filtered.length === 0 ? (
                <div className="px-6 py-8 text-center">
                  <p style={{ fontSize: '13px', color: 'var(--color-navy-400)' }}>No expenses match the current filters.</p>
                </div>
              ) : (
                filtered.map((exp, i) => {
                  const cat = getCategoryInfo(exp.category)
                  return (
                    <div
                      key={exp.id}
                      style={{ borderTop: i === 0 ? 'none' : '1px solid var(--color-navy-100)', padding: '14px 18px', display: 'flex', alignItems: 'center', gap: '12px' }}
                    >
                      <span style={{ fontSize: '20px', flexShrink: 0 }}>{cat.icon}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                          <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-navy-800)' }}>{exp.description}</p>
                          {exp.reimbursable && !exp.reimbursed && (
                            <span style={{ fontSize: '10px', background: '#fef3e2', color: 'var(--color-gold-warm)', padding: '2px 7px', borderRadius: '20px', fontWeight: 600 }}>Reimbursable</span>
                          )}
                          {exp.reimbursable && exp.reimbursed && (
                            <span style={{ fontSize: '10px', background: '#e6f4ec', color: '#276840', padding: '2px 7px', borderRadius: '20px', fontWeight: 600 }}>Reimbursed</span>
                          )}
                        </div>
                        <p style={{ fontSize: '11px', color: 'var(--color-navy-400)', marginTop: '2px' }}>
                          {formatDate(exp.date)} · {cat.label}
                          {exp.receiptName && ` · 📎 ${exp.receiptName}`}
                          {exp.notes && ` · ${exp.notes}`}
                        </p>
                      </div>
                      <p style={{ fontSize: '15px', fontWeight: 700, color: 'var(--color-navy-900)', flexShrink: 0 }}>
                        ${exp.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                      <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                        {exp.receiptUrl && (
                          <a href={exp.receiptUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: '11px', padding: '4px 10px', borderRadius: '6px', border: '1px solid var(--color-navy-200)', background: 'white', color: 'var(--color-navy-600)', textDecoration: 'none' }}>
                            Receipt
                          </a>
                        )}
                        <button onClick={() => handleEdit(exp)} style={{ fontSize: '11px', padding: '4px 10px', borderRadius: '6px', border: '1px solid var(--color-navy-200)', background: 'white', color: 'var(--color-navy-600)', cursor: 'pointer', fontFamily: 'inherit' }}>Edit</button>
                        <button
                          onClick={() => setConfirmDelete(exp.id)}
                          style={{ fontSize: '12px', color: 'var(--color-navy-300)', background: 'none', border: 'none', cursor: 'pointer', padding: '0 4px', transition: 'color 0.15s' }}
                          onMouseEnter={e => (e.currentTarget.style.color = '#ef4444')}
                          onMouseLeave={e => (e.currentTarget.style.color = 'var(--color-navy-300)')}
                        >✕</button>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
            {filtered.length > 0 && (
              <div style={{ borderTop: '1px solid var(--color-navy-100)', padding: '12px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '12px', color: 'var(--color-navy-400)' }}>{filtered.length} expenses</span>
                <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-navy-900)' }}>
                  Total: ${totalFiltered.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            )}
          </Card>
        )}

        <p style={{ fontSize: '11px', color: 'var(--color-navy-300)', marginTop: '16px' }}>
          Expenses are stored locally. Persistent storage and CSV export coming when the backend is wired up.
        </p>
      </div>

      {confirmDelete && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div style={{ background: 'white', borderRadius: '12px', padding: '24px', maxWidth: '360px', width: '90%', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
            <p className="font-medium text-sm mb-2" style={{ color: 'var(--color-navy-800)' }}>Delete expense?</p>
            <p className="text-xs mb-6" style={{ color: 'var(--color-navy-400)' }}>This cannot be undone.</p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setConfirmDelete(null)} style={{ fontSize: '13px', padding: '8px 16px', borderRadius: '8px', border: '1px solid var(--color-navy-200)', background: 'white', cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
              <button onClick={() => handleDelete(confirmDelete)} style={{ fontSize: '13px', padding: '8px 16px', borderRadius: '8px', border: 'none', background: '#ef4444', color: 'white', cursor: 'pointer', fontFamily: 'inherit' }}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  )
}