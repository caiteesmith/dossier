import type { BookingDetail } from '@/types'

interface Props { booking: BookingDetail }

export default function PortalVendors({ booking }: Props) {
  const { vendors } = booking

  if (vendors.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 0' }}>
        <p style={{ fontFamily: 'Georgia, serif', fontSize: '20px', fontStyle: 'italic', color: '#aaa' }}>
          Vendor contacts coming soon
        </p>
        <p style={{ fontSize: '13px', color: '#bbb', marginTop: '8px' }}>
          Your photographer will add the vendor contact sheet closer to the date.
        </p>
      </div>
    )
  }

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontFamily: 'Georgia, serif', fontSize: '22px', fontStyle: 'italic', color: '#1a1a2e', marginBottom: '6px' }}>
          Your vendor contacts
        </h2>
        <p style={{ fontSize: '13px', color: '#888' }}>
          Everyone involved in making your day happen. Save these numbers before the wedding.
        </p>
      </div>

      <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e8e4de', overflow: 'hidden' }}>
        {vendors.map((vendor, i) => (
          <div
            key={vendor.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '16px 20px',
              borderTop: i === 0 ? 'none' : '1px solid #f0ede8',
              gap: '16px',
            }}
          >
            <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flex: 1, minWidth: 0 }}>
              <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#aaa', width: '90px', flexShrink: 0 }}>
                {vendor.role}
              </span>
              <div>
                <p style={{ fontSize: '14px', fontWeight: 500, color: '#1a1a2e' }}>{vendor.name}</p>
                {vendor.notes && <p style={{ fontSize: '12px', color: '#999', marginTop: '2px' }}>{vendor.notes}</p>}
              </div>
            </div>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexShrink: 0 }}>
              {vendor.phone && (
                <a
                  href={`tel:${vendor.phone}`}
                  style={{ fontSize: '13px', color: '#5483a8', textDecoration: 'none', fontWeight: 500 }}
                >
                  📞 {vendor.phone}
                </a>
              )}
              {vendor.email && (
                <a
                  href={`mailto:${vendor.email}`}
                  style={{ fontSize: '12px', color: '#5483a8', textDecoration: 'none' }}
                >
                  {vendor.email}
                </a>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Photographer always at the bottom */}
      <div style={{ marginTop: '16px', background: '#0d1525', borderRadius: '12px', padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <p style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgba(255,255,255,0.4)', marginBottom: '4px' }}>Lead photographer</p>
          <p style={{ fontSize: '15px', fontWeight: 500, color: 'white' }}>Caitee Smith</p>
          <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', marginTop: '2px' }}>Caitee Smith Photography</p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <a href="tel:+19725550000" style={{ display: 'block', fontSize: '14px', color: '#f5c842', textDecoration: 'none', fontWeight: 500 }}>📞 (972) 555-0000</a>
          <a href="mailto:hello@caiteesmith.com" style={{ display: 'block', fontSize: '12px', color: 'rgba(255,255,255,0.5)', textDecoration: 'none', marginTop: '4px' }}>hello@caiteesmith.com</a>
        </div>
      </div>
    </div>
  )
}