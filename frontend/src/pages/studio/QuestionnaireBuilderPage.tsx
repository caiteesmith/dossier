import { useState, useId } from 'react'
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragOverEvent,
  DragEndEvent,
  closestCorners,
} from '@dnd-kit/core'
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import AppShell from '@/components/layout/AppShell'
import { Card, Button, PageHeader } from '@/components/ui'
import { WEDDING_QUESTIONNAIRE } from '@/data/questionnaire'
import type { QuestionnaireSection, QuestionnaireField, FieldType } from '@/types/questionnaire'

// ── Extended block types (fields + layout blocks) ─────────────────

interface Block extends QuestionnaireField {
  type: FieldType
  sectionId: string // which section this belongs to
}

interface QSection {
  id: string
  title: string
}

interface Questionnaire {
  id: string
  name: string
  description: string
  isMaster: boolean
  sections: QSection[]
  blocks: Block[]
  createdAt: string
}

// ── Field type palette ────────────────────────────────────────────

const FIELD_PALETTE: { type: FieldType; label: string; icon: string; isLayout?: boolean }[] = [
  { type: 'text',          label: 'Short answer',  icon: '▬' },
  { type: 'textarea',      label: 'Long answer',   icon: '≡' },
  { type: 'radio',         label: 'Single choice', icon: '◉' },
  { type: 'checkbox_list', label: 'Multi-select',  icon: '☑' },
  { type: 'yesno',         label: 'Yes / No',      icon: '◑' },
  { type: 'select',        label: 'Dropdown',      icon: '▾' },
  { type: 'date',          label: 'Date',          icon: '📅' },
  { type: 'time',          label: 'Time',          icon: '⏱' },
  { type: 'number',        label: 'Number',        icon: '#' },
  { type: 'heading',       label: 'Heading',       icon: 'H',  isLayout: true },
  { type: 'divider',       label: 'Divider',       icon: '—',  isLayout: true },
  { type: 'spacer',        label: 'Spacer',        icon: '⬜', isLayout: true },
]

// ── Styles ────────────────────────────────────────────────────────

const iS = {
  width: '100%',
  background: 'white',
  border: '1px solid var(--color-navy-200)',
  borderRadius: '8px',
  padding: '8px 11px',
  fontSize: '13px',
  color: 'var(--color-navy-800)',
  outline: 'none',
  fontFamily: 'inherit',
  boxSizing: 'border-box' as const,
}

const lS: React.CSSProperties = {
  display: 'block',
  fontSize: '10px',
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  color: 'var(--color-navy-400)',
  marginBottom: '4px',
  fontWeight: 600,
}

// ── Helpers ───────────────────────────────────────────────────────

function uid() {
  return `b_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
}

function newBlock(type: FieldType, sectionId: string): Block {
  return {
    id: uid(),
    type,
    label: '',
    sectionId,
    required: false,
  }
}

function newSection(): QSection {
  return { id: uid(), title: 'New section' }
}

function flattenQuestionnaire(q: QuestionnaireSection[]): { sections: QSection[]; blocks: Block[] } {
  const sections: QSection[] = []
  const blocks: Block[] = []
  for (const s of q) {
    sections.push({ id: s.id, title: s.title })
    for (const f of s.fields) {
      blocks.push({ ...f, sectionId: s.id, type: f.type as FieldType })
    }
  }
  return { sections, blocks }
}

function typeLabel(type: FieldType) {
  return FIELD_PALETTE.find(p => p.type === type)?.label ?? type
}

function typeIcon(type: FieldType) {
  return FIELD_PALETTE.find(p => p.type === type)?.icon ?? '▬'
}

const needsOptions = (type: FieldType) =>
  type === 'radio' || type === 'checkbox_list' || type === 'select' || type === 'multiselect'

// ── Block inline editor (shown when selected) ─────────────────────

function BlockInlineEditor({ block, onChange }: { block: Block; onChange: (b: Block) => void }) {
  function set<K extends keyof Block>(key: K, value: Block[K]) {
    onChange({ ...block, [key]: value })
  }

  if (block.type === 'divider' || block.type === 'spacer') return null

  return (
    <div style={{ padding: '12px 14px', background: '#f8f9fc', borderTop: '1px solid var(--color-navy-100)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {/* Type picker */}
      <div>
        <label style={lS}>Field type</label>
        <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
          {FIELD_PALETTE.filter(p => !p.isLayout).map(p => (
            <button
              key={p.type}
              onClick={() => set('type', p.type)}
              style={{
                padding: '4px 9px', borderRadius: '6px', fontSize: '11px', fontWeight: 500,
                border: '1px solid var(--color-navy-200)', cursor: 'pointer', fontFamily: 'inherit',
                background: block.type === p.type ? 'var(--color-navy-800)' : 'white',
                color: block.type === p.type ? 'white' : 'var(--color-navy-500)',
              }}
            >{p.icon} {p.label}</button>
          ))}
        </div>
      </div>

      {/* Label */}
      <div>
        <label style={lS}>{block.type === 'heading' ? 'Heading text' : 'Question'}</label>
        <input
          value={block.label}
          onChange={e => set('label', e.target.value)}
          placeholder={block.type === 'heading' ? 'e.g. Getting Ready Details' : 'e.g. What is your mailing address?'}
          style={iS}
          autoFocus
        />
      </div>

      {/* Placeholder */}
      {(block.type === 'text' || block.type === 'textarea' || block.type === 'number') && (
        <div>
          <label style={lS}>Placeholder (optional)</label>
          <input value={block.placeholder ?? ''} onChange={e => set('placeholder', e.target.value)} placeholder="Hint text inside the field" style={iS} />
        </div>
      )}

      {/* Hint */}
      {block.type !== 'heading' && (
        <div>
          <label style={lS}>Helper text (optional)</label>
          <input value={block.hint ?? ''} onChange={e => set('hint', e.target.value)} placeholder="Shown below the field" style={iS} />
        </div>
      )}

      {/* Options */}
      {needsOptions(block.type) && (
        <div>
          <label style={lS}>Options (one per line)</label>
          <textarea
            value={(block.options ?? []).join('\n')}
            onChange={e => set('options', e.target.value.split('\n'))}
            rows={4}
            placeholder={'Option 1\nOption 2\nOption 3'}
            style={{ ...iS, resize: 'vertical' as const }}
          />
        </div>
      )}

      {/* Required */}
      {block.type !== 'heading' && (
        <label style={{ display: 'flex', alignItems: 'center', gap: '7px', cursor: 'pointer', fontSize: '12px', color: 'var(--color-navy-600)' }}>
          <input type="checkbox" checked={block.required ?? false} onChange={e => set('required', e.target.checked)} />
          Required
        </label>
      )}
    </div>
  )
}

// ── Sortable block row ────────────────────────────────────────────

function SortableBlock({
  block,
  isSelected,
  onSelect,
  onChange,
  onDelete,
}: {
  block: Block
  isSelected: boolean
  onSelect: () => void
  onChange: (b: Block) => void
  onDelete: () => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: block.id,
    data: { type: 'block', block },
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.35 : 1,
    zIndex: isDragging ? 999 : undefined,
  }

  const isLayout = block.type === 'divider' || block.type === 'spacer' || block.type === 'heading'

  return (
    <div ref={setNodeRef} style={style}>
      <div
        style={{
          border: `1px solid ${isSelected ? 'var(--color-steel-400)' : 'var(--color-navy-100)'}`,
          borderRadius: '10px',
          overflow: 'hidden',
          background: 'white',
          boxShadow: isSelected ? '0 0 0 3px rgba(100,130,180,0.12)' : undefined,
          transition: 'border-color 0.15s, box-shadow 0.15s',
        }}
      >
        {/* Block row */}
        <div
          style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', cursor: 'pointer' }}
          onClick={onSelect}
        >
          {/* Drag handle */}
          <span
            {...attributes}
            {...listeners}
            onClick={e => e.stopPropagation()}
            style={{ color: 'var(--color-navy-300)', fontSize: '14px', cursor: 'grab', flexShrink: 0, userSelect: 'none' }}
          >⠿</span>

          {/* Type badge */}
          {block.type === 'divider' ? (
            <div style={{ flex: 1, height: '1px', background: 'var(--color-navy-200)', margin: '0 4px' }} />
          ) : block.type === 'spacer' ? (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '10px', color: 'var(--color-navy-300)', background: 'var(--color-navy-50)', padding: '2px 8px', borderRadius: '4px' }}>SPACER</span>
            </div>
          ) : (
            <>
              <span style={{
                fontSize: '10px',
                fontFamily: isLayout ? 'inherit' : 'monospace',
                fontWeight: isLayout ? 700 : 400,
                background: isLayout ? 'var(--color-navy-700)' : 'var(--color-navy-100)',
                color: isLayout ? 'white' : 'var(--color-navy-500)',
                padding: '2px 7px', borderRadius: '4px', flexShrink: 0,
              }}>
                {typeIcon(block.type)} {block.type}
              </span>
              <span style={{
                flex: 1,
                fontSize: block.type === 'heading' ? '14px' : '13px',
                fontWeight: block.type === 'heading' ? 600 : 400,
                color: block.label ? 'var(--color-navy-700)' : 'var(--color-navy-300)',
                fontStyle: block.label ? 'normal' : 'italic',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>
                {block.label || `Untitled ${typeLabel(block.type)}`}
              </span>
              {block.required && (
                <span style={{ fontSize: '10px', color: '#b91c1c', flexShrink: 0 }}>req</span>
              )}
            </>
          )}

          {/* Delete */}
          <button
            onClick={e => { e.stopPropagation(); onDelete() }}
            style={{ fontSize: '12px', color: 'var(--color-navy-300)', background: 'none', border: 'none', cursor: 'pointer', padding: '0 4px', flexShrink: 0, transition: 'color 0.15s' }}
            onMouseEnter={e => (e.currentTarget.style.color = '#ef4444')}
            onMouseLeave={e => (e.currentTarget.style.color = 'var(--color-navy-300)')}
          >✕</button>
        </div>

        {/* Inline editor */}
        {isSelected && (
          <BlockInlineEditor block={block} onChange={onChange} />
        )}
      </div>
    </div>
  )
}

// ── Sortable section ──────────────────────────────────────────────

function SortableSection({
  section,
  blocks,
  selectedBlockId,
  onSelectBlock,
  onUpdateBlock,
  onDeleteBlock,
  onAddBlock,
  onUpdateSection,
  onDeleteSection,
  isOnly,
}: {
  section: QSection
  blocks: Block[]
  selectedBlockId: string | null
  onSelectBlock: (id: string | null) => void
  onUpdateBlock: (b: Block) => void
  onDeleteBlock: (id: string) => void
  onAddBlock: (type: FieldType) => void
  onUpdateSection: (s: QSection) => void
  onDeleteSection: () => void
  isOnly: boolean
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: section.id,
    data: { type: 'section' },
  })

  const [editingTitle, setEditingTitle] = useState(false)
  const [showPalette, setShowPalette] = useState(false)

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  }

  return (
    <div ref={setNodeRef} style={style}>
      <div style={{ border: '2px solid var(--color-navy-100)', borderRadius: '14px', overflow: 'hidden', marginBottom: '12px' }}>
        {/* Section header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px', background: 'var(--color-navy-50)' }}>
          <span
            {...attributes}
            {...listeners}
            style={{ color: 'var(--color-navy-300)', fontSize: '16px', cursor: 'grab', flexShrink: 0, userSelect: 'none' }}
          >⠿</span>

          {editingTitle ? (
            <input
              value={section.title}
              onChange={e => onUpdateSection({ ...section, title: e.target.value })}
              onBlur={() => setEditingTitle(false)}
              onKeyDown={e => e.key === 'Enter' && setEditingTitle(false)}
              autoFocus
              style={{ ...iS, flex: 1, padding: '4px 8px', fontWeight: 600, fontSize: '14px', background: 'white' }}
            />
          ) : (
            <span
              onClick={() => setEditingTitle(true)}
              title="Click to rename"
              style={{ flex: 1, fontSize: '14px', fontWeight: 600, color: 'var(--color-navy-800)', cursor: 'text' }}
            >
              {section.title}
            </span>
          )}

          <span style={{ fontSize: '11px', color: 'var(--color-navy-400)', flexShrink: 0 }}>
            {blocks.length} field{blocks.length !== 1 ? 's' : ''}
          </span>

          {!isOnly && (
            <button
              onClick={onDeleteSection}
              style={{ fontSize: '12px', color: 'var(--color-navy-300)', background: 'none', border: 'none', cursor: 'pointer', padding: '0 4px', transition: 'color 0.15s' }}
              onMouseEnter={e => (e.currentTarget.style.color = '#ef4444')}
              onMouseLeave={e => (e.currentTarget.style.color = 'var(--color-navy-300)')}
            >✕</button>
          )}
        </div>

        {/* Blocks */}
        <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <SortableContext items={blocks.map(b => b.id)} strategy={verticalListSortingStrategy}>
            {blocks.length === 0 ? (
              <p style={{ fontSize: '12px', color: 'var(--color-navy-300)', fontStyle: 'italic', textAlign: 'center', padding: '16px 0' }}>
                No fields yet — add one below
              </p>
            ) : (
              blocks.map(block => (
                <SortableBlock
                  key={block.id}
                  block={block}
                  isSelected={selectedBlockId === block.id}
                  onSelect={() => onSelectBlock(selectedBlockId === block.id ? null : block.id)}
                  onChange={onUpdateBlock}
                  onDelete={() => onDeleteBlock(block.id)}
                />
              ))
            )}
          </SortableContext>

          {/* Add field palette */}
          {showPalette ? (
            <div style={{ border: '1px solid var(--color-navy-200)', borderRadius: '10px', padding: '12px', background: 'white', marginTop: '4px' }}>
              <p style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-navy-400)', marginBottom: '8px', fontWeight: 600 }}>Form fields</p>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '10px' }}>
                {FIELD_PALETTE.filter(p => !p.isLayout).map(p => (
                  <button
                    key={p.type}
                    onClick={() => { onAddBlock(p.type); setShowPalette(false) }}
                    style={{ padding: '6px 11px', borderRadius: '8px', fontSize: '12px', fontWeight: 500, border: '1px solid var(--color-navy-200)', cursor: 'pointer', fontFamily: 'inherit', background: 'white', color: 'var(--color-navy-600)', transition: 'all 0.1s' }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'var(--color-navy-800)'; e.currentTarget.style.color = 'white' }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'white'; e.currentTarget.style.color = 'var(--color-navy-600)' }}
                  >{p.icon} {p.label}</button>
                ))}
              </div>
              <p style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-navy-400)', marginBottom: '8px', fontWeight: 600 }}>Layout</p>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '10px' }}>
                {FIELD_PALETTE.filter(p => p.isLayout).map(p => (
                  <button
                    key={p.type}
                    onClick={() => { onAddBlock(p.type); setShowPalette(false) }}
                    style={{ padding: '6px 11px', borderRadius: '8px', fontSize: '12px', fontWeight: 500, border: '1px solid var(--color-navy-200)', cursor: 'pointer', fontFamily: 'inherit', background: 'white', color: 'var(--color-navy-600)', transition: 'all 0.1s' }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'var(--color-navy-700)'; e.currentTarget.style.color = 'white' }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'white'; e.currentTarget.style.color = 'var(--color-navy-600)' }}
                  >{p.icon} {p.label}</button>
                ))}
              </div>
              <button onClick={() => setShowPalette(false)} style={{ fontSize: '12px', color: 'var(--color-navy-400)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
            </div>
          ) : (
            <button
              onClick={() => setShowPalette(true)}
              style={{ marginTop: '4px', fontSize: '12px', color: 'var(--color-navy-400)', background: 'none', border: '1px dashed var(--color-navy-200)', borderRadius: '8px', padding: '8px', cursor: 'pointer', fontFamily: 'inherit', width: '100%', transition: 'all 0.15s' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--color-navy-400)'; e.currentTarget.style.color = 'var(--color-navy-600)' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--color-navy-200)'; e.currentTarget.style.color = 'var(--color-navy-400)' }}
            >+ Add field</button>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Questionnaire list view ───────────────────────────────────────

interface QuestionnaireListProps {
  questionnaires: Questionnaire[]
  onEdit: (id: string) => void
  onNew: () => void
  onDuplicate: (q: Questionnaire) => void
  onDelete: (id: string) => void
}

function QuestionnaireList({ questionnaires, onEdit, onNew, onDuplicate, onDelete }: QuestionnaireListProps) {
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  return (
    <div>
      <PageHeader
        title="Questionnaires"
        subtitle="Build and manage forms to send to your clients"
        action={<Button size="sm" onClick={onNew}>+ New questionnaire</Button>}
      />

      <div className="space-y-4">
        {questionnaires.map(q => {
          const totalFields = q.blocks.filter(b => b.type !== 'divider' && b.type !== 'spacer').length
          return (
            <Card key={q.id} className="p-5">
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <p style={{ fontSize: '15px', fontWeight: 600, color: 'var(--color-navy-800)' }}>{q.name}</p>
                    {q.isMaster && (
                      <span style={{ fontSize: '10px', background: 'var(--color-navy-800)', color: 'white', padding: '2px 8px', borderRadius: '20px', fontWeight: 600 }}>Master</span>
                    )}
                  </div>
                  {q.description && (
                    <p style={{ fontSize: '12px', color: 'var(--color-navy-400)', marginBottom: '6px' }}>{q.description}</p>
                  )}
                  <p style={{ fontSize: '12px', color: 'var(--color-navy-400)' }}>
                    {q.sections.length} section{q.sections.length !== 1 ? 's' : ''} · {totalFields} field{totalFields !== 1 ? 's' : ''}
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                  <Button size="sm" variant="secondary" onClick={() => onEdit(q.id)}>Edit</Button>
                  <button onClick={() => onDuplicate(q)} style={{ fontSize: '12px', padding: '6px 12px', borderRadius: '8px', border: '1px solid var(--color-navy-200)', background: 'white', color: 'var(--color-navy-600)', cursor: 'pointer', fontFamily: 'inherit' }}>Copy</button>
                  {!q.isMaster && (
                    <button
                      onClick={() => setConfirmDelete(q.id)}
                      style={{ fontSize: '12px', color: 'var(--color-navy-300)', background: 'none', border: 'none', cursor: 'pointer', padding: '0 4px', transition: 'color 0.15s' }}
                      onMouseEnter={e => (e.currentTarget.style.color = '#ef4444')}
                      onMouseLeave={e => (e.currentTarget.style.color = 'var(--color-navy-300)')}
                    >✕</button>
                  )}
                </div>
              </div>
            </Card>
          )
        })}
      </div>

      <p style={{ fontSize: '11px', color: 'var(--color-navy-300)', marginTop: '16px' }}>
        Assigning questionnaires to specific bookings and persistent storage coming soon.
      </p>

      {confirmDelete && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div style={{ background: 'white', borderRadius: '12px', padding: '24px', maxWidth: '360px', width: '90%', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
            <p className="font-medium text-sm mb-2" style={{ color: 'var(--color-navy-800)' }}>Delete questionnaire?</p>
            <p className="text-xs mb-6" style={{ color: 'var(--color-navy-400)' }}>This cannot be undone.</p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setConfirmDelete(null)} style={{ fontSize: '13px', padding: '8px 16px', borderRadius: '8px', border: '1px solid var(--color-navy-200)', background: 'white', cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
              <button onClick={() => { onDelete(confirmDelete); setConfirmDelete(null) }} style={{ fontSize: '13px', padding: '8px 16px', borderRadius: '8px', border: 'none', background: '#ef4444', color: 'white', cursor: 'pointer', fontFamily: 'inherit' }}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Questionnaire editor ──────────────────────────────────────────

function QuestionnaireEditor({
  questionnaire,
  onChange,
  onBack,
}: {
  questionnaire: Questionnaire
  onChange: (q: Questionnaire) => void
  onBack: () => void
}) {
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }))

  // ── Block helpers ──────────────────────────────────────────────

  function getSectionBlocks(sectionId: string) {
    return questionnaire.blocks.filter(b => b.sectionId === sectionId)
  }

  function addBlock(sectionId: string, type: FieldType) {
    const block = newBlock(type, sectionId)
    onChange({ ...questionnaire, blocks: [...questionnaire.blocks, block] })
    setSelectedBlockId(block.id)
  }

  function updateBlock(block: Block) {
    onChange({ ...questionnaire, blocks: questionnaire.blocks.map(b => b.id === block.id ? block : b) })
  }

  function deleteBlock(id: string) {
    onChange({ ...questionnaire, blocks: questionnaire.blocks.filter(b => b.id !== id) })
    if (selectedBlockId === id) setSelectedBlockId(null)
  }

  function addSection() {
    const s = newSection()
    onChange({ ...questionnaire, sections: [...questionnaire.sections, s] })
  }

  function updateSection(s: QSection) {
    onChange({ ...questionnaire, sections: questionnaire.sections.map(existing => existing.id === s.id ? s : existing) })
  }

  function deleteSection(id: string) {
    onChange({
      ...questionnaire,
      sections: questionnaire.sections.filter(s => s.id !== id),
      blocks: questionnaire.blocks.filter(b => b.sectionId !== id),
    })
  }

  function handleSave() {
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  // ── Drag and drop ──────────────────────────────────────────────

  function handleDragStart({ active }: DragStartEvent) {
    setActiveId(active.id as string)
    setSelectedBlockId(null)
  }

  function handleDragOver({ active, over }: DragOverEvent) {
    if (!over || active.id === over.id) return

    const activeData = active.data.current
    const overData = over.data.current

    // Dragging a block over a different section
    if (activeData?.type === 'block' && overData?.type === 'block') {
      const activeBlock = questionnaire.blocks.find(b => b.id === active.id)
      const overBlock = questionnaire.blocks.find(b => b.id === over.id)
      if (!activeBlock || !overBlock) return
      if (activeBlock.sectionId !== overBlock.sectionId) {
        onChange({
          ...questionnaire,
          blocks: questionnaire.blocks.map(b => b.id === active.id ? { ...b, sectionId: overBlock.sectionId } : b),
        })
      }
    }
  }

  function handleDragEnd({ active, over }: DragEndEvent) {
    setActiveId(null)
    if (!over || active.id === over.id) return

    const activeData = active.data.current
    const overData = over.data.current

    if (activeData?.type === 'section' && overData?.type === 'section') {
      // Reorder sections
      const oldIdx = questionnaire.sections.findIndex(s => s.id === active.id)
      const newIdx = questionnaire.sections.findIndex(s => s.id === over.id)
      onChange({ ...questionnaire, sections: arrayMove(questionnaire.sections, oldIdx, newIdx) })
      return
    }

    if (activeData?.type === 'block') {
      // Reorder blocks within or across sections
      const activeBlock = questionnaire.blocks.find(b => b.id === active.id)
      const overBlock = questionnaire.blocks.find(b => b.id === over.id)
      if (!activeBlock) return

      if (overBlock) {
        const sectionBlocks = questionnaire.blocks.filter(b => b.sectionId === overBlock.sectionId)
        const oldIdx = sectionBlocks.findIndex(b => b.id === active.id)
        const newIdx = sectionBlocks.findIndex(b => b.id === over.id)

        if (oldIdx !== -1 && newIdx !== -1) {
          const reordered = arrayMove(sectionBlocks, oldIdx, newIdx)
          const otherBlocks = questionnaire.blocks.filter(b => b.sectionId !== overBlock.sectionId)
          // Maintain section order
          const allBlocks: Block[] = []
          for (const s of questionnaire.sections) {
            if (s.id === overBlock.sectionId) {
              allBlocks.push(...reordered)
            } else {
              allBlocks.push(...otherBlocks.filter(b => b.sectionId === s.id))
            }
          }
          onChange({ ...questionnaire, blocks: allBlocks })
        }
      }
    }
  }

  function handleDragCancel() {
    setActiveId(null)
  }

  const totalFields = questionnaire.blocks.filter(b => b.type !== 'divider' && b.type !== 'spacer').length

  return (
    <div>
      {/* Editor header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
        <button onClick={onBack} style={{ fontSize: '12px', color: 'var(--color-navy-400)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontFamily: 'inherit' }}>
          ← All questionnaires
        </button>
        <span style={{ color: 'var(--color-navy-200)' }}>·</span>
        <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-navy-800)' }}>{questionnaire.name}</span>
        {questionnaire.isMaster && (
          <span style={{ fontSize: '10px', background: 'var(--color-navy-800)', color: 'white', padding: '2px 8px', borderRadius: '20px', fontWeight: 600 }}>Master</span>
        )}
        <span style={{ fontSize: '12px', color: 'var(--color-navy-400)' }}>
          {questionnaire.sections.length} sections · {totalFields} fields
        </span>
        <div style={{ marginLeft: 'auto' }}>
          <Button size="sm" onClick={handleSave}>{saved ? '✓ Saved' : 'Save'}</Button>
        </div>
      </div>

      {/* Name & description — custom only */}
      {!questionnaire.isMaster && (
        <Card className="p-5 mb-6">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div>
              <label style={lS}>Name</label>
              <input value={questionnaire.name} onChange={e => onChange({ ...questionnaire, name: e.target.value })} style={{ ...iS, background: 'var(--color-fog)' }} />
            </div>
            <div>
              <label style={lS}>Description (optional)</label>
              <input value={questionnaire.description} onChange={e => onChange({ ...questionnaire, description: e.target.value })} placeholder="What is this for?" style={{ ...iS, background: 'var(--color-fog)' }} />
            </div>
          </div>
        </Card>
      )}

      {/* Sections + blocks with DnD */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        <SortableContext items={questionnaire.sections.map(s => s.id)} strategy={verticalListSortingStrategy}>
          {questionnaire.sections.map(section => (
            <SortableSection
              key={section.id}
              section={section}
              blocks={getSectionBlocks(section.id)}
              selectedBlockId={selectedBlockId}
              onSelectBlock={setSelectedBlockId}
              onUpdateBlock={updateBlock}
              onDeleteBlock={deleteBlock}
              onAddBlock={type => addBlock(section.id, type)}
              onUpdateSection={updateSection}
              onDeleteSection={() => deleteSection(section.id)}
              isOnly={questionnaire.sections.length === 1}
            />
          ))}
        </SortableContext>
      </DndContext>

      <button
        onClick={addSection}
        style={{ fontSize: '13px', color: 'var(--color-navy-400)', background: 'none', border: '2px dashed var(--color-navy-200)', borderRadius: '12px', padding: '14px', cursor: 'pointer', fontFamily: 'inherit', width: '100%', transition: 'all 0.15s' }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--color-navy-400)'; e.currentTarget.style.color = 'var(--color-navy-600)' }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--color-navy-200)'; e.currentTarget.style.color = 'var(--color-navy-400)' }}
      >
        + Add section
      </button>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────

export default function QuestionnaireBuilderPage() {
  const masterFlat = flattenQuestionnaire(WEDDING_QUESTIONNAIRE)

  const [questionnaires, setQuestionnaires] = useState<Questionnaire[]>([
    {
      id: 'master',
      name: 'Wedding Questionnaire',
      description: 'Standard questionnaire sent to all wedding clients',
      isMaster: true,
      sections: masterFlat.sections,
      blocks: masterFlat.blocks,
      createdAt: '2026-01-01',
    },
  ])
  const [editingId, setEditingId] = useState<string | null>(null)

  const editing = editingId ? questionnaires.find(q => q.id === editingId) ?? null : null

  function updateQuestionnaire(q: Questionnaire) {
    setQuestionnaires(prev => prev.map(e => e.id === q.id ? q : e))
  }

  function addQuestionnaire() {
    const s = newSection()
    const q: Questionnaire = {
      id: uid(),
      name: 'New questionnaire',
      description: '',
      isMaster: false,
      sections: [s],
      blocks: [],
      createdAt: new Date().toISOString().split('T')[0],
    }
    setQuestionnaires(prev => [...prev, q])
    setEditingId(q.id)
  }

  function duplicateQuestionnaire(q: Questionnaire) {
    // Deep clone with new IDs so blocks/sections don't share references
    const idMap: Record<string, string> = {}
    const newSections = q.sections.map(s => {
      const newId = uid()
      idMap[s.id] = newId
      return { ...s, id: newId }
    })
    const newBlocks = q.blocks.map(b => ({
      ...b,
      id: uid(),
      sectionId: idMap[b.sectionId] ?? b.sectionId,
    }))
    const copy: Questionnaire = {
      ...q,
      id: uid(),
      name: `${q.name} (copy)`,
      isMaster: false,
      sections: newSections,
      blocks: newBlocks,
      createdAt: new Date().toISOString().split('T')[0],
    }
    setQuestionnaires(prev => [...prev, copy])
  }

  function deleteQuestionnaire(id: string) {
    setQuestionnaires(prev => prev.filter(q => q.id !== id))
  }

  if (editing) {
    return (
      <AppShell>
        <div className="px-10 py-10 max-w-3xl">
          <QuestionnaireEditor
            questionnaire={editing}
            onChange={updateQuestionnaire}
            onBack={() => setEditingId(null)}
          />
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell>
      <div className="px-10 py-10 max-w-3xl">
        <QuestionnaireList
          questionnaires={questionnaires}
          onEdit={setEditingId}
          onNew={addQuestionnaire}
          onDuplicate={duplicateQuestionnaire}
          onDelete={deleteQuestionnaire}
        />
      </div>
    </AppShell>
  )
}