// src/components/booking/GalleryTracker.tsx
// Used in BookingDetailPage Overview tab (photographer view — editable)
// and PortalDashboard (client view — read only)

import { useState } from 'react'

const DEFAULT_STAGES = [
  'Backup complete',
  'Sneak peek delivered',
  'Culling in progress',
  'Editing in progress',
  'Final review',
  'Gallery uploaded',
]

function parseStages(raw: string | undefined): string[] {
  if (!raw) return DEFAULT_STAGES
  try { return JSON.parse(raw) } catch { return DEFAULT_STAGES }
}

// ── Photographer-side (editable) ──────────────────────────────────

interface EditableProps {
  galleryStageIndex: number
  galleryStages?: string
  onUpdate: (stageIndex: number, stages: string) => void
  saving?: boolean
}

export function GalleryTrackerEditor({ galleryStageIndex, galleryStages, onUpdate, saving }: EditableProps) {
  const [stages, setStages] = useState<string[]>(parseStages(galleryStages))
  const [editingIdx, setEditingIdx] = useState<number | null>(null)
  const [editVal, setEditVal] = useState('')
  const currentIdx = galleryStageIndex

  function handleStageClick(i: number) {
    const newIdx = i === currentIdx ? i - 1 : i  // click current to go back
    onUpdate(Math.max(0, newIdx), JSON.stringify(stages))
  }

  function handleAdvance() {
    if (currentIdx < stages.length - 1)
      onUpdate(currentIdx + 1, JSON.stringify(stages))
  }

  function handleRename(i: number) {
    setEditingIdx(i)
    setEditVal(stages[i])
  }

  function handleRenameCommit() {
    if (editingIdx === null) return
    const updated = stages.map((s, i) => i === editingIdx ? editVal.trim() || s : s)
    setStages(updated)
    setEditingIdx(null)
    onUpdate(currentIdx, JSON.stringify(updated))
  }

  const isComplete = currentIdx >= stages.length - 1

  return (
    <div style={{ background: 'white', border: '1px solid var(--color-navy-100)', borderRadius: '12px', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--color-navy-100)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-navy-800)' }}>
            Gallery editing status
          </p>
          <p style={{ fontSize: '11px', color: 'var(--color-navy-400)', marginTop: '2px' }}>
            {isComplete ? '🎉 Gallery delivered!' : `Stage ${currentIdx + 1} of ${stages.length} · ${stages[currentIdx]}`}
          </p>
        </div>
        {!isComplete && (
          <button
            onClick={handleAdvance}
            disabled={saving}
            style={{
              fontSize: '12px', fontWeight: 600, padding: '6px 14px', borderRadius: '8px',
              border: 'none', background: 'var(--color-navy-800)', color: 'white',
              cursor: 'pointer', fontFamily: 'inherit', opacity: saving ? 0.6 : 1,
            }}
          >
            {saving ? 'Saving...' : `Mark "${stages[currentIdx + 1]}" →`}
          </button>
        )}
      </div>

      {/* Stages */}
      <div>
        {stages.map((stage, i) => {
          const isDone = i < currentIdx
          const isCurrent = i === currentIdx
          const isUpcoming = i > currentIdx
          return (
            <div
              key={i}
              style={{
                display: 'flex', alignItems: 'center', gap: '12px',
                padding: '10px 18px',
                borderTop: i === 0 ? 'none' : '1px solid var(--color-navy-50)',
                background: isCurrent ? 'var(--color-navy-50)' : 'transparent',
              }}
            >
              {/* Status dot */}
              <div style={{
                width: '20px', height: '20px', borderRadius: '50%', flexShrink: 0,
                border: `2px solid ${isDone ? '#276840' : isCurrent ? 'var(--color-navy-800)' : 'var(--color-navy-200)'}`,
                background: isDone ? '#276840' : 'transparent',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {isDone && (
                  <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                    <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
                {isCurrent && <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--color-navy-800)' }} />}
              </div>

              {/* Stage name — editable */}
              {editingIdx === i ? (
                <input
                  value={editVal}
                  onChange={e => setEditVal(e.target.value)}
                  onBlur={handleRenameCommit}
                  onKeyDown={e => { if (e.key === 'Enter') handleRenameCommit(); if (e.key === 'Escape') setEditingIdx(null) }}
                  autoFocus
                  style={{
                    flex: 1, fontSize: '13px', border: 'none', borderBottom: '1px solid var(--color-navy-300)',
                    outline: 'none', background: 'transparent', fontFamily: 'inherit',
                    color: 'var(--color-navy-800)', padding: '0 0 2px',
                  }}
                />
              ) : (
                <span
                  style={{
                    flex: 1, fontSize: '13px',
                    color: isDone ? 'var(--color-navy-400)' : isCurrent ? 'var(--color-navy-800)' : 'var(--color-navy-300)',
                    fontWeight: isCurrent ? 600 : 400,
                    textDecoration: isDone ? 'line-through' : 'none',
                  }}
                >
                  {stage}
                </span>
              )}

              {/* Actions */}
              <div style={{ display: 'flex', gap: '8px', opacity: 0 }} className="stage-actions">
                <button
                  onClick={() => handleRename(i)}
                  style={{ fontSize: '11px', color: 'var(--color-navy-400)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontFamily: 'inherit' }}
                >
                  Rename
                </button>
                <button
                  onClick={() => handleStageClick(i)}
                  style={{ fontSize: '11px', color: isDone || isCurrent ? '#b91c1c' : 'var(--color-steel-500)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontFamily: 'inherit' }}
                >
                  {isDone || isCurrent ? 'Undo' : 'Mark done'}
                </button>
              </div>

              {isDone && <span style={{ fontSize: '11px', color: '#276840', flexShrink: 0 }}>✓</span>}
              {isCurrent && <span style={{ fontSize: '10px', background: 'var(--color-navy-800)', color: 'white', padding: '2px 8px', borderRadius: '20px', flexShrink: 0 }}>Current</span>}
            </div>
          )
        })}
      </div>

      <style>{`.stage-actions { opacity: 0; } div:hover > .stage-actions { opacity: 1; }`}</style>
    </div>
  )
}

// ── Client-side (read only) ───────────────────────────────────────

interface ReadOnlyProps {
  galleryStageIndex: number
  galleryStages?: string
  galleryDeliveryWeeks?: number
  galleryDeliveryWeeksMax?: number
  weddingDate: string
  onNavigate?: () => void
}

export function GalleryTrackerCard({ galleryStageIndex, galleryStages, galleryDeliveryWeeks, galleryDeliveryWeeksMax, weddingDate, onNavigate }: ReadOnlyProps) {
  const stages = parseStages(galleryStages)
  const currentIdx = galleryStageIndex
  const isComplete = currentIdx >= stages.length - 1
  const weeksMin = galleryDeliveryWeeks ?? 6
  const weeksMax = galleryDeliveryWeeksMax ?? 8

  const galleryDate = (() => {
    const [y, m, d] = weddingDate.split('-').map(Number)
    const date = new Date(y, m - 1, d)
    date.setDate(date.getDate() + weeksMax * 7)
    return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
  })()

  const pct = Math.round((currentIdx / (stages.length - 1)) * 100)

  return (
    <div style={{ background: 'white', borderRadius: '14px', border: '1px solid #e8e4de', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ padding: '18px 20px 14px', borderBottom: '1px solid #f0ede8', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <p style={{ fontFamily: 'Georgia, serif', fontSize: '18px', fontStyle: 'italic', color: '#1a1a2e', marginBottom: '2px' }}>
            {isComplete ? '🎉 Your gallery is ready!' : 'Gallery editing progress'}
          </p>
          <p style={{ fontSize: '12px', color: '#aaa' }}>
            {isComplete ? 'Check your email for the gallery link' : `${weeksMin}–${weeksMax} weeks after your wedding · by ${galleryDate}`}
          </p>
        </div>
        {onNavigate && (
          <button onClick={onNavigate} style={{ fontSize: '12px', color: '#5483a8', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', padding: 0 }}>
            Details →
          </button>
        )}
      </div>

      {/* Progress bar */}
      <div style={{ padding: '14px 20px', borderBottom: '1px solid #f0ede8' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
          <span style={{ fontSize: '12px', color: '#aaa' }}>Stage {currentIdx + 1} of {stages.length}</span>
          <span style={{ fontSize: '12px', fontWeight: 500, color: isComplete ? '#276840' : '#1a1a2e' }}>{pct}% complete</span>
        </div>
        <div style={{ background: '#f0ede8', borderRadius: '999px', height: '6px' }}>
          <div style={{
            background: isComplete ? '#276840' : '#0d1525',
            height: '100%', width: `${pct}%`, borderRadius: '999px',
            transition: 'width 0.5s ease',
          }} />
        </div>
      </div>

      {/* Stages */}
      <div style={{ padding: '8px 0' }}>
        {stages.map((stage, i) => {
          const isDone = i < currentIdx
          const isCurrent = i === currentIdx
          return (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '8px 20px' }}>
              <div style={{
                width: '18px', height: '18px', borderRadius: '50%', flexShrink: 0,
                border: `2px solid ${isDone ? '#276840' : isCurrent ? '#0d1525' : '#ddd'}`,
                background: isDone ? '#276840' : 'transparent',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {isDone && (
                  <svg width="9" height="7" viewBox="0 0 10 8" fill="none">
                    <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
                {isCurrent && <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#0d1525' }} />}
              </div>
              <span style={{
                fontSize: '13px',
                color: isDone ? '#aaa' : isCurrent ? '#1a1a2e' : '#ccc',
                fontWeight: isCurrent ? 600 : 400,
                textDecoration: isDone ? 'line-through' : 'none',
              }}>
                {stage}
              </span>
              {isCurrent && (
                <span style={{ fontSize: '10px', background: '#0d1525', color: 'white', padding: '2px 8px', borderRadius: '20px', marginLeft: 'auto' }}>
                  In progress
                </span>
              )}
            </div>
          )
        })}
      </div>

      {!isComplete && (
        <div style={{ padding: '12px 20px', borderTop: '1px solid #f0ede8', background: '#faf9f7' }}>
          <p style={{ fontSize: '12px', color: '#aaa', textAlign: 'center' }}>
            🖼️ Gallery delivered within <strong style={{ color: '#1a1a2e' }}>{weeksMin}–{weeksMax} weeks</strong> · by {galleryDate}
          </p>
        </div>
      )}
    </div>
  )
}