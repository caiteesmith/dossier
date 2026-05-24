import type { BookingDetail } from '@/types'

interface Props { booking: BookingDetail }

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
  })
}

export default function PortalResources({ booking }: Props) {
  const connectOptions = [
    {
      icon: '📹',
      label: 'Google Meet',
      description: 'Video call — great for timeline walkthroughs',
      action: 'Schedule a call',
      // TODO: replace with real Calendly or Google Calendar link
      href: 'mailto:hello@caiteesmith.com?subject=Schedule a call - ' + booking.partnerOneName + ' & ' + booking.partnerTwoName + '&body=Hi Caitee, I\'d love to schedule a Google Meet call to go over our wedding details.',
      color: '#4285f4',
      bg: '#eef3ff',
    },
    {
      icon: '💻',
      label: 'Zoom',
      description: 'Video or audio call at your convenience',
      action: 'Request a Zoom link',
      href: 'mailto:hello@caiteesmith.com?subject=Zoom call request - ' + booking.partnerOneName + ' & ' + booking.partnerTwoName,
      color: '#2d8cff',
      bg: '#eef6ff',
    },
    {
      icon: '📞',
      label: 'Phone call',
      description: 'Sometimes it\'s just easier to talk',
      action: 'Call or text',
      href: 'tel:+19725550000',
      color: '#276840',
      bg: '#e6f4ec',
    },
    {
      icon: '✉️',
      label: 'Email',
      description: 'For questions that don\'t need an immediate answer',
      action: 'Send an email',
      href: 'mailto:hello@caiteesmith.com?subject=Question about our wedding - ' + booking.partnerOneName + ' & ' + booking.partnerTwoName,
      color: '#555',
      bg: '#f5f5f5',
    },
  ]

  const resources = [
    {
      icon: '📋',
      title: 'What to expect on your wedding day',
      body: 'Your photographer will arrive early to capture getting-ready details. Plan for about 30–45 minutes of couple portraits — more if you want golden hour shots. The more time in the timeline, the more creative and relaxed your photos will feel.',
    },
    {
      icon: '🌅',
      title: 'Golden hour portraits',
      body: 'The 20–30 minutes before sunset produce the most beautiful, warm light of the day. We\'ll plan a short escape from the reception to capture these — it\'s worth it. Check your timeline for when golden hour falls on your date.',
    },
    {
      icon: '🎭',
      title: 'Family formals: keep the list short',
      body: 'We recommend no more than 10 family combinations. Each combination takes about 3–5 minutes to organize and shoot. A tight list means you spend less time in formals and more time enjoying cocktail hour.',
    },
    {
      icon: '🗂️',
      title: 'Flat lay details',
      body: 'Ask your florist for a small arrangement of extra blooms for your flat lay photos. Gather your rings, invitation suite, jewelry, shoes, perfume, and anything sentimental into one bag the morning of — this makes detail shots fast and stress-free.',
    },
    {
      icon: '🌧️',
      title: 'Rain plans',
      body: 'Overcast days are actually beautiful for portraits — soft, even light with no harsh shadows. If it\'s raining, we\'ll work with what we have and often produce some of the most dramatic and intimate photos.',
    },
    {
      icon: '📱',
      title: 'Unplugged ceremonies',
      body: 'Consider asking guests to put phones away during the ceremony. It keeps aisles clear for photography and means your guests are actually present in the moment — not watching it through a screen.',
    },
  ]

  return (
    <div>
      {/* Schedule a call */}
      <div style={{ marginBottom: '40px' }}>
        <h2 style={{ fontFamily: 'Georgia, serif', fontSize: '22px', fontStyle: 'italic', color: '#1a1a2e', marginBottom: '6px' }}>
          Get in touch
        </h2>
        <p style={{ fontSize: '13px', color: '#888', lineHeight: '1.5', marginBottom: '20px' }}>
          Have questions about your timeline, shot list, or anything else? Reach out — happy to chat before the big day.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          {connectOptions.map((opt, i) => (
            <a
              key={i}
              href={opt.href}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '12px',
                padding: '16px',
                background: 'white',
                borderRadius: '12px',
                border: '1px solid #e8e4de',
                textDecoration: 'none',
                transition: 'box-shadow 0.15s',
              }}
              onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 2px 12px rgba(13,21,37,0.08)')}
              onMouseLeave={e => (e.currentTarget.style.boxShadow = 'none')}
            >
              <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: opt.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', flexShrink: 0 }}>
                {opt.icon}
              </div>
              <div>
                <p style={{ fontSize: '13px', fontWeight: 600, color: '#1a1a2e', marginBottom: '2px' }}>{opt.label}</p>
                <p style={{ fontSize: '12px', color: '#999', lineHeight: '1.4', marginBottom: '6px' }}>{opt.description}</p>
                <span style={{ fontSize: '12px', color: opt.color, fontWeight: 500 }}>{opt.action} →</span>
              </div>
            </a>
          ))}
        </div>
      </div>

      {/* Wedding date reminder */}
      <div style={{ background: '#0d1525', borderRadius: '12px', padding: '20px 24px', marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <p style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.4)', marginBottom: '4px' }}>Your wedding day</p>
          <p style={{ fontFamily: 'Georgia, serif', fontSize: '18px', fontStyle: 'italic', color: 'white' }}>
            {formatDate(booking.weddingDate)}
          </p>
          <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)', marginTop: '2px' }}>{booking.venueName}</p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)', marginBottom: '2px' }}>Questions or changes?</p>
          <a href="mailto:hello@caiteesmith.com" style={{ fontSize: '13px', color: '#f5c842', textDecoration: 'none', fontWeight: 500 }}>
            hello@caiteesmith.com
          </a>
        </div>
      </div>

      {/* Resources */}
      <div>
        <h2 style={{ fontFamily: 'Georgia, serif', fontSize: '22px', fontStyle: 'italic', color: '#1a1a2e', marginBottom: '6px' }}>
          Helpful resources
        </h2>
        <p style={{ fontSize: '13px', color: '#888', lineHeight: '1.5', marginBottom: '20px' }}>
          Tips from years of photographing weddings to help you feel prepared and relaxed on the day.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {resources.map((r, i) => (
            <div
              key={i}
              style={{ background: 'white', borderRadius: '12px', border: '1px solid #e8e4de', padding: '18px 20px', display: 'flex', gap: '14px' }}
            >
              <span style={{ fontSize: '20px', flexShrink: 0, lineHeight: '1.4' }}>{r.icon}</span>
              <div>
                <p style={{ fontSize: '14px', fontWeight: 600, color: '#1a1a2e', marginBottom: '4px' }}>{r.title}</p>
                <p style={{ fontSize: '13px', color: '#777', lineHeight: '1.6' }}>{r.body}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}