import type { BookingDetail } from '@/types'

interface Props { booking: BookingDetail }

interface DocStatus {
  label: string
  status: 'complete' | 'pending' | 'not_started'
  detail?: string
  icon: string
}

function addDays(dateStr: string, days: number) {
  const [y, m, d] = dateStr.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  date.setDate(date.getDate() + days)
  return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
}

export default function PortalDocuments({ booking }: Props) {
  const galleryWeeks = booking.photographer?.galleryDeliveryWeeks ?? 8
  const galleryDate = booking.weddingDate ? addDays(booking.weddingDate, galleryWeeks * 7) : null

  const docs: DocStatus[] = [
    {
      icon: '📄',
      label: 'Photography contract',
      status: booking.status === 'confirmed' || booking.status === 'completed' ? 'complete' : 'pending',
      detail: booking.status === 'confirmed' ? 'Signed and on file' : 'Awaiting signature',
    },
    {
      icon: '💳',
      label: 'Retainer / deposit',
      status: booking.status === 'confirmed' || booking.status === 'completed' ? 'complete' : 'pending',
      detail: booking.status === 'confirmed' ? 'Received — thank you!' : 'Due upon contract signing',
    },
    {
      icon: '💰',
      label: 'Final payment',
      status: 'not_started',
      detail: booking.weddingDate
        ? `Due 30 days before — ${addDays(booking.weddingDate, -30)}`
        : 'Due 30 days before the wedding',
    },
    {
      icon: '🖼️',
      label: 'Gallery delivery',
      status: 'not_started',
      detail: galleryDate
        ? `By ${galleryDate} (${galleryWeeks} weeks after your wedding)`
        : `${galleryWeeks} weeks after your wedding date`,
    },
  ]

  const statusConfig = {
    complete:    { label: 'Complete',    color: '#276840', bg: '#e6f4ec', dot: '#276840' },
    pending:     { label: 'In progress', color: '#7a5c0a', bg: '#fdf8e8', dot: '#d4a832' },
    not_started: { label: 'Upcoming',    color: '#888',    bg: '#f5f5f5', dot: '#ccc'    },
  }

  return (
    <div>
      <div style={{ marginBottom: '28px' }}>
        <h2 style={{ fontFamily: 'Georgia, serif', fontSize: '22px', fontStyle: 'italic', color: '#1a1a2e', marginBottom: '6px' }}>
          Documents & payments
        </h2>
        <p style={{ fontSize: '13px', color: '#888', lineHeight: '1.5' }}>
          A quick look at where things stand with your contract and payments. Full document access will be available soon.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '32px' }}>
        {docs.map((doc, i) => {
          const cfg = statusConfig[doc.status]
          return (
            <div key={i} style={{ background: 'white', borderRadius: '12px', border: '1px solid #e8e4de', padding: '18px 20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
              <span style={{ fontSize: '22px', flexShrink: 0 }}>{doc.icon}</span>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: '14px', fontWeight: 500, color: '#1a1a2e', marginBottom: '2px' }}>{doc.label}</p>
                {doc.detail && <p style={{ fontSize: '12px', color: '#999' }}>{doc.detail}</p>}
              </div>
              <span style={{ fontSize: '11px', fontWeight: 600, padding: '4px 10px', borderRadius: '20px', background: cfg.bg, color: cfg.color, flexShrink: 0, display: 'flex', alignItems: 'center', gap: '5px' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: cfg.dot, flexShrink: 0, display: 'inline-block' }} />
                {cfg.label}
              </span>
            </div>
          )
        })}
      </div>

      {/* Package summary */}
      <div style={{ background: '#0d1525', borderRadius: '12px', padding: '20px 24px', color: 'white' }}>
        <p style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.4)', marginBottom: '12px' }}>
          Your package
        </p>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', flexWrap: 'wrap' }}>
          <div>
            <p style={{ fontSize: '18px', fontFamily: 'Georgia, serif', fontStyle: 'italic', color: 'white', marginBottom: '4px' }}>
              {booking.packageName ?? 'Photography package'}
            </p>
            {booking.hoursCovered && (
              <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)' }}>{booking.hoursCovered} hours of coverage</p>
            )}
          </div>
          {booking.packagePrice && (
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontSize: '22px', fontWeight: 600, color: '#f5c842' }}>${booking.packagePrice.toLocaleString()}</p>
              <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>Total investment</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}