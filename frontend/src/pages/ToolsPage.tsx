import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import AppShell from '@/components/layout/AppShell'
import { PageHeader } from '@/components/ui'
import CODBCalculatorTab from './tools/CodbCalculatorTab'
import WorkflowCalculatorTab from './tools/WorkflowCalculatorTab'
import MileageCalculatorTab from './tools/MileageCalculatorTab'

type Tool = 'codb' | 'workflow' | 'mileage'

const TOOLS: { id: Tool; label: string; description: string; emoji: string }[] = [
  {
    id: 'codb',
    label: 'CODB Calculator',
    description: 'True cost per wedding, break-even pricing, and effective hourly rate',
    emoji: '🧮',
  },
  {
    id: 'workflow',
    label: 'Workflow Calculator',
    description: 'Editing time estimator — culling, editing, overhead, and delivery pace',
    emoji: '⏱',
  },
  {
    id: 'mileage',
    label: 'Mileage Calculator',
    description: 'Track business mileage for tax deductions using the IRS standard rate',
    emoji: '🚗',
  },
]

export default function ToolsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const toolParam = searchParams.get('tool') as Tool | null
  const [activeTool, setActiveTool] = useState<Tool>(toolParam ?? 'codb')

  useEffect(() => {
    if (toolParam && toolParam !== activeTool) setActiveTool(toolParam)
  }, [toolParam])

  function selectTool(id: Tool) {
    setActiveTool(id)
    setSearchParams({ tool: id })
  }

  const active = TOOLS.find(t => t.id === activeTool)!

  return (
    <AppShell>
      <div className="px-10 py-10">
        <PageHeader
          title="Tools"
          subtitle="Planning and business calculators for your photography studio"
        />

        {/* Tool picker */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '32px', flexWrap: 'wrap' }}>
          {TOOLS.map(tool => (
            <button
              key={tool.id}
              onClick={() => selectTool(tool.id)}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '12px',
                padding: '14px 18px',
                borderRadius: '12px',
                border: `1px solid ${activeTool === tool.id ? 'var(--color-navy-800)' : 'var(--color-navy-100)'}`,
                background: activeTool === tool.id ? 'var(--color-navy-900)' : 'white',
                cursor: 'pointer',
                fontFamily: 'inherit',
                textAlign: 'left',
                transition: 'all 0.15s',
                minWidth: '200px',
              }}
            >
              <span style={{ fontSize: '22px', lineHeight: 1, marginTop: '1px' }}>{tool.emoji}</span>
              <div>
                <p style={{ fontSize: '13px', fontWeight: 600, color: activeTool === tool.id ? 'white' : 'var(--color-navy-800)', marginBottom: '2px' }}>
                  {tool.label}
                </p>
                <p style={{ fontSize: '11px', color: activeTool === tool.id ? 'rgba(255,255,255,0.55)' : 'var(--color-navy-400)', lineHeight: '1.4' }}>
                  {tool.description}
                </p>
              </div>
            </button>
          ))}
        </div>

        {activeTool === 'codb'     && <CODBCalculatorTab />}
        {activeTool === 'workflow' && <WorkflowCalculatorTab />}
        {activeTool === 'mileage'  && <MileageCalculatorTab />}
      </div>
    </AppShell>
  )
}