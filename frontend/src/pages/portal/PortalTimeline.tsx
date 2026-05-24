import type { BookingDetail } from '@/types'

interface Props { booking: BookingDetail }

export default function PortalTimeline({ booking }: Props) {
  const { timeline } = booking

  if (!timeline || timeline.blocks.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 0' }}>
        <p style={{ fontFamily: 'Georgia, serif', fontSize: '20px', fontStyle: 'italic', color: '#aaa' }}>
          Timeline coming soon
        </p>
        <p style={{ fontSize: '13px', color: '#bbb', marginTop: '8px' }}>
          Your photographer is still building the day-of schedule. Check back soon.
        </p>
      </div>
    )
  }

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontFamily: 'Georgia, serif', fontSize: '22px', fontStyle: 'italic', color: '#1a1a2e', marginBottom: '6px' }}>
          Your wedding day timeline
        </h2>
        <p style={{ fontSize: '13px', color: '#888' }}>
          This is your tentative schedule. Your photographer will confirm the final version closer to the date.
        </p>
      </div>

      {timeline.sunsetTime && (
        <div style={{ background: '#fdf8e8', border: '1px solid #e8d48a', borderRadius: '10px', padding: '12px 18px', marginBottom: '20px', display: 'flex', gap: '20px', fontSize: '13px', color: '#7a5c0a' }}>
          <span>🌅 Sunset at {timeline.sunsetTime}</span>
          <span>·</span>
          <span>✨ Golden hour from {timeline.goldenHourTime}</span>
        </div>
      )}

      <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e8e4de', overflow: 'hidden' }}>
        {timeline.blocks.map((block, i) => {
          const isGolden = block.title.toLowerCase().includes('golden') || block.title.toLowerCase().includes('sunset')
          return (
            <div
              key={block.id}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '16px',
                padding: '16px 20px',
                borderTop: i === 0 ? 'none' : '1px solid #f0ede8',
                background: isGolden ? '#fdf8e8' : 'transparent',
              }}
            >
              <div style={{ width: '52px', textAlign: 'right', flexShrink: 0, paddingTop: '2px' }}>
                <span style={{ fontSize: '13px', fontWeight: 500, color: '#555' }}>{block.startTime}</span>
              </div>
              <div style={{ width: '1px', background: '#ddd', alignSelf: 'stretch', flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: '14px', fontWeight: 500, color: isGolden ? '#b8891a' : '#1a1a2e', marginBottom: '2px' }}>
                  {block.title}
                </p>
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '12px', color: '#999' }}>{block.durationMinutes} min</span>
                  {block.location && <span style={{ fontSize: '12px', color: '#999' }}>· {block.location}</span>}
                </div>
                {block.notes && (
                  <p style={{ fontSize: '12px', color: '#aaa', fontStyle: 'italic', marginTop: '4px' }}>{block.notes}</p>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}