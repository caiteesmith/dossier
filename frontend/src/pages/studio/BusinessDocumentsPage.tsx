import { useState, useRef } from 'react'
import AppShell from '@/components/layout/AppShell'
import { Card, Button, PageHeader } from '@/components/ui'

type DocCategory = 'coi' | 'w9' | 'contract_template' | 'tax' | 'license' | 'invoice_template' | 'other'

interface BusinessDocument {
  id: string
  name: string
  category: DocCategory
  fileName: string
  fileSize: number
  uploadedAt: string
  expiresAt: string
  notes: string
  url: string // object URL or external URL
}

const CATEGORIES: { value: DocCategory; label: string; icon: string; description: string }[] = [
  { value: 'coi',               label: 'Certificate of Insurance', icon: '🛡️', description: 'Liability coverage proof' },
  { value: 'w9',                label: 'W-9',                      icon: '📋', description: 'Tax identification form' },
  { value: 'contract_template', label: 'Contract template',        icon: '📄', description: 'Reusable client contracts' },
  { value: 'invoice_template',  label: 'Invoice template',         icon: '🧾', description: 'Invoice templates' },
  { value: 'tax',               label: 'Tax document',             icon: '🏦', description: 'Tax filings and forms' },
  { value: 'license',           label: 'License / permit',         icon: '🪪', description: 'Business licenses' },
  { value: 'other',             label: 'Other',                    icon: '📁', description: 'Miscellaneous documents' },
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

function formatBytes(bytes: number) {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
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

function isExpiringSoon(dateStr: string) {
  const d = parseLocalDate(dateStr)
  if (!d) return false
  const diff = d.getTime() - new Date().getTime()
  return diff > 0 && diff < 1000 * 60 * 60 * 24 * 60
}

function isExpired(dateStr: string) {
  const d = parseLocalDate(dateStr)
  if (!d) return false
  return d.getTime() < new Date().getTime()
}

function getCategoryInfo(cat: DocCategory) {
  return CATEGORIES.find(c => c.value === cat) ?? CATEGORIES[CATEGORIES.length - 1]
}

export default function BusinessDocumentsPage() {
  const [docs, setDocs] = useState<BusinessDocument[]>([])
  const [showAdd, setShowAdd] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const [filterCategory, setFilterCategory] = useState<DocCategory | 'all'>('all')

  const [form, setForm] = useState({
    name: '',
    category: 'coi' as DocCategory,
    expiresAt: '',
    notes: '',
    url: '',
  })
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  function resetForm() {
    setForm({ name: '', category: 'coi', expiresAt: '', notes: '', url: '' })
    setSelectedFile(null)
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setSelectedFile(file)
    if (!form.name) setForm(p => ({ ...p, name: file.name.replace(/\.[^.]+$/, '') }))
  }

  function handleAdd() {
    if (!form.name.trim()) return
    const objectUrl = selectedFile ? URL.createObjectURL(selectedFile) : form.url
    const doc: BusinessDocument = {
      id: `doc-${Date.now()}`,
      name: form.name.trim(),
      category: form.category,
      fileName: selectedFile?.name ?? (form.url ? new URL(form.url).pathname.split('/').pop() ?? 'link' : ''),
      fileSize: selectedFile?.size ?? 0,
      uploadedAt: new Date().toISOString().split('T')[0],
      expiresAt: form.expiresAt,
      notes: form.notes.trim(),
      url: objectUrl,
    }
    setDocs(prev => [...prev, doc])
    resetForm()
    setShowAdd(false)
  }

  function handleEdit(doc: BusinessDocument) {
    setForm({
      name: doc.name,
      category: doc.category,
      expiresAt: doc.expiresAt,
      notes: doc.notes,
      url: doc.url,
    })
    setEditingId(doc.id)
    setShowAdd(false)
  }

  function handleSaveEdit() {
    setDocs(prev => prev.map(d => d.id === editingId ? {
      ...d,
      name: form.name.trim(),
      category: form.category,
      expiresAt: form.expiresAt,
      notes: form.notes.trim(),
    } : d))
    setEditingId(null)
    resetForm()
  }

  function handleDelete(id: string) {
    setDocs(prev => prev.filter(d => d.id !== id))
    setConfirmDelete(null)
  }

  const filtered = filterCategory === 'all' ? docs : docs.filter(d => d.category === filterCategory)
  const expiring = docs.filter(d => d.expiresAt && (isExpiringSoon(d.expiresAt) || isExpired(d.expiresAt)))

  return (
    <AppShell>
      <div className="px-10 py-10 max-w-3xl">
        <PageHeader
          title="Business documents"
          subtitle="Store and manage your business documents in one place"
          action={
            !showAdd && !editingId ? (
              <Button size="sm" onClick={() => setShowAdd(true)}>+ Add document</Button>
            ) : undefined
          }
        />

        {/* Expiring alerts */}
        {expiring.length > 0 && (
          <div style={{ background: '#fef3e2', border: '1px solid var(--color-gold-soft)', borderRadius: '10px', padding: '12px 16px', marginBottom: '24px' }}>
            <p style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-gold-warm)', marginBottom: '6px' }}>
              ⚠ {expiring.length} document{expiring.length > 1 ? 's' : ''} need{expiring.length === 1 ? 's' : ''} attention
            </p>
            {expiring.map(d => (
              <p key={d.id} style={{ fontSize: '12px', color: 'var(--color-navy-600)' }}>
                {d.name} — {isExpired(d.expiresAt) ? 'expired' : 'expiring soon'} ({formatDate(d.expiresAt)})
              </p>
            ))}
          </div>
        )}

        {/* Add / Edit form */}
        {(showAdd || editingId) && (
          <Card className="p-6 mb-6">
            <h3 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-navy-700)', marginBottom: '16px' }}>
              {editingId ? 'Edit document' : 'Add document'}
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div style={{ gridColumn: 'span 2' }}>
                <label style={labelStyle}>Category</label>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {CATEGORIES.map(cat => (
                    <button
                      key={cat.value}
                      onClick={() => setForm(p => ({ ...p, category: cat.value }))}
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
                <label style={labelStyle}>Document name</label>
                <input
                  value={form.name}
                  onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                  placeholder="e.g. Certificate of Insurance 2026"
                  style={inputStyle}
                  autoFocus
                />
              </div>

              {!editingId && (
                <div style={{ gridColumn: 'span 2' }}>
                  <label style={labelStyle}>File</label>
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    style={{
                      border: `2px dashed ${selectedFile ? 'var(--color-steel-400)' : 'var(--color-navy-200)'}`,
                      borderRadius: '8px',
                      padding: '20px',
                      textAlign: 'center',
                      cursor: 'pointer',
                      background: selectedFile ? 'var(--color-navy-50)' : 'transparent',
                      transition: 'all 0.15s',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-navy-50)')}
                    onMouseLeave={e => (e.currentTarget.style.background = selectedFile ? 'var(--color-navy-50)' : 'transparent')}
                  >
                    {selectedFile ? (
                      <div>
                        <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-navy-700)' }}>📎 {selectedFile.name}</p>
                        <p style={{ fontSize: '11px', color: 'var(--color-navy-400)', marginTop: '2px' }}>{formatBytes(selectedFile.size)}</p>
                      </div>
                    ) : (
                      <div>
                        <p style={{ fontSize: '13px', color: 'var(--color-navy-400)' }}>Click to upload a file</p>
                        <p style={{ fontSize: '11px', color: 'var(--color-navy-300)', marginTop: '2px' }}>PDF, DOC, JPG, PNG supported</p>
                      </div>
                    )}
                  </div>
                  <input ref={fileInputRef} type="file" onChange={handleFileChange} style={{ display: 'none' }} accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" />

                  <p style={{ fontSize: '11px', color: 'var(--color-navy-400)', margin: '8px 0 4px' }}>Or paste an external link</p>
                  <input
                    value={form.url}
                    onChange={e => setForm(p => ({ ...p, url: e.target.value }))}
                    placeholder="https://drive.google.com/..."
                    style={inputStyle}
                    disabled={!!selectedFile}
                  />
                </div>
              )}

              <div>
                <label style={labelStyle}>Expiration date (optional)</label>
                <input
                  type="date"
                  value={form.expiresAt}
                  onChange={e => setForm(p => ({ ...p, expiresAt: e.target.value }))}
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>Notes</label>
                <input
                  value={form.notes}
                  onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
                  placeholder="Optional notes"
                  style={inputStyle}
                />
              </div>
            </div>

            <div className="flex gap-2 mt-4">
              <Button
                size="sm"
                onClick={editingId ? handleSaveEdit : handleAdd}
                disabled={!form.name.trim() || (!editingId && !selectedFile && !form.url)}
              >
                {editingId ? 'Save changes' : 'Add document'}
              </Button>
              <Button size="sm" variant="ghost" onClick={() => { setShowAdd(false); setEditingId(null); resetForm() }}>
                Cancel
              </Button>
            </div>
          </Card>
        )}

        {/* Category filter */}
        {docs.length > 0 && (
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
              All ({docs.length})
            </button>
            {CATEGORIES.filter(cat => docs.some(d => d.category === cat.value)).map(cat => (
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
                {cat.icon} {cat.label} ({docs.filter(d => d.category === cat.value).length})
              </button>
            ))}
          </div>
        )}

        {/* Document list */}
        {docs.length === 0 && !showAdd ? (
          <Card className="p-10 text-center">
            <p style={{ fontSize: '32px', marginBottom: '12px' }}>📁</p>
            <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-navy-700)', marginBottom: '4px' }}>No documents yet</p>
            <p style={{ fontSize: '13px', color: 'var(--color-navy-400)', marginBottom: '16px', lineHeight: '1.5' }}>
              Store your COI, W-9, contract templates, and other business documents here.
            </p>
            <Button size="sm" onClick={() => setShowAdd(true)}>+ Add your first document</Button>
          </Card>
        ) : (
          <div className="space-y-3">
            {filtered.map(doc => {
              const cat = getCategoryInfo(doc.category)
              const expired = doc.expiresAt && isExpired(doc.expiresAt)
              const expiringSoon = doc.expiresAt && isExpiringSoon(doc.expiresAt)

              return (
                <Card key={doc.id} className="p-5">
                  {editingId === doc.id ? null : (
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px' }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
                          <span style={{ fontSize: '18px' }}>{cat.icon}</span>
                          <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-navy-800)' }}>{doc.name}</p>
                          <span style={{ fontSize: '11px', background: 'var(--color-navy-100)', color: 'var(--color-navy-500)', padding: '2px 8px', borderRadius: '20px' }}>
                            {cat.label}
                          </span>
                          {expired && (
                            <span style={{ fontSize: '11px', background: '#fde8e8', color: '#b91c1c', padding: '2px 8px', borderRadius: '20px', fontWeight: 600 }}>
                              Expired
                            </span>
                          )}
                          {expiringSoon && !expired && (
                            <span style={{ fontSize: '11px', background: '#fef3e2', color: 'var(--color-gold-warm)', padding: '2px 8px', borderRadius: '20px', fontWeight: 600 }}>
                              Expiring soon
                            </span>
                          )}
                        </div>
                        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginTop: '4px' }}>
                          {doc.fileName && (
                            <span style={{ fontSize: '12px', color: 'var(--color-navy-400)' }}>
                              📎 {doc.fileName}{doc.fileSize > 0 ? ` · ${formatBytes(doc.fileSize)}` : ''}
                            </span>
                          )}
                          <span style={{ fontSize: '12px', color: 'var(--color-navy-400)' }}>
                            Uploaded {formatDate(doc.uploadedAt)}
                          </span>
                          {doc.expiresAt && (
                            <span style={{ fontSize: '12px', color: expired ? '#b91c1c' : expiringSoon ? 'var(--color-gold-warm)' : 'var(--color-navy-400)' }}>
                              Expires {formatDate(doc.expiresAt)}
                            </span>
                          )}
                        </div>
                        {doc.notes && (
                          <p style={{ fontSize: '12px', color: 'var(--color-navy-400)', marginTop: '6px', fontStyle: 'italic' }}>{doc.notes}</p>
                        )}
                      </div>
                      <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                        {doc.url && (
                          <a
                            href={doc.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ fontSize: '12px', padding: '6px 12px', borderRadius: '8px', border: '1px solid var(--color-navy-200)', background: 'white', color: 'var(--color-navy-600)', textDecoration: 'none', fontFamily: 'inherit', cursor: 'pointer', fontWeight: 500 }}
                          >
                            Open ↗
                          </a>
                        )}
                        <Button size="sm" variant="secondary" onClick={() => handleEdit(doc)}>Edit</Button>
                        <button
                          onClick={() => setConfirmDelete(doc.id)}
                          style={{ fontSize: '12px', color: 'var(--color-navy-300)', background: 'none', border: 'none', cursor: 'pointer', padding: '0 4px', transition: 'color 0.15s' }}
                          onMouseEnter={e => (e.currentTarget.style.color = '#ef4444')}
                          onMouseLeave={e => (e.currentTarget.style.color = 'var(--color-navy-300)')}
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  )}
                </Card>
              )
            })}
          </div>
        )}

        <p style={{ fontSize: '11px', color: 'var(--color-navy-300)', marginTop: '16px' }}>
          Files are stored locally in your browser session. Persistent cloud storage coming when the backend is wired up.
        </p>
      </div>

      {/* Delete confirmation */}
      {confirmDelete && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div style={{ background: 'white', borderRadius: '12px', padding: '24px', maxWidth: '360px', width: '90%', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
            <p className="font-medium text-sm mb-2" style={{ color: 'var(--color-navy-800)' }}>Remove document?</p>
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