import { useState, useRef, useCallback } from 'react'
import AppShell from '@/components/layout/AppShell'
import { PageHeader, Card, Button } from '@/components/ui'
import { useBookings, useBookingDetail } from '@/hooks/useData'
import type { BookingDetail } from '@/types'

type ContractStatus = 'not_sent' | 'sent' | 'signed'

function formatDate(d: string) {
  return new Date(d + 'T12:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
}

function finalDueDate(weddingDate: string): string {
  const d = new Date(weddingDate + 'T12:00:00')
  d.setDate(d.getDate() - 30)
  return formatDate(d.toISOString().split('T')[0])
}

function money(n: number) { return '$' + n.toLocaleString() }

// ── Variables ─────────────────────────────────────────────────────

const VARIABLES = [
  { label: 'Client Name',          token: 'PARTNER_ONE' },
  { label: 'Second Signer Name',   token: 'PARTNER_TWO' },
  { label: 'Client Legal Name',    token: 'PARTNER_ONE_LEGAL' },
  { label: 'Client Address',       token: 'MAILING_ADDRESS' },
  { label: 'Client Email',         token: 'EMAIL' },
  { label: 'Client Phone',         token: 'PHONE' },
  { label: 'Current Date',         token: 'TODAY' },
  { label: 'Session Date',         token: 'DATE' },
  { label: 'Session Location',     token: 'VENUE' },
  { label: 'Session Duration',     token: 'HOURS' },
  { label: 'Session Amount',       token: 'PRICE' },
  { label: 'Session Partial Amount', token: 'RETAINER' },
  { label: 'Final Balance',        token: 'FINAL_BALANCE' },
  { label: 'Final Payment Due',    token: 'FINAL_DUE' },
  { label: 'Package Name',         token: 'PACKAGE' },
  { label: 'Your Business Name',   token: 'BUSINESS' },
  { label: 'Your Name',            token: 'PHOTOGRAPHER' },
  { label: 'Your Business Address', token: 'BUSINESS_ADDRESS' },
  { label: 'Your Business Phone',  token: 'BUSINESS_PHONE' },
  { label: 'Married Surname',      token: 'MARRIED_SURNAME' },
]

// ── Default contract template ─────────────────────────────────────

const DEFAULT_TEMPLATE = `<h1>WEDDING PHOTOGRAPHY CONTRACT</h1>

<p>This Agreement is entered into as of <span class="var-token" data-token="TODAY">Current Date</span>, by and between <span class="var-token" data-token="BUSINESS">Your Business Name</span> ("Photographer") and <span class="var-token" data-token="PARTNER_ONE">Client Name</span> and <span class="var-token" data-token="PARTNER_TWO">Second Signer Name</span> ("Client").</p>

<h2>Event Details</h2>

<p>Wedding date: <span class="var-token" data-token="DATE">Session Date</span><br>
Venue: <span class="var-token" data-token="VENUE">Session Location</span><br>
Package: <span class="var-token" data-token="PACKAGE">Package Name</span><br>
Coverage: <span class="var-token" data-token="HOURS">Session Duration</span> hours<br>
Total investment: <span class="var-token" data-token="PRICE">Session Amount</span></p>

<h2>Payment Schedule</h2>

<p>A non-refundable retainer of <span class="var-token" data-token="RETAINER">Session Partial Amount</span> is due upon signing this agreement to reserve the date. The remaining balance of <span class="var-token" data-token="FINAL_BALANCE">Final Balance</span> is due no later than 30 days prior to the wedding date (<span class="var-token" data-token="FINAL_DUE">Final Payment Due</span>).</p>

<h2>Cancellation Policy</h2>

<p>In the event Client cancels the booking, the retainer is non-refundable regardless of the reason. If cancellation occurs within 90 days of the wedding date, Client is responsible for 50% of the remaining balance. If cancellation occurs within 30 days, Client is responsible for the full remaining balance.</p>

<h2>Copyright and Usage</h2>

<p>Photographer retains full copyright over all images. Client is granted a personal, non-commercial license to use, print, and share the delivered images with credit given to Photographer.</p>

<h2>Image Delivery</h2>

<p>Photographer will deliver a gallery of fully edited images within 6–8 weeks of the wedding date. The gallery will remain available for download for 90 days.</p>

<h2>Entire Agreement</h2>

<p>This agreement constitutes the entire agreement between the parties and supersedes all prior discussions. Any modifications must be in writing and signed by both parties.</p>`

// ── Fill variables for preview/print ─────────────────────────────

function fillVars(html: string, vars: Record<string, string>): string {
  return html.replace(/<span class="var-token" data-token="([^"]+)">[^<]*<\/span>/g, (_, token) => {
    return vars[token] ?? `{{${token}}}`
  })
}

// ── Toolbar button ────────────────────────────────────────────────

function ToolBtn({ label, onClick, active }: { label: string; onClick: () => void; active?: boolean }) {
  return (
    <button
      onMouseDown={e => { e.preventDefault(); onClick() }}
      title={label}
      style={{
        padding: '4px 8px', borderRadius: '4px', border: 'none', cursor: 'pointer',
        background: active ? '#e8eaed' : 'transparent', fontFamily: 'inherit',
        fontSize: '13px', color: '#333', lineHeight: 1, minWidth: '28px',
      }}
      onMouseEnter={e => { if (!active) e.currentTarget.style.background = '#f0f0f0' }}
      onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent' }}
    >
      {label}
    </button>
  )
}

// ── Variable dropdown ─────────────────────────────────────────────

function VariableDropdown({ onInsert }: { onInsert: (variable: typeof VARIABLES[0]) => void }) {
  const [open, setOpen] = useState(false)
  return (
    <div style={{ position: 'relative' }}>
      <button
        onMouseDown={e => { e.preventDefault(); setOpen(o => !o) }}
        style={{
          padding: '4px 10px', borderRadius: '4px', border: '1px solid #ddd',
          cursor: 'pointer', background: 'white', fontFamily: 'inherit',
          fontSize: '13px', color: '#333', display: 'flex', alignItems: 'center', gap: '5px',
        }}
      >
        Variables <span style={{ fontSize: '10px', opacity: 0.6 }}>▾</span>
      </button>
      {open && (
        <>
          <div onClick={() => setOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 9 }} />
          <div style={{
            position: 'absolute', top: '100%', right: 0, zIndex: 10, marginTop: '4px',
            background: 'white', border: '1px solid #e0e0e0', borderRadius: '8px',
            boxShadow: '0 4px 24px rgba(0,0,0,0.12)', minWidth: '220px', overflow: 'hidden',
          }}>
            {VARIABLES.map(v => (
              <button
                key={v.token}
                onMouseDown={e => { e.preventDefault(); onInsert(v); setOpen(false) }}
                style={{
                  display: 'block', width: '100%', padding: '9px 16px', border: 'none',
                  background: 'transparent', cursor: 'pointer', fontFamily: 'inherit',
                  fontSize: '13px', color: '#333', textAlign: 'left',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = '#f5f5f5')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                {v.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

// ── Contract editor modal ─────────────────────────────────────────

function ContractModal({ bookingId, onClose }: { bookingId: string; onClose: () => void }) {
  const { data, isLoading } = useBookingDetail(bookingId)
  const editorRef = useRef<HTMLDivElement>(null)
  const [mode, setMode] = useState<'edit' | 'sign'>('edit')
  const [signatureRequired, setSignatureRequired] = useState(true)
  const [expiryEnabled, setExpiryEnabled] = useState(false)
  const [remindersEnabled, setRemindersEnabled] = useState(true)
  const [signerOneName, setSignerOneName] = useState('')
  const [signerTwoName, setSignerTwoName] = useState('')
  const [signed, setSigned] = useState(false)

  const exec = useCallback((cmd: string, value?: string) => {
    document.execCommand(cmd, false, value)
    editorRef.current?.focus()
  }, [])

  const insertField = useCallback((variable: typeof VARIABLES[0]) => {
    editorRef.current?.focus()
    const span = document.createElement('span')
    span.className = 'var-token'
    span.setAttribute('data-token', variable.token)
    span.setAttribute('contenteditable', 'false')
    span.textContent = variable.label
    span.style.cssText = 'color: #1a73e8; text-decoration: underline; cursor: default; user-select: none;'
    document.execCommand('insertHTML', false, span.outerHTML)
  }, [])

  if (isLoading) return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 40 }} />
      <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ background: 'white', borderRadius: '12px', padding: '32px', color: '#666' }}>Loading...</div>
      </div>
    </>
  )

  if (!data) return null
  const d: BookingDetail = data

  const retainer = d.packagePrice ? Math.round(d.packagePrice * 0.25) : 0
  const finalBalance = d.packagePrice ? d.packagePrice - retainer : 0

  const vars: Record<string, string> = {
    TODAY:              formatDate(new Date().toISOString().split('T')[0]),
    PARTNER_ONE:        d.partnerOneName,
    PARTNER_TWO:        d.partnerTwoName,
    PARTNER_ONE_LEGAL:  (d as any).partnerOneLegalName ?? d.partnerOneName,
    MARRIED_SURNAME:    (d as any).marriedSurname ?? '',
    EMAIL:              d.email,
    PHONE:              d.phone ?? '',
    MAILING_ADDRESS:    [(d as any).mailingAddress, (d as any).mailingCity, (d as any).mailingState, (d as any).mailingZip].filter(Boolean).join(', ') || '',
    DATE:               formatDate(d.weddingDate),
    VENUE:              d.venueName,
    VENUE_ADDRESS:      d.venueAddress ?? '',
    PACKAGE:            d.packageName ?? 'Photography package',
    HOURS:              String(d.hoursCovered ?? 8),
    PRICE:              d.packagePrice ? money(d.packagePrice) : 'TBD',
    RETAINER:           retainer ? money(retainer) : 'TBD',
    FINAL_BALANCE:      finalBalance ? money(finalBalance) : 'TBD',
    FINAL_DUE:          finalDueDate(d.weddingDate),
    PHOTOGRAPHER:       'Caitee Smith',
    BUSINESS:           'Caitee Smith Photography',
    BUSINESS_ADDRESS:   '123 Main St, Wayne, NJ 07470',
    BUSINESS_PHONE:     '(972) 555-0000',
  }

  function getFilledHTML(): string {
    const html = editorRef.current?.innerHTML ?? DEFAULT_TEMPLATE
    return fillVars(html, vars)
  }

  function printContract() {
    const win = window.open('', '_blank')
    if (!win) return
    const filledHtml = getFilledHTML()
    win.document.write(`
      <html><head><title>Contract — ${d.partnerOneName} & ${d.partnerTwoName}</title>
      <style>
        body { font-family: Georgia, serif; font-size: 12pt; line-height: 1.7; max-width: 720px; margin: 40px auto; color: #111; }
        h1 { font-size: 14pt; text-align: center; letter-spacing: 0.06em; margin-bottom: 32px; }
        h2 { font-size: 12pt; margin-top: 28px; margin-bottom: 8px; }
        p { margin: 0 0 14px; }
        .sig-section { margin-top: 48px; page-break-inside: avoid; }
        .sig-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-top: 24px; }
        .sig-line { border-bottom: 1px solid #333; height: 40px; font-family: Georgia; font-size: 18pt; font-style: italic; color: #111; padding-top: 4px; }
        .sig-label { font-size: 10pt; color: #555; margin-top: 6px; }
        @media print { body { margin: 0; } }
      </style></head>
      <body>
        ${filledHtml}
        ${signed ? `
        <div class="sig-section">
          <h2>Signatures</h2>
          <div class="sig-grid">
            <div>
              <div class="sig-line">${signerOneName}</div>
              <div class="sig-label">${d.partnerOneName} · ${new Date().toLocaleDateString()}</div>
            </div>
            <div>
              <div class="sig-line">${signerTwoName}</div>
              <div class="sig-label">${d.partnerTwoName} · ${new Date().toLocaleDateString()}</div>
            </div>
            <div>
              <div class="sig-line"></div>
              <div class="sig-label">Caitee Smith · Caitee Smith Photography</div>
            </div>
          </div>
        </div>` : ''}
      </body></html>
    `)
    win.document.close()
    win.print()
  }

  const Toggle = ({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) => (
    <button
      onClick={() => onChange(!value)}
      style={{
        width: '44px', height: '24px', borderRadius: '12px', border: 'none', cursor: 'pointer',
        background: value ? '#1a73e8' : '#ccc', position: 'relative', transition: 'background 0.2s', padding: 0,
      }}
    >
      <span style={{
        position: 'absolute', top: '2px', left: value ? '22px' : '2px',
        width: '20px', height: '20px', borderRadius: '50%', background: 'white',
        transition: 'left 0.2s', display: 'block',
        boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
      }} />
    </button>
  )

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 40 }} />
      <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', flexDirection: 'column', background: '#f8f9fa' }}>

        {/* Top bar */}
        <div style={{ background: 'white', borderBottom: '1px solid #e0e0e0', padding: '0 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '52px', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: '#555', fontSize: '14px' }}>← Back</button>
            <span style={{ fontSize: '14px', fontWeight: 500, color: '#333' }}>
              {d.partnerOneName} & {d.partnerTwoName} — Contract
            </span>
            <span style={{ fontSize: '12px', color: '#999' }}>All changes saved</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {mode === 'edit' ? (
              <>
                <button
                  onClick={() => setMode('sign')}
                  style={{ padding: '7px 16px', borderRadius: '6px', border: '1px solid #ddd', background: 'white', cursor: 'pointer', fontSize: '13px', fontFamily: 'inherit', color: '#333' }}
                >
                  Preview & sign
                </button>
                <button
                  onClick={printContract}
                  style={{ padding: '7px 16px', borderRadius: '6px', border: 'none', background: '#1a73e8', color: 'white', cursor: 'pointer', fontSize: '13px', fontFamily: 'inherit', fontWeight: 500 }}
                >
                  Done
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setMode('edit')}
                  style={{ padding: '7px 16px', borderRadius: '6px', border: '1px solid #ddd', background: 'white', cursor: 'pointer', fontSize: '13px', fontFamily: 'inherit', color: '#333' }}
                >
                  Edit contract
                </button>
                {signed && (
                  <button
                    onClick={printContract}
                    style={{ padding: '7px 16px', borderRadius: '6px', border: 'none', background: '#1a73e8', color: 'white', cursor: 'pointer', fontSize: '13px', fontFamily: 'inherit', fontWeight: 500 }}
                  >
                    Download PDF
                  </button>
                )}
              </>
            )}
          </div>
        </div>

        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

          {/* Left settings panel */}
          <div style={{ width: '260px', background: 'white', borderRight: '1px solid #e0e0e0', padding: '24px 20px', overflowY: 'auto', flexShrink: 0 }}>
            <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#333', marginBottom: '20px' }}>Template Settings</h3>

            <div style={{ marginBottom: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <p style={{ fontSize: '13px', fontWeight: 500, color: '#333' }}>My Signature Required</p>
                <Toggle value={signatureRequired} onChange={setSignatureRequired} />
              </div>
              <p style={{ fontSize: '12px', color: '#888', lineHeight: '1.5' }}>
                {signatureRequired ? 'Your signature is required to complete the contract.' : 'Contract completes on client signature only.'}
              </p>
            </div>

            <div style={{ borderTop: '1px solid #eee', paddingTop: '20px', marginBottom: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <p style={{ fontSize: '13px', fontWeight: 500, color: '#333' }}>Document Expiry</p>
                <Toggle value={expiryEnabled} onChange={setExpiryEnabled} />
              </div>
              <p style={{ fontSize: '12px', color: '#888', lineHeight: '1.5' }}>
                {expiryEnabled ? 'Contract will auto-cancel if not signed by expiry.' : 'Off'}
              </p>
            </div>

            <div style={{ borderTop: '1px solid #eee', paddingTop: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <p style={{ fontSize: '13px', fontWeight: 500, color: '#333' }}>Document Reminders</p>
                <Toggle value={remindersEnabled} onChange={setRemindersEnabled} />
              </div>
              {remindersEnabled && (
                <>
                  <p style={{ fontSize: '12px', color: '#888', marginBottom: '10px' }}>Automatically send email reminders to unsigned parties.</p>
                  {['3 days after sending', '7 days after', '14 days after', '21 days after', '30 days after'].map(r => (
                    <div key={r} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                      <span style={{ color: '#1a73e8', fontSize: '13px' }}>✓</span>
                      <span style={{ fontSize: '12px', color: '#555' }}>{r}</span>
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>

          {/* Main content */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

            {mode === 'edit' && (
              <>
                {/* Rich text toolbar */}
                <div style={{ background: 'white', borderBottom: '1px solid #e0e0e0', padding: '6px 16px', display: 'flex', alignItems: 'center', gap: '2px', flexShrink: 0, flexWrap: 'wrap' }}>
                  {/* Heading */}
                  <select
                    onChange={e => exec('formatBlock', e.target.value)}
                    defaultValue="p"
                    style={{ fontSize: '13px', border: '1px solid #ddd', borderRadius: '4px', padding: '4px 8px', fontFamily: 'inherit', marginRight: '8px', color: '#333', background: 'white' }}
                  >
                    <option value="p">Normal</option>
                    <option value="h1">Heading 1</option>
                    <option value="h2">Heading 2</option>
                    <option value="h3">Heading 3</option>
                  </select>

                  <div style={{ width: '1px', height: '20px', background: '#e0e0e0', margin: '0 6px' }} />

                  <ToolBtn label="B" onClick={() => exec('bold')} />
                  <ToolBtn label="I" onClick={() => exec('italic')} />
                  <ToolBtn label="U" onClick={() => exec('underline')} />
                  <ToolBtn label="S̶" onClick={() => exec('strikeThrough')} />

                  <div style={{ width: '1px', height: '20px', background: '#e0e0e0', margin: '0 6px' }} />

                  <ToolBtn label="≡" onClick={() => exec('justifyLeft')} />
                  <ToolBtn label="≡" onClick={() => exec('justifyCenter')} />
                  <ToolBtn label="≡" onClick={() => exec('justifyRight')} />

                  <div style={{ width: '1px', height: '20px', background: '#e0e0e0', margin: '0 6px' }} />

                  <ToolBtn label="• —" onClick={() => exec('insertUnorderedList')} />
                  <ToolBtn label="1. —" onClick={() => exec('insertOrderedList')} />

                  <div style={{ flex: 1 }} />

                  <VariableDropdown onInsert={insertField} />
                </div>

                {/* Editor */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '40px 20px' }}>
                  <div style={{ maxWidth: '720px', margin: '0 auto', background: 'white', boxShadow: '0 1px 4px rgba(0,0,0,0.1)', borderRadius: '4px', padding: '60px 72px', minHeight: '900px' }}>
                    <style>{`
                      .contract-editor h1 { font-size: 18pt; text-align: center; font-family: Georgia, serif; margin-bottom: 28px; }
                      .contract-editor h2 { font-size: 12pt; font-family: Georgia, serif; margin-top: 24px; margin-bottom: 8px; }
                      .contract-editor p { font-family: Georgia, serif; font-size: 11pt; line-height: 1.7; margin: 0 0 12px; }
                      .contract-editor .var-token { color: #1a73e8; text-decoration: underline; cursor: default; user-select: none; }
                      .contract-editor:focus { outline: none; }
                    `}</style>
                    <div
                      ref={editorRef}
                      className="contract-editor"
                      contentEditable
                      suppressContentEditableWarning
                      dangerouslySetInnerHTML={{ __html: DEFAULT_TEMPLATE }}
                      style={{ minHeight: '800px', outline: 'none' }}
                    />
                  </div>
                </div>
              </>
            )}

            {mode === 'sign' && (
              <div style={{ flex: 1, overflowY: 'auto', padding: '40px 20px' }}>
                <div style={{ maxWidth: '720px', margin: '0 auto' }}>

                  {!signed ? (
                    <>
                      {/* Preview of filled contract */}
                      <div style={{ background: 'white', boxShadow: '0 1px 4px rgba(0,0,0,0.1)', borderRadius: '4px', padding: '60px 72px', marginBottom: '24px' }}>
                        <style>{`
                          .contract-preview h1 { font-size: 18pt; text-align: center; font-family: Georgia, serif; margin-bottom: 28px; }
                          .contract-preview h2 { font-size: 12pt; font-family: Georgia, serif; margin-top: 24px; margin-bottom: 8px; }
                          .contract-preview p { font-family: Georgia, serif; font-size: 11pt; line-height: 1.7; margin: 0 0 12px; }
                        `}</style>
                        <div
                          className="contract-preview"
                          dangerouslySetInnerHTML={{ __html: getFilledHTML() }}
                        />
                      </div>

                      {/* Signature block */}
                      <div style={{ background: 'white', boxShadow: '0 1px 4px rgba(0,0,0,0.1)', borderRadius: '4px', padding: '32px 40px' }}>
                        <h3 style={{ fontSize: '15px', fontWeight: 600, color: '#333', marginBottom: '6px' }}>Sign this agreement</h3>
                        <p style={{ fontSize: '13px', color: '#888', marginBottom: '24px' }}>
                          By typing your full legal name below, you agree to all terms in this contract.
                        </p>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
                          {[
                            { label: d.partnerOneName, value: signerOneName, onChange: setSignerOneName },
                            { label: d.partnerTwoName, value: signerTwoName, onChange: setSignerTwoName },
                          ].map(({ label, value, onChange }) => (
                            <div key={label}>
                              <p style={{ fontSize: '12px', color: '#888', marginBottom: '6px' }}>{label}</p>
                              <input
                                value={value}
                                onChange={e => onChange(e.target.value)}
                                placeholder="Type full legal name to sign"
                                style={{
                                  width: '100%', border: 'none', borderBottom: '2px solid #333',
                                  outline: 'none', background: 'transparent', fontFamily: 'Georgia, serif',
                                  fontSize: '20px', fontStyle: 'italic', color: '#111',
                                  padding: '8px 0', boxSizing: 'border-box',
                                }}
                              />
                              <p style={{ fontSize: '11px', color: '#aaa', marginTop: '4px' }}>Type to sign</p>
                            </div>
                          ))}
                        </div>
                        <button
                          onClick={() => setSigned(true)}
                          disabled={!signerOneName.trim() || !signerTwoName.trim()}
                          style={{
                            padding: '10px 24px', borderRadius: '6px', border: 'none',
                            background: signerOneName.trim() && signerTwoName.trim() ? '#1a73e8' : '#ccc',
                            color: 'white', cursor: signerOneName.trim() && signerTwoName.trim() ? 'pointer' : 'not-allowed',
                            fontSize: '14px', fontFamily: 'inherit', fontWeight: 500,
                          }}
                        >
                          Sign agreement
                        </button>
                      </div>
                    </>
                  ) : (
                    <div style={{ background: 'white', boxShadow: '0 1px 4px rgba(0,0,0,0.1)', borderRadius: '4px', padding: '60px 40px', textAlign: 'center' }}>
                      <div style={{ fontSize: '48px', marginBottom: '16px' }}>✅</div>
                      <h3 style={{ fontFamily: 'Georgia, serif', fontSize: '24px', fontStyle: 'italic', color: '#333', marginBottom: '8px' }}>Agreement signed</h3>
                      <p style={{ fontSize: '14px', color: '#888', marginBottom: '4px' }}>Signed by {signerOneName} and {signerTwoName}</p>
                      <p style={{ fontSize: '13px', color: '#aaa', marginBottom: '28px' }}>
                        {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                      </p>
                      <button
                        onClick={printContract}
                        style={{ padding: '10px 24px', borderRadius: '6px', border: 'none', background: '#1a73e8', color: 'white', cursor: 'pointer', fontSize: '14px', fontFamily: 'inherit', fontWeight: 500 }}
                      >
                        Download signed PDF
                      </button>
                      <p style={{ fontSize: '12px', color: '#bbb', marginTop: '12px' }}>Persistent storage requires the backend.</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}

// ── Main page ─────────────────────────────────────────────────────

export default function ContractsPage() {
  const { data: bookings = [], isLoading } = useBookings()
  const [records, setRecords] = useState<Record<string, ContractStatus>>({})
  const [openBookingId, setOpenBookingId] = useState<string | null>(null)

  const statusConfig: Record<ContractStatus, { color: string; bg: string }> = {
    not_sent: { color: '#888',    bg: '#f5f5f5' },
    sent:     { color: '#7a5c0a', bg: '#fdf8e8' },
    signed:   { color: '#276840', bg: '#e6f4ec' },
  }

  const sorted = [...bookings].sort((a, b) =>
    new Date(a.weddingDate).getTime() - new Date(b.weddingDate).getTime()
  )

  return (
    <AppShell>
      <div className="px-10 py-10 max-w-4xl">
        <PageHeader title="Contracts" subtitle="Generate, customize, and collect signatures" />

        {isLoading ? (
          <div className="text-sm" style={{ color: 'var(--color-navy-400)' }}>Loading...</div>
        ) : bookings.length === 0 ? (
          <div className="text-center py-16">
            <p className="font-display italic text-lg" style={{ color: 'var(--color-navy-400)' }}>No bookings yet</p>
          </div>
        ) : (
          <Card>
            {sorted.map((booking, i) => {
              const status = records[booking.id] ?? 'not_sent'
              const cfg = statusConfig[status]
              return (
                <div
                  key={booking.id}
                  style={{ borderTop: i === 0 ? 'none' : '1px solid var(--color-navy-100)', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '16px' }}
                >
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-navy-800)', marginBottom: '2px' }}>
                      {booking.partnerOneName} & {booking.partnerTwoName}
                    </p>
                    <p style={{ fontSize: '12px', color: 'var(--color-navy-400)' }}>
                      {formatDate(booking.weddingDate)} · {booking.venueName}
                      {booking.packagePrice && ` · ${money(booking.packagePrice)}`}
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <select
                      value={status}
                      onChange={e => setRecords(p => ({ ...p, [booking.id]: e.target.value as ContractStatus }))}
                      style={{ fontSize: '12px', fontWeight: 600, padding: '4px 10px', borderRadius: '20px', border: 'none', background: cfg.bg, color: cfg.color, cursor: 'pointer', fontFamily: 'inherit', outline: 'none' }}
                    >
                      <option value="not_sent">Not sent</option>
                      <option value="sent">Sent</option>
                      <option value="signed">Signed</option>
                    </select>
                    <Button size="sm" variant="secondary" onClick={() => setOpenBookingId(booking.id)}>
                      Open contract
                    </Button>
                  </div>
                </div>
              )
            })}
          </Card>
        )}
      </div>

      {openBookingId && (
        <ContractModal bookingId={openBookingId} onClose={() => setOpenBookingId(null)} />
      )}
    </AppShell>
  )
}