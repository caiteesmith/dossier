import React, { useRef, useState, useEffect } from 'react'
import type { BookingDetail } from '@/types'
import { api } from '@/lib/api'

interface DayOfSheetProps {
  booking: BookingDetail
  onClose: () => void
}

type TimelineRow = {
  label: string
  time: string
  section?: string
  notes?: string
}

type VendorEntry = {
  role: string
  name: string
  phone?: string | null
  email?: string | null
}

function formatDate(dateStr: string) {
  const [year, month, day] = dateStr.split('-').map(Number)
  return new Date(year, month - 1, day).toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
  })
}

function to12h(hhmm: string): string {
  if (!hhmm) return hhmm
  const [h, m] = hhmm.split(':').map(Number)
  const ampm = h < 12 ? 'am' : 'pm'
  const hour = h % 12 === 0 ? 12 : h % 12
  return `${hour}:${String(m).padStart(2, '0')}${ampm}`
}

export function DayOfSheet({ booking, onClose }: DayOfSheetProps) {
  const printRef = useRef<HTMLDivElement>(null)

  const handlePrint = () => {
    const content = printRef.current
    if (!content) return
    const win = window.open('', '_blank', 'width=960,height=800')
    if (!win) return
    win.document.write(`<!DOCTYPE html><html><head>
      <meta charset="utf-8"/>
      <title>Day-of Sheet — ${booking.partnerOneName} & ${booking.partnerTwoName}</title>
      <style>${PRINT_CSS}</style>
    </head><body>${content.innerHTML}
    <script>window.onload=()=>{window.print()}<\/script>
    </body></html>`)
    win.document.close()
  }

  const vendors: VendorEntry[] = booking.vendors.map(v => ({
    role: v.role, name: v.name, phone: v.phone, email: v.email,
  }))

  const dayOf = (booking as any).dayOfDetails ?? {}
  const [photographer, setPhotographer] = useState<Record<string, any> | null>(null)
  useEffect(() => {
    api.get('/api/photographer/me').then(r => setPhotographer(r.data)).catch(() => {})
  }, [])
  const leadName = dayOf.leadPhotographerName || (photographer ? `${photographer.firstName ?? ''} ${photographer.lastName ?? ''}`.trim() : '')
  const leadPhone = dayOf.leadPhotographerPhone || photographer?.phone || ''

  const timelineRows: TimelineRow[] = booking.timeline?.blocks.map(b => ({
    label: b.title,
    time: to12h(b.startTime),
    notes: [b.location, b.notes].filter(Boolean).join(' · ') || undefined,
  })) ?? []

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" style={{ background: 'rgba(13,21,37,0.85)' }}>
      <div className="min-h-screen py-8 px-4 flex flex-col items-center">
        {/* Toolbar */}
        <div className="w-full max-w-3xl flex items-center justify-between mb-4">
          <h2 className="text-white font-medium text-sm">Day-of sheet preview</h2>
          <div className="flex items-center gap-3">
            <button
              onClick={handlePrint}
              className="px-4 py-2 rounded-lg text-sm font-medium hover:opacity-80 transition-opacity"
              style={{ background: 'var(--color-gold-warm)', color: 'white' }}
            >
              Export PDF
            </button>
            <button
              onClick={onClose}
              className="px-3 py-2 rounded-lg text-sm hover:opacity-70 transition-opacity"
              style={{ background: 'var(--color-navy-700)', color: 'var(--color-navy-300)' }}
            >
              Close
            </button>
          </div>
        </div>

        {/* Preview */}
        <div ref={printRef} className="w-full max-w-3xl bg-white rounded-xl overflow-hidden shadow-2xl">

          {/* ── PAGE 1: COVER ─────────────────────────────────────── */}
          <div className="page" style={{ padding: '40px', pageBreakAfter: 'always' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
              <div style={{ width: '125px', height: '125px', borderRadius: '8px', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', background: photographer?.logoUrl ? 'transparent' : '#f0f3f8' }}>
                {photographer?.logoUrl
                  ? <img src={photographer.logoUrl} alt="Logo" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                  : <span style={{ fontSize: '10px', color: '#8b9ab0', fontFamily: 'sans-serif' }}>YOUR LOGO</span>
                }
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontFamily: 'Georgia, serif', fontSize: '32px', fontStyle: 'italic', color: '#1a1a2e', lineHeight: 1.1 }}>
                  {booking.partnerOneName} & {booking.partnerTwoName}
                </div>
                <div style={{ fontFamily: 'sans-serif', fontSize: '16px', color: '#444', marginTop: '6px', fontWeight: 500 }}>
                  {formatDate(booking.weddingDate)}
                </div>
              </div>
            </div>

            <div style={{ width: '100%', height: '280px', background: '#e8ecf4', borderRadius: '10px', marginBottom: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
              {booking.couplePhotoUrl ? (
                <img src={booking.couplePhotoUrl} alt="Couple" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <div style={{ textAlign: 'center', color: '#8b9ab0', fontFamily: 'sans-serif' }}>
                  <div style={{ fontSize: '32px', marginBottom: '8px', opacity: 0.4 }}>📷</div>
                  <div style={{ fontSize: '12px' }}>Couple photo</div>
                  <div style={{ fontSize: '11px', opacity: 0.7, marginTop: '4px' }}>Upload a photo to display here</div>
                </div>
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '24px' }}>

              {/* Day-of details */}
              <div>
                <div style={{ fontFamily: 'Georgia, serif', fontSize: '16px', fontStyle: 'italic', color: '#1a1a2e', marginBottom: '12px', borderBottom: '1px solid #e0e0e0', paddingBottom: '6px' }}>Day-Of Details</div>
                {[
                  ['Lead Photographer', leadName],
                  ['Second Photographer', dayOf.secondShooterName],
                  ['Coverage', booking.hoursCovered ? `${booking.hoursCovered} hours${dayOf.coverageStart ? ` (${dayOf.coverageStart}` : ''}${dayOf.coverageEnd ? `–${dayOf.coverageEnd})` : (dayOf.coverageStart ? ')' : '')}` : null],
                  ['Package', booking.packageName],
                  ['Guest Count', dayOf.guestCount],
                  ['Wedding Party', dayOf.weddingParty],
                  ['Dress Code', dayOf.dressCode],
                  ['Most Important Photos', dayOf.mostImportantPhotos],
                  ['Ceremony Restrictions', dayOf.ceremonyRestrictions],
                  ['Notes', booking.notes],
                ].filter(([, v]) => v).map(([label, value]) => (
                  <div key={label as string} style={{ marginBottom: '6px', fontFamily: 'sans-serif', fontSize: '11px' }}>
                    <span style={{ fontWeight: 600, color: '#1a1a2e' }}>{label}: </span>
                    <span style={{ color: '#444' }}>{value}</span>
                  </div>
                ))}
                {((booking as any).addOns ?? []).length > 0 && (
                  <div style={{ marginTop: '4px' }}>
                    <div style={{ fontWeight: 600, color: '#1a1a2e', fontSize: '11px', marginBottom: '3px' }}>Add-ons:</div>
                    {((booking as any).addOns ?? []).map((ao: any, i: number) => (
                      <div key={i} style={{ marginBottom: '4px', fontFamily: 'sans-serif', fontSize: '11px', color: '#444', paddingLeft: '8px' }}>
                        · {ao.name}{ao.notes ? ` — ${ao.notes}` : ''}
                      </div>
                    ))}
                  </div>
                )}

              </div>

              {/* Location details */}
              <div>
                <div style={{ fontFamily: 'Georgia, serif', fontSize: '16px', fontStyle: 'italic', color: '#1a1a2e', marginBottom: '12px', borderBottom: '1px solid #e0e0e0', paddingBottom: '6px' }}>Location Details</div>
                {[
                  ['Venue', booking.venueName],
                  ['Address', booking.venueAddress],
                  [booking.partnerOneName + ' Prep', dayOf.brideGettingReadyLocation],
                  [booking.partnerTwoName + ' Prep', dayOf.groomGettingReadyLocation],
                  ['First Look', dayOf.firstLookLocation],
                  ['Portraits', dayOf.portraitsLocation],
                  ['Ceremony', dayOf.ceremonyLocation],
                  ['Cocktail Hour', dayOf.cocktailHourLocation],
                  ['Sunset Photos', dayOf.sunsetPhotosLocation],
                  ['Reception', dayOf.receptionNotes],
                  ['Parking', dayOf.parkingNotes],
                ].filter(([, v]) => v).map(([label, value]) => (
                  <div key={label as string} style={{ marginBottom: '6px', fontFamily: 'sans-serif', fontSize: '11px' }}>
                    <span style={{ fontWeight: 600, color: '#1a1a2e' }}>{label}: </span>
                    <span style={{ color: '#444' }}>{value}</span>
                  </div>
                ))}
              </div>

              {/* Contact info */}
              <div>
                <div style={{ fontFamily: 'Georgia, serif', fontSize: '16px', fontStyle: 'italic', color: '#1a1a2e', marginBottom: '12px', borderBottom: '1px solid #e0e0e0', paddingBottom: '6px' }}>Contact Information</div>
                <div style={{ marginBottom: '8px', fontFamily: 'sans-serif', fontSize: '11px' }}>
                  <div style={{ fontWeight: 600, color: '#1a1a2e', marginBottom: '2px' }}>Photographers</div>
                  <div style={{ color: '#444' }}>{leadName} (Lead){leadPhone ? `: ${leadPhone}` : ''}</div>
                  {dayOf.secondShooterName && (
                    <div style={{ color: '#444' }}>{dayOf.secondShooterName} (Second){dayOf.secondShooterPhone ? `: ${dayOf.secondShooterPhone}` : ''}</div>
                  )}
                </div>
                {dayOf.coordinatorName && (
                  <div style={{ marginBottom: '8px', fontFamily: 'sans-serif', fontSize: '11px' }}>
                    <div style={{ fontWeight: 600, color: '#1a1a2e', marginBottom: '2px' }}>Coordinator</div>
                    <div style={{ color: '#444' }}>{dayOf.coordinatorName}{dayOf.coordinatorPhone ? `: ${dayOf.coordinatorPhone}` : ''}</div>
                  </div>
                )}
                {dayOf.alternateContactsPartnerOne?.length > 0 && (
                  <div style={{ marginBottom: '8px', fontFamily: 'sans-serif', fontSize: '11px' }}>
                    <div style={{ fontWeight: 600, color: '#1a1a2e', marginBottom: '2px' }}>Alternate contacts for {booking.partnerOneName}</div>
                    {dayOf.alternateContactsPartnerOne.map((c: any, i: number) => (
                      <div key={i} style={{ color: '#444', marginBottom: '2px' }}>
                        <strong style={{ color: '#1a1a2e' }}>{c.name}{c.role ? ` (${c.role})` : ''}</strong>{c.phone ? `: ${c.phone}` : ''}
                      </div>
                    ))}
                  </div>
                )}
                {dayOf.alternateContactsPartnerTwo?.length > 0 && (
                  <div style={{ marginBottom: '8px', fontFamily: 'sans-serif', fontSize: '11px' }}>
                    <div style={{ fontWeight: 600, color: '#1a1a2e', marginBottom: '2px' }}>Alternate contacts for {booking.partnerTwoName}</div>
                    {dayOf.alternateContactsPartnerTwo.map((c: any, i: number) => (
                      <div key={i} style={{ color: '#444', marginBottom: '2px' }}>
                        <strong style={{ color: '#1a1a2e' }}>{c.name}{c.role ? ` (${c.role})` : ''}</strong>{c.phone ? `: ${c.phone}` : ''}
                      </div>
                    ))}
                  </div>
                )}
                {booking.vendors.filter(v => !['Photographer', 'Second shooter', 'Second Shooter'].includes(v.role)).length > 0 && (
                  <div style={{ fontFamily: 'sans-serif', fontSize: '11px' }}>
                    <div style={{ fontWeight: 600, color: '#1a1a2e', marginBottom: '2px' }}>Other Vendors</div>
                    {booking.vendors.filter(v => !['Photographer', 'Second shooter', 'Second Shooter'].includes(v.role)).map(v => (
                      <div key={v.id} style={{ marginBottom: '2px', color: '#444' }}>
                        <strong style={{ color: '#1a1a2e' }}>{v.name} ({v.role})</strong>{v.phone ? `: ${v.phone}` : v.email ? `: ${v.email}` : ''}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ── PAGE 2: TIMELINE ─────────────────────────────────── */}
          <div className="page" style={{ padding: '40px', pageBreakAfter: 'always', borderTop: '3px solid #1a1a2e' }}>
            <div style={{ fontFamily: 'Georgia, serif', fontSize: '22px', fontStyle: 'italic', color: '#1a1a2e', marginBottom: '6px' }}>Timeline</div>
            <div style={{ fontFamily: 'sans-serif', fontSize: '11px', color: '#888', marginBottom: '20px' }}>
              {booking.partnerOneName} & {booking.partnerTwoName} · {formatDate(booking.weddingDate)}
              {booking.timeline?.sunsetTime && (
                <span style={{ marginLeft: '16px', color: '#b8891a' }}>🌅 Sunset {booking.timeline.sunsetTime} · ✨ Golden hour {booking.timeline.goldenHourTime}</span>
              )}
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'sans-serif', fontSize: '11px' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #1a1a2e' }}>
                  <th style={{ textAlign: 'left', padding: '6px 8px 6px 0', color: '#888', fontWeight: 500, width: '80px', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Time</th>
                  <th style={{ textAlign: 'left', padding: '6px 0', color: '#888', fontWeight: 500, fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Event</th>
                  <th style={{ textAlign: 'left', padding: '6px 0', color: '#888', fontWeight: 500, fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Notes / Location</th>
                </tr>
              </thead>
              <tbody>
                {timelineRows.map((row, i) => {
                  const isGolden = row.label.toLowerCase().includes('golden') || row.label.toLowerCase().includes('sunset')
                  return (
                    <React.Fragment key={i}>
                      {row.section && (
                        <tr>
                          <td colSpan={3} style={{ paddingTop: '12px', paddingBottom: '4px', fontWeight: 600, fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#666', borderBottom: '1px solid #eee' }}>
                            {row.section}
                          </td>
                        </tr>
                      )}
                      <tr style={{ borderBottom: '1px solid #f4f4f4', background: isGolden ? '#fdf8e8' : 'transparent' }}>
                        <td style={{ padding: '7px 8px 7px 0', fontWeight: 500, color: isGolden ? '#b8891a' : '#333', verticalAlign: 'top' }}>{row.time}</td>
                        <td style={{ padding: '7px 16px 7px 0', color: isGolden ? '#b8891a' : '#1a1a2e', fontWeight: isGolden ? 600 : 400, verticalAlign: 'top' }}>{row.label}</td>
                        <td style={{ padding: '7px 0', color: '#777', verticalAlign: 'top', fontSize: '11px' }}>{row.notes}</td>
                      </tr>
                    </React.Fragment>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* ── PAGE 3: SHOT LIST ─────────────────────────────────── */}
          <div className="page" style={{ padding: '40px', pageBreakAfter: 'always', borderTop: '3px solid #1a1a2e' }}>
            <div style={{ fontFamily: 'Georgia, serif', fontSize: '22px', fontStyle: 'italic', color: '#1a1a2e', marginBottom: '6px' }}>Shot List</div>
            <div style={{ fontFamily: 'sans-serif', fontSize: '11px', color: '#888', marginBottom: '20px' }}>
              {booking.partnerOneName} & {booking.partnerTwoName} · {formatDate(booking.weddingDate)}
            </div>

            {booking.shotListGroups.length === 0 ? (
              <p style={{ fontFamily: 'sans-serif', fontSize: '12px', color: '#aaa', fontStyle: 'italic' }}>No shot list added yet.</p>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
                {booking.shotListGroups.map(group => (
                  <div key={group.id} style={{ marginBottom: '16px' }}>
                    <div style={{ fontFamily: 'Georgia, serif', fontSize: '14px', fontStyle: 'italic', color: '#1a1a2e', marginBottom: '8px', borderBottom: '1px solid #e0e0e0', paddingBottom: '5px' }}>
                      {group.name}
                    </div>
                    {group.items.map((item, i) => (
                      <div key={i} style={{ display: 'flex', gap: '8px', marginBottom: '5px', fontFamily: 'sans-serif', fontSize: '11px', alignItems: 'flex-start' }}>
                        <div style={{ width: '11px', height: '11px', border: '1px solid #ccc', borderRadius: '2px', flexShrink: 0, marginTop: '1px' }} />
                        <span style={{ color: '#333' }}>{item.description}</span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── PAGE 4: NOTES ─────────────────────────────────────── */}
          <div className="page" style={{ padding: '40px', borderTop: '3px solid #1a1a2e' }}>
            <div style={{ fontFamily: 'Georgia, serif', fontSize: '22px', fontStyle: 'italic', color: '#1a1a2e', marginBottom: '6px' }}>Notes</div>
            <div style={{ fontFamily: 'sans-serif', fontSize: '11px', color: '#888', marginBottom: '24px' }}>
              {booking.partnerOneName} & {booking.partnerTwoName} · {formatDate(booking.weddingDate)}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
              {booking.notes && (
                <div>
                  <div style={{ fontFamily: 'Georgia, serif', fontSize: '15px', fontStyle: 'italic', color: '#1a1a2e', marginBottom: '8px' }}>General Notes</div>
                  <div style={{ fontFamily: 'sans-serif', fontSize: '11px', color: '#444', lineHeight: '1.7' }}>{booking.notes}</div>
                </div>
              )}
            </div>

            <div style={{ marginTop: '24px' }}>
              <div style={{ fontFamily: 'Georgia, serif', fontSize: '15px', fontStyle: 'italic', color: '#1a1a2e', marginBottom: '12px' }}>Day-of notes</div>
              {dayOf.dayOfNotes && (
                <div style={{ fontFamily: 'sans-serif', fontSize: '11px', color: '#444', lineHeight: '1.7', marginBottom: '16px', padding: '10px 14px', background: '#faf9f7', borderRadius: '4px', border: '1px solid #e8e4de' }}>
                  {dayOf.dayOfNotes}
                </div>
              )}
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} style={{ borderBottom: '1px solid #e8e8e8', height: '28px', marginBottom: '4px' }} />
              ))}
            </div>

            <div style={{ marginTop: '32px', paddingTop: '12px', borderTop: '1px solid #e0e0e0', display: 'flex', justifyContent: 'space-between', fontFamily: 'sans-serif', fontSize: '9px', color: '#bbb' }}>
              <span>Dossier · Day-of sheet</span>
              <span>{photographer?.businessName ?? photographer ? `${photographer.firstName ?? ''} ${photographer.lastName ?? ''}`.trim() : 'Caitee Smith Photography'}</span>
              <span>Generated {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}

const PRINT_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;1,400&family=DM+Sans:wght@400;500;600&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: white; font-family: 'DM Sans', sans-serif; color: #1a1a2e; }
  .page { padding: 32px 40px; page-break-after: always; }
  .page:last-child { page-break-after: auto; }
  @media print {
    body { padding: 0; }
    @page { margin: 0.35in; size: letter portrait; }
  }
`