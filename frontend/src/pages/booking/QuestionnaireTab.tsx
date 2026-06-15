import { useQuestionnaire } from '@/hooks/useData'
import { WEDDING_QUESTIONNAIRE } from '@/data/questionnaire'

interface Props {
  bookingId: string
  portalToken: string
}

export default function QuestionnaireTab({ bookingId, portalToken }: Props) {
  const { data, isLoading } = useQuestionnaire(bookingId)

  const portalUrl = `${window.location.origin}/portal/${portalToken}`

  if (isLoading) {
    return <div className="text-sm py-8 text-center" style={{ color: 'var(--color-navy-400)' }}>Loading...</div>
  }

  const answers = data?.answers ?? {}
  const hasAnswers = Object.keys(answers).length > 0
  const submittedAt = data?.submittedAt

  if (!hasAnswers) {
    return (
      <div className="text-center py-16">
        <p style={{ fontSize: '32px', marginBottom: '12px' }}>📋</p>
        <p className="font-display italic text-lg mb-2" style={{ color: 'var(--color-navy-600)' }}>
          No questionnaire responses yet
        </p>
        <p className="text-sm mb-6" style={{ color: 'var(--color-navy-400)' }}>
          Share the portal link with your clients so they can fill out their questionnaire.
        </p>
        <div
          className="flex items-center gap-3 rounded-xl px-4 py-3 mx-auto"
          style={{ background: 'var(--color-navy-50)', border: '1px solid var(--color-navy-100)', maxWidth: '480px' }}
        >
          <span className="text-xs flex-1 truncate" style={{ color: 'var(--color-navy-500)', fontFamily: 'monospace' }}>
            {portalUrl}
          </span>
          <button
            onClick={() => navigator.clipboard.writeText(portalUrl)}
            className="text-xs font-medium shrink-0 hover:opacity-70 transition-opacity"
            style={{ color: 'var(--color-steel-500)' }}
          >
            Copy
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Status banner */}
      <div
        className="flex items-center justify-between rounded-xl px-5 py-3"
        style={{
          background: submittedAt ? 'rgba(39,104,64,0.06)' : 'var(--color-gold-pale)',
          border: `1px solid ${submittedAt ? 'rgba(39,104,64,0.2)' : 'var(--color-gold-soft)'}`,
        }}
      >
        <div className="flex items-center gap-2">
          <span>{submittedAt ? '✓' : '⏳'}</span>
          <span className="text-sm font-medium" style={{ color: submittedAt ? '#276840' : 'var(--color-gold-warm)' }}>
            {submittedAt
              ? `Submitted ${new Date(submittedAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`
              : 'In progress — not yet submitted'}
          </span>
        </div>
        <a
          href={portalUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs hover:opacity-70 transition-opacity"
          style={{ color: 'var(--color-steel-500)' }}
        >
          Open portal →
        </a>
      </div>

      {/* Answers by section */}
      {WEDDING_QUESTIONNAIRE.map(section => {
        const sectionAnswers = section.fields.filter(f => {
          const val = answers[f.id]
          return val !== undefined && val !== '' && val !== null &&
            !(Array.isArray(val) && val.length === 0)
        })
        if (sectionAnswers.length === 0) return null

        return (
          <div key={section.id}>
            <h3 className="text-xs uppercase tracking-widest mb-3" style={{ color: 'var(--color-navy-400)' }}>
              {section.title}
            </h3>
            <div
              className="rounded-xl overflow-hidden"
              style={{ border: '1px solid var(--color-navy-100)', background: 'white' }}
            >
              {sectionAnswers.map((field, i) => {
                const val = answers[field.id]
                const display = Array.isArray(val) ? val.join(', ') : String(val)
                return (
                  <div
                    key={field.id}
                    className="px-5 py-3"
                    style={{ borderTop: i === 0 ? 'none' : '1px solid var(--color-navy-50)' }}
                  >
                    <p className="text-xs mb-1" style={{ color: 'var(--color-navy-400)' }}>{field.label}</p>
                    <p className="text-sm" style={{ color: 'var(--color-navy-800)', whiteSpace: 'pre-wrap' }}>{display}</p>
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}