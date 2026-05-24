import { useState } from 'react'
import type { BookingDetail } from '@/types'
import { WEDDING_QUESTIONNAIRE, SAMPLE_QUESTIONNAIRE_RESPONSE } from '@/data/questionnaire'
import type { QuestionnaireAnswers } from '@/types/questionnaire'

interface Props { booking: BookingDetail }

const inputStyle = {
  width: '100%',
  background: 'white',
  border: '1px solid #ddd',
  borderRadius: '8px',
  padding: '10px 14px',
  fontSize: '14px',
  color: '#1a1a2e',
  outline: 'none',
  fontFamily: 'inherit',
  boxSizing: 'border-box' as const,
}

const textareaStyle = {
  ...inputStyle,
  resize: 'vertical' as const,
  minHeight: '80px',
  lineHeight: '1.5',
}

const labelStyle = {
  display: 'block',
  fontSize: '13px',
  fontWeight: 500,
  color: '#444',
  marginBottom: '6px',
}

const hintStyle = {
  fontSize: '12px',
  color: '#aaa',
  marginTop: '4px',
  lineHeight: '1.4',
}

function FieldInput({
  field,
  value,
  onChange,
}: {
  field: { id: string; type: string; options?: string[]; placeholder?: string; hint?: string; label: string; required?: boolean }
  value: string | string[] | boolean
  onChange: (val: string | string[] | boolean) => void
}) {
  const strVal = typeof value === 'string' ? value : ''
  const arrVal = Array.isArray(value) ? value : []

  switch (field.type) {
    case 'textarea':
      return (
        <textarea
          value={strVal}
          onChange={e => onChange(e.target.value)}
          placeholder={field.placeholder}
          style={textareaStyle}
        />
      )

    case 'date':
      return <input type="date" value={strVal} onChange={e => onChange(e.target.value)} style={inputStyle} />

    case 'time':
      return <input type="time" value={strVal} onChange={e => onChange(e.target.value)} style={inputStyle} />

    case 'radio':
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {field.options?.map(opt => (
            <label key={opt} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', cursor: 'pointer' }}>
              <input
                type="radio"
                name={field.id}
                value={opt}
                checked={strVal === opt}
                onChange={() => onChange(opt)}
                style={{ marginTop: '2px', accentColor: '#0d1525' }}
              />
              <span style={{ fontSize: '14px', color: '#333', lineHeight: '1.4' }}>{opt}</span>
            </label>
          ))}
        </div>
      )

    case 'checkbox_list':
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {field.options?.map(opt => (
            <label key={opt} style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={arrVal.includes(opt)}
                onChange={e => {
                  if (e.target.checked) onChange([...arrVal, opt])
                  else onChange(arrVal.filter(v => v !== opt))
                }}
                style={{ accentColor: '#0d1525', width: '15px', height: '15px' }}
              />
              <span style={{ fontSize: '14px', color: '#333' }}>{opt}</span>
            </label>
          ))}
        </div>
      )

    default:
      return (
        <input
          type="text"
          value={strVal}
          onChange={e => onChange(e.target.value)}
          placeholder={field.placeholder}
          style={inputStyle}
        />
      )
  }
}

export default function PortalQuestionnaire({ booking }: Props) {
  const [answers, setAnswers] = useState<QuestionnaireAnswers>(SAMPLE_QUESTIONNAIRE_RESPONSE)
  const [activeSection, setActiveSection] = useState(0)
  const [submitted, setSubmitted] = useState(false)
  const [saving, setSaving] = useState(false)

  const currentSection = WEDDING_QUESTIONNAIRE[activeSection]
  const isLast = activeSection === WEDDING_QUESTIONNAIRE.length - 1
  const isFirst = activeSection === 0

  function handleChange(fieldId: string, value: string | string[] | boolean) {
    setAnswers(prev => ({ ...prev, [fieldId]: value }))
  }

  async function handleSubmit() {
    setSaving(true)
    // TODO: POST to /portal/:token/questionnaire with answers
    await new Promise(r => setTimeout(r, 800)) // simulate save
    setSaving(false)
    setSubmitted(true)
  }

  if (submitted) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 0' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎉</div>
        <h2 style={{ fontFamily: 'Georgia, serif', fontSize: '26px', fontStyle: 'italic', color: '#1a1a2e', marginBottom: '8px' }}>
          Thank you!
        </h2>
        <p style={{ fontSize: '14px', color: '#777', maxWidth: '400px', margin: '0 auto', lineHeight: '1.6' }}>
          Your questionnaire has been submitted. Your photographer will review your responses and be in touch if they have any questions.
        </p>
        <div style={{ marginTop: '24px', padding: '16px 20px', background: '#f0f3f8', borderRadius: '10px', display: 'inline-block' }}>
          <p style={{ fontSize: '13px', color: '#555' }}>
            📅 {new Date(booking.weddingDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })} · {booking.venueName}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <h2 style={{ fontFamily: 'Georgia, serif', fontSize: '22px', fontStyle: 'italic', color: '#1a1a2e', marginBottom: '6px' }}>
          Wedding questionnaire
        </h2>
        <p style={{ fontSize: '13px', color: '#888', lineHeight: '1.5' }}>
          This helps your photographer understand your vision, timeline, and all the details that make your day unique. Take your time — you can always update your answers before the wedding.
        </p>
      </div>

      {/* Section progress */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '32px', flexWrap: 'wrap' }}>
        {WEDDING_QUESTIONNAIRE.map((section, i) => (
          <button
            key={section.id}
            onClick={() => setActiveSection(i)}
            style={{
              padding: '5px 12px',
              borderRadius: '20px',
              fontSize: '12px',
              fontWeight: 500,
              border: 'none',
              cursor: 'pointer',
              fontFamily: 'inherit',
              transition: 'all 0.15s',
              background: i === activeSection ? '#0d1525' : i < activeSection ? '#e8ecf3' : '#f0f0f0',
              color: i === activeSection ? 'white' : i < activeSection ? '#3a5278' : '#999',
            }}
          >
            {i < activeSection ? '✓ ' : ''}{section.title}
          </button>
        ))}
      </div>

      {/* Current section */}
      <div style={{ background: 'white', borderRadius: '14px', border: '1px solid #e8e4de', overflow: 'hidden', marginBottom: '24px' }}>
        {/* Section header */}
        <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid #f0ede8', background: '#faf9f7' }}>
          <p style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#aaa', marginBottom: '4px' }}>
            Section {activeSection + 1} of {WEDDING_QUESTIONNAIRE.length}
          </p>
          <h3 style={{ fontFamily: 'Georgia, serif', fontSize: '18px', fontStyle: 'italic', color: '#1a1a2e', margin: 0 }}>
            {currentSection.title}
          </h3>
        </div>

        {/* Fields */}
        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {currentSection.fields.map(field => (
            <div key={field.id}>
              <label style={labelStyle}>
                {field.label}
                {field.required && <span style={{ color: '#b91c1c', marginLeft: '4px' }}>*</span>}
              </label>
              <FieldInput
                field={field}
                value={answers[field.id] ?? ''}
                onChange={val => handleChange(field.id, val)}
              />
              {field.hint && <p style={hintStyle}>{field.hint}</p>}
            </div>
          ))}
        </div>
      </div>

      {/* Navigation */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button
          onClick={() => setActiveSection(s => s - 1)}
          disabled={isFirst}
          style={{
            padding: '10px 20px',
            borderRadius: '8px',
            fontSize: '13px',
            fontWeight: 500,
            border: '1px solid #ddd',
            background: 'white',
            color: isFirst ? '#ccc' : '#555',
            cursor: isFirst ? 'not-allowed' : 'pointer',
            fontFamily: 'inherit',
          }}
        >
          ← Previous
        </button>

        <span style={{ fontSize: '12px', color: '#bbb' }}>
          {activeSection + 1} / {WEDDING_QUESTIONNAIRE.length}
        </span>

        {isLast ? (
          <button
            onClick={handleSubmit}
            disabled={saving}
            style={{
              padding: '10px 24px',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: 500,
              border: 'none',
              background: saving ? '#aaa' : '#0d1525',
              color: 'white',
              cursor: saving ? 'not-allowed' : 'pointer',
              fontFamily: 'inherit',
            }}
          >
            {saving ? 'Submitting...' : 'Submit questionnaire'}
          </button>
        ) : (
          <button
            onClick={() => setActiveSection(s => s + 1)}
            style={{
              padding: '10px 20px',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: 500,
              border: 'none',
              background: '#0d1525',
              color: 'white',
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            Next →
          </button>
        )}
      </div>
    </div>
  )
}