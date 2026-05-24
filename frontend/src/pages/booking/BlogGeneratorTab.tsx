import { useState } from 'react'
import { Button, Card } from '@/components/ui'
import type { BookingDetail } from '@/types'
import { SAMPLE_QUESTIONNAIRE_RESPONSE } from '@/data/questionnaire'

interface Props { booking: BookingDetail }

function buildPrompt(booking: BookingDetail): string {
  const answers = SAMPLE_QUESTIONNAIRE_RESPONSE
  const a = (key: string) => {
    const v = answers[key]
    return v ? String(v) : ''
  }

  const vendors = booking.vendors.map(v => `${v.role}: ${v.name}`).join(', ')
  const timeline = booking.timeline?.blocks
    .map(b => `${b.startTime} — ${b.title}${b.location ? ` (${b.location})` : ''}`)
    .join('\n') ?? ''

  return `You are a wedding photographer writing a blog post for your photography website about a wedding you just photographed. Write in a warm, personal, storytelling voice — first person, like you're sharing the experience with potential clients. SEO-friendly but not keyword-stuffed. Around 400–500 words.

Wedding details:
- Couple: ${booking.partnerOneName} & ${booking.partnerTwoName}
- Date: ${new Date(booking.weddingDate).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
- Venue: ${booking.venueName}${booking.venueAddress ? `, ${booking.venueAddress}` : ''}
- Package: ${booking.packageName ?? ''} (${booking.hoursCovered ?? ''} hours)
- Vendors: ${vendors}

Timeline highlights:
${timeline}

About the couple (from their questionnaire):
- How they met: ${a('how_you_met')}
- Their ideal wedding day: ${a('ideal_wedding_day')}
- Important photos: ${a('important_photos')}
- Vibe/theme: ${a('color_palette_vibe')}
- Must-have shots: ${a('must_have_shots')}

Write the blog post. Include:
1. A compelling opening that sets the scene
2. A mention of how the couple met or their love story (briefly)
3. Highlights from the day — getting ready, ceremony, portraits, reception
4. A note about the venue and what made it special
5. A warm closing that speaks to potential clients
6. At the end, add a "Vendors" section listing each vendor on its own line as "Role: Name"

Do not use em dashes. Write naturally and avoid clichés like "magical" or "fairytale".`
}

export default function BlogGeneratorTab({ booking }: Props) {
  const [post, setPost] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)

  async function generate() {
    setLoading(true)
    setError('')
    setPost('')

    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1000,
          messages: [{ role: 'user', content: buildPrompt(booking) }],
        }),
      })

      if (!response.ok) throw new Error('API request failed')
      const data = await response.json()
      const text = data.content?.find((b: { type: string }) => b.type === 'text')?.text ?? ''
      setPost(text)
    } catch (err) {
      setError('Failed to generate post. Make sure you have API access configured.')
    } finally {
      setLoading(false)
    }
  }

  async function copyToClipboard() {
    await navigator.clipboard.writeText(post)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const wordCount = post ? post.split(/\s+/).filter(Boolean).length : 0

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h3 className="font-display italic text-lg" style={{ color: 'var(--color-navy-800)' }}>
          Blog post generator
        </h3>
        <p className="text-sm mt-1" style={{ color: 'var(--color-navy-400)', lineHeight: '1.5' }}>
          Generates a 400–500 word wedding recap post using the couple's questionnaire answers, timeline, and vendor list. Ready to drop into your website or edit as needed.
        </p>
      </div>

      {/* What's included */}
      <Card className="p-4">
        <p className="text-xs uppercase tracking-widest mb-3" style={{ color: 'var(--color-navy-400)' }}>
          Using data from this booking
        </p>
        <div className="grid grid-cols-2 gap-2">
          {[
            ['Couple', `${booking.partnerOneName} & ${booking.partnerTwoName}`],
            ['Venue', booking.venueName],
            ['Date', new Date(booking.weddingDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })],
            ['Timeline blocks', String(booking.timeline?.blocks.length ?? 0)],
            ['Vendors', String(booking.vendors.length)],
            ['Questionnaire', 'Loaded'],
          ].map(([label, value]) => (
            <div key={label} className="flex justify-between text-sm">
              <span style={{ color: 'var(--color-navy-400)' }}>{label}</span>
              <span style={{ color: 'var(--color-navy-700)', fontWeight: 500 }}>{value}</span>
            </div>
          ))}
        </div>
      </Card>

      {/* Generate button */}
      <div className="flex items-center gap-3">
        <Button onClick={generate} disabled={loading}>
          {loading ? '✍️ Writing...' : '✨ Generate blog post'}
        </Button>
        {post && (
          <Button variant="secondary" onClick={copyToClipboard}>
            {copied ? '✓ Copied!' : 'Copy to clipboard'}
          </Button>
        )}
        {post && wordCount > 0 && (
          <span className="text-xs" style={{ color: 'var(--color-navy-400)' }}>
            {wordCount} words
          </span>
        )}
      </div>

      {error && (
        <div className="rounded-lg p-4" style={{ background: '#fde8e8', border: '1px solid #fca5a5' }}>
          <p className="text-sm" style={{ color: '#b91c1c' }}>{error}</p>
        </div>
      )}

      {/* Loading skeleton */}
      {loading && (
        <Card className="p-6">
          <div className="space-y-3 animate-pulse">
            {[100, 90, 95, 75, 88, 60].map((w, i) => (
              <div key={i} style={{ height: '14px', borderRadius: '4px', background: 'var(--color-navy-100)', width: `${w}%` }} />
            ))}
          </div>
        </Card>
      )}

      {/* Generated post */}
      {post && !loading && (
        <Card>
          <div
            className="p-6"
            style={{
              fontFamily: 'Georgia, serif',
              fontSize: '15px',
              lineHeight: '1.8',
              color: 'var(--color-navy-800)',
              whiteSpace: 'pre-wrap',
            }}
          >
            {post}
          </div>
          <div
            className="px-6 py-3 flex justify-between items-center"
            style={{ borderTop: '1px solid var(--color-navy-100)' }}
          >
            <p className="text-xs" style={{ color: 'var(--color-navy-400)' }}>
              Review and edit before publishing. Add your own photos and personal touches.
            </p>
            <Button variant="ghost" size="sm" onClick={generate}>
              Regenerate
            </Button>
          </div>
        </Card>
      )}
    </div>
  )
}