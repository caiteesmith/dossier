import { useRef } from 'react'
import type { BookingDetail } from '@/types'
import type { QuestionnaireAnswers } from '@/types/questionnaire'

interface DayOfSheetProps {
  booking: BookingDetail
  answers?: QuestionnaireAnswers
  onClose: () => void
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
  })
}

function a(answers: QuestionnaireAnswers | undefined, key: string): string {
  if (!answers) return ''
  const val = answers[key]
  if (!val) return ''
  if (Array.isArray(val)) return val.join(', ')
  return String(val)
}

export function DayOfSheet({ booking, answers, onClose }: DayOfSheetProps) {
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

  const vendors = [
    ...(booking.vendors.map(v => ({ role: v.role, name: v.name, phone: v.phone, email: v.email }))),
    ...(answers ? [
      { role: 'Planner', name: a(answers, 'vendor_planner') },
      { role: 'Officiant', name: a(answers, 'vendor_officiant') },
      { role: 'Videographer', name: a(answers, 'vendor_videographer') },
      { role: 'Florist', name: a(answers, 'vendor_florist') },
      { role: 'Hair', name: a(answers, 'vendor_hair') },
      { role: 'Makeup', name: a(answers, 'vendor_makeup') },
      { role: 'DJ/Band', name: a(answers, 'vendor_dj_band') },
    ].filter(v => v.name) : []),
  ]

  const timelineRows = answers ? [
    { label: 'Hair & Makeup', time: a(answers, 'tl_hair_makeup'), section: 'Getting Ready' },
    { label: 'Photographer Arrival', time: a(answers, 'tl_photographer_arrival') },
    { label: 'Details & Flat Lays', time: a(answers, 'tl_details_flatlays') },
    { label: 'Bride Getting Dressed', time: a(answers, 'tl_bride_getting_dressed') },
    { label: 'Groom Getting Dressed', time: a(answers, 'tl_groom_getting_dressed') },
    { label: 'Bridal Portraits', time: a(answers, 'tl_bridal_portraits') },
    { label: 'First Look', time: a(answers, 'tl_first_look'), section: 'First Look & Portraits' },
    { label: 'Bride & Groom Portraits', time: a(answers, 'tl_bride_groom_portraits') },
    { label: 'Wedding Party Portraits', time: a(answers, 'tl_wedding_party_portraits') },
    { label: 'Family Portraits', time: a(answers, 'tl_family_portraits') },
    { label: 'Leaving for Ceremony', time: a(answers, 'tl_leaving_for_ceremony'), section: 'Ceremony' },
    { label: 'Ceremony', time: a(answers, 'tl_ceremony_start') },
    { label: 'Cocktail Hour', time: a(answers, 'tl_cocktail_hour'), section: 'Reception' },
    { label: 'Reception', time: a(answers, 'tl_reception_start') },
    { label: 'Introductions', time: a(answers, 'tl_introductions') },
    { label: 'First Dance', time: a(answers, 'tl_first_dance') },
    { label: 'Parent Dances', time: a(answers, 'tl_parent_dances') },
    { label: 'Toasts', time: a(answers, 'tl_toasts') },
    { label: 'Dinner', time: a(answers, 'tl_dinner') },
    { label: 'Sunset Photos ✨', time: a(answers, 'tl_sunset_photos') },
    { label: 'Cake Cutting', time: a(answers, 'tl_cake_cutting') },
    { label: 'Dance Floor Opens', time: a(answers, 'tl_dance_floor') },
    { label: 'Photographer Departure', time: a(answers, 'tl_photographer_departure') },
  ].filter(r => r.time) : booking.timeline?.blocks.map(b => ({ label: b.title, time: b.startTime })) ?? []

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
            {/* Logo + header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
              <div style={{ width: '100px', height: '60px', background: '#f0f3f8', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: '10px', color: '#8b9ab0', fontFamily: 'sans-serif' }}>YOUR LOGO</span>
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

            {/* Hero photo */}
            <div style={{ width: '100%', height: '280px', background: '#e8ecf4', borderRadius: '10px', marginBottom: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', position: 'relative' }}>
              <div style={{ textAlign: 'center', color: '#8b9ab0', fontFamily: 'sans-serif' }}>
                <div style={{ fontSize: '32px', marginBottom: '8px', opacity: 0.4 }}>📷</div>
                <div style={{ fontSize: '12px' }}>Engagement photo</div>
                <div style={{ fontSize: '11px', opacity: 0.7, marginTop: '4px' }}>Upload a photo to display here</div>
              </div>
            </div>

            {/* Three columns */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '24px' }}>
              {/* Day-of details */}
              <div>
                <div style={{ fontFamily: 'Georgia, serif', fontSize: '16px', fontStyle: 'italic', color: '#1a1a2e', marginBottom: '12px', borderBottom: '1px solid #e0e0e0', paddingBottom: '6px' }}>Day-Of Details</div>
                {[
                  ['Lead Photographer', 'Caitee Smith'],
                  ['Second Photographer', a(answers, 'vendor_second_photographer') || '—'],
                  ['Hours of Coverage', a(answers, 'hours_of_coverage') || (booking.hoursCovered ? booking.hoursCovered + ' hours' : '—')],
                  ['Guest Count', a(answers, 'guest_count') || '—'],
                  ['Dress Code', a(answers, 'dress_code') || '—'],
                  ['Coordinator', a(answers, 'has_coordinator') || '—'],
                ].map(([label, value]) => (
                  <div key={label} style={{ marginBottom: '6px', fontFamily: 'sans-serif', fontSize: '11px' }}>
                    <span style={{ fontWeight: 600, color: '#1a1a2e' }}>{label}: </span>
                    <span style={{ color: '#444' }}>{value}</span>
                  </div>
                ))}
                {a(answers, 'important_photos') && (
                  <div style={{ marginTop: '8px', fontFamily: 'sans-serif', fontSize: '11px' }}>
                    <span style={{ fontWeight: 600, color: '#1a1a2e' }}>Most Important Photos: </span>
                    <span style={{ color: '#444' }}>{a(answers, 'important_photos')}</span>
                  </div>
                )}
              </div>

              {/* Location details */}
              <div>
                <div style={{ fontFamily: 'Georgia, serif', fontSize: '16px', fontStyle: 'italic', color: '#1a1a2e', marginBottom: '12px', borderBottom: '1px solid #e0e0e0', paddingBottom: '6px' }}>Location Details</div>
                {[
                  ['Venue', booking.venueName],
                  ['Bridal Prep', a(answers, 'bridal_prep_address')],
                  ['Groom Prep', a(answers, 'groom_prep_address')],
                  ['First Look', a(answers, 'first_look_location')],
                  ['Ceremony', a(answers, 'ceremony_address') || booking.venueAddress],
                  ['Cocktail Hour', a(answers, 'cocktail_location')],
                  ['Reception', a(answers, 'reception_address')],
                  ['Sunset Photos', a(answers, 'sunset_location')],
                ].filter(([, v]) => v).map(([label, value]) => (
                  <div key={label} style={{ marginBottom: '6px', fontFamily: 'sans-serif', fontSize: '11px' }}>
                    <span style={{ fontWeight: 600, color: '#1a1a2e' }}>{label}: </span>
                    <span style={{ color: '#444' }}>{value}</span>
                  </div>
                ))}
              </div>

              {/* Contact info */}
              <div>
                <div style={{ fontFamily: 'Georgia, serif', fontSize: '16px', fontStyle: 'italic', color: '#1a1a2e', marginBottom: '12px', borderBottom: '1px solid #e0e0e0', paddingBottom: '6px' }}>Contact Info</div>
                {a(answers, 'alternate_contact_bride') && (
                  <div style={{ marginBottom: '10px', fontFamily: 'sans-serif', fontSize: '11px' }}>
                    <div style={{ fontWeight: 600, color: '#1a1a2e', marginBottom: '3px' }}>Alternate Contacts</div>
                    <div style={{ color: '#444', whiteSpace: 'pre-line' }}>{a(answers, 'alternate_contact_bride')}</div>
                    {a(answers, 'alternate_contact_groom') && <div style={{ color: '#444', whiteSpace: 'pre-line', marginTop: '4px' }}>{a(answers, 'alternate_contact_groom')}</div>}
                  </div>
                )}
                <div style={{ fontWeight: 600, color: '#1a1a2e', marginBottom: '6px', fontFamily: 'sans-serif', fontSize: '11px' }}>Photographers</div>
                {booking.vendors.filter(v => ['Photographer', 'Second shooter', 'Second Shooter'].includes(v.role)).map(v => (
                  <div key={v.id} style={{ marginBottom: '4px', fontFamily: 'sans-serif', fontSize: '11px', color: '#444' }}>
                    <strong style={{ color: '#1a1a2e' }}>{v.name}:</strong> {v.phone ?? v.email ?? ''}
                  </div>
                ))}
                {vendors.filter(v => ['Videographer', 'DJ', 'DJ/Band', 'Planner', 'Florist'].includes(v.role)).map((v, i) => (
                  <div key={i} style={{ marginBottom: '4px', fontFamily: 'sans-serif', fontSize: '11px', color: '#444' }}>
                    <strong style={{ color: '#1a1a2e' }}>{v.name} ({v.role}):</strong> {v.phone ?? v.email ?? ''}
                  </div>
                ))}
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
                  const isSection = 'section' in row && row.section
                  return (
                    <>
                      {isSection && (
                        <tr key={`section-${i}`}>
                          <td colSpan={3} style={{ paddingTop: '12px', paddingBottom: '4px', fontWeight: 600, fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#666', borderBottom: '1px solid #eee' }}>
                            {(row as any).section}
                          </td>
                        </tr>
                      )}
                      <tr key={i} style={{ borderBottom: '1px solid #f4f4f4', background: isGolden ? '#fdf8e8' : 'transparent' }}>
                        <td style={{ padding: '7px 8px 7px 0', fontWeight: 500, color: isGolden ? '#b8891a' : '#333', verticalAlign: 'top' }}>{row.time}</td>
                        <td style={{ padding: '7px 16px 7px 0', color: isGolden ? '#b8891a' : '#1a1a2e', fontWeight: isGolden ? 600 : 400, verticalAlign: 'top' }}>{row.label}</td>
                        <td style={{ padding: '7px 0', color: '#777', verticalAlign: 'top' }}>
                          {'notes' in row && row.notes ? row.notes : ''}
                        </td>
                      </tr>
                    </>
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

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
              {/* Family shots */}
              <div>
                <div style={{ fontFamily: 'Georgia, serif', fontSize: '15px', fontStyle: 'italic', color: '#1a1a2e', marginBottom: '10px', borderBottom: '1px solid #e0e0e0', paddingBottom: '5px' }}>
                  Family Shot List
                </div>
                {a(answers, 'family_shots') ? (
                  <div style={{ fontFamily: 'sans-serif', fontSize: '11px', color: '#444', lineHeight: '1.7', whiteSpace: 'pre-line' }}>
                    {a(answers, 'family_shots')}
                  </div>
                ) : booking.shotListGroups.filter(g => g.name.toLowerCase().includes('family')).flatMap(g => g.items).map((item, i) => (
                  <div key={i} style={{ display: 'flex', gap: '8px', marginBottom: '5px', fontFamily: 'sans-serif', fontSize: '11px', alignItems: 'flex-start' }}>
                    <div style={{ width: '11px', height: '11px', border: '1px solid #ccc', borderRadius: '2px', flexShrink: 0, marginTop: '1px' }} />
                    <span style={{ color: '#333' }}>{item.description}</span>
                  </div>
                ))}
                {a(answers, 'divorced_parents') && (
                  <div style={{ marginTop: '10px', padding: '8px', background: '#fdf8e8', borderRadius: '4px', fontFamily: 'sans-serif', fontSize: '10px', color: '#7a5c0a' }}>
                    <strong>Note:</strong> {a(answers, 'divorced_parents')}
                  </div>
                )}

                {a(answers, 'must_have_shots') && (
                  <>
                    <div style={{ fontFamily: 'Georgia, serif', fontSize: '15px', fontStyle: 'italic', color: '#1a1a2e', marginTop: '20px', marginBottom: '10px', borderBottom: '1px solid #e0e0e0', paddingBottom: '5px' }}>
                      Must-Have Shots
                    </div>
                    <div style={{ fontFamily: 'sans-serif', fontSize: '11px', color: '#444', lineHeight: '1.7', whiteSpace: 'pre-line' }}>
                      {a(answers, 'must_have_shots')}
                    </div>
                  </>
                )}
              </div>

              {/* Getting ready checklist */}
              <div>
                <div style={{ fontFamily: 'Georgia, serif', fontSize: '15px', fontStyle: 'italic', color: '#1a1a2e', marginBottom: '10px', borderBottom: '1px solid #e0e0e0', paddingBottom: '5px' }}>
                  Getting Ready
                </div>
                {[
                  'Makeup application / hair styling',
                  'Bridal accessories (shoes, veil, perfume, jewelry)',
                  'Flat lay of accessories',
                  'Flat lay of invitation suite',
                  'Bridal party photos in suite',
                  "Groom's details (shoes, tie, watch, cologne, cufflinks)",
                  "Groom's flat lay",
                ].map((item, i) => (
                  <div key={i} style={{ display: 'flex', gap: '8px', marginBottom: '6px', fontFamily: 'sans-serif', fontSize: '11px', alignItems: 'center' }}>
                    <div style={{ width: '11px', height: '11px', border: '1px solid #ccc', borderRadius: '2px', flexShrink: 0 }} />
                    <span style={{ color: '#333' }}>{item}</span>
                  </div>
                ))}

                {booking.shotListGroups.filter(g => !g.name.toLowerCase().includes('family')).length > 0 && (
                  <>
                    <div style={{ fontFamily: 'Georgia, serif', fontSize: '15px', fontStyle: 'italic', color: '#1a1a2e', marginTop: '20px', marginBottom: '10px', borderBottom: '1px solid #e0e0e0', paddingBottom: '5px' }}>
                      Additional Groups
                    </div>
                    {booking.shotListGroups.filter(g => !g.name.toLowerCase().includes('family')).map(group => (
                      <div key={group.id} style={{ marginBottom: '10px' }}>
                        <div style={{ fontFamily: 'sans-serif', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#999', marginBottom: '4px' }}>{group.name}</div>
                        {group.items.map((item, i) => (
                          <div key={i} style={{ display: 'flex', gap: '8px', marginBottom: '4px', fontFamily: 'sans-serif', fontSize: '11px', alignItems: 'center' }}>
                            <div style={{ width: '11px', height: '11px', border: '1px solid #ccc', borderRadius: '2px', flexShrink: 0 }} />
                            <span style={{ color: '#333' }}>{item.description}</span>
                          </div>
                        ))}
                      </div>
                    ))}
                  </>
                )}
              </div>
            </div>
          </div>

          {/* ── PAGE 4: NOTES ─────────────────────────────────────── */}
          <div className="page" style={{ padding: '40px', borderTop: '3px solid #1a1a2e' }}>
            <div style={{ fontFamily: 'Georgia, serif', fontSize: '22px', fontStyle: 'italic', color: '#1a1a2e', marginBottom: '6px' }}>Notes</div>
            <div style={{ fontFamily: 'sans-serif', fontSize: '11px', color: '#888', marginBottom: '24px' }}>
              {booking.partnerOneName} & {booking.partnerTwoName} · {formatDate(booking.weddingDate)}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
              {a(answers, 'expectations') && (
                <div>
                  <div style={{ fontFamily: 'Georgia, serif', fontSize: '15px', fontStyle: 'italic', color: '#1a1a2e', marginBottom: '8px' }}>Expectations</div>
                  <div style={{ fontFamily: 'sans-serif', fontSize: '11px', color: '#444', lineHeight: '1.7' }}>{a(answers, 'expectations')}</div>
                </div>
              )}
              {a(answers, 'surprises') && (
                <div>
                  <div style={{ fontFamily: 'Georgia, serif', fontSize: '15px', fontStyle: 'italic', color: '#1a1a2e', marginBottom: '8px' }}>Surprises & Special Moments</div>
                  <div style={{ fontFamily: 'sans-serif', fontSize: '11px', color: '#444', lineHeight: '1.7' }}>{a(answers, 'surprises')}</div>
                </div>
              )}
              {a(answers, 'ceremony_restrictions') && a(answers, 'ceremony_restrictions') !== 'None' && (
                <div>
                  <div style={{ fontFamily: 'Georgia, serif', fontSize: '15px', fontStyle: 'italic', color: '#1a1a2e', marginBottom: '8px' }}>Restrictions</div>
                  <div style={{ fontFamily: 'sans-serif', fontSize: '11px', color: '#444', lineHeight: '1.7' }}>{a(answers, 'ceremony_restrictions')}</div>
                </div>
              )}
              {booking.notes && (
                <div>
                  <div style={{ fontFamily: 'Georgia, serif', fontSize: '15px', fontStyle: 'italic', color: '#1a1a2e', marginBottom: '8px' }}>General Notes</div>
                  <div style={{ fontFamily: 'sans-serif', fontSize: '11px', color: '#444', lineHeight: '1.7' }}>{booking.notes}</div>
                </div>
              )}
            </div>

            {/* Blank notes area */}
            <div style={{ marginTop: '24px' }}>
              <div style={{ fontFamily: 'Georgia, serif', fontSize: '15px', fontStyle: 'italic', color: '#1a1a2e', marginBottom: '12px' }}>Day-of notes</div>
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} style={{ borderBottom: '1px solid #e8e8e8', height: '28px', marginBottom: '4px' }} />
              ))}
            </div>

            {/* Footer */}
            <div style={{ marginTop: '32px', paddingTop: '12px', borderTop: '1px solid #e0e0e0', display: 'flex', justifyContent: 'space-between', fontFamily: 'sans-serif', fontSize: '9px', color: '#bbb' }}>
              <span>Dossier · Day-of sheet</span>
              <span>Caitee Smith Photography</span>
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