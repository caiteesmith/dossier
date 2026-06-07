type WorkflowStatus =
  | 'lead' | 'booked' | 'contracted' | 'deposit_paid'
  | 'shooting' | 'culling' | 'editing' | 'delivered' | 'complete'

const WORKFLOW_LABELS: Record<string, string> = {
  lead:         'Lead',
  booked:       'Booked',
  contracted:   'Contracted',
  deposit_paid: 'Deposit Paid',
  shooting:     'Shooting',
  culling:      'Culling',
  editing:      'Editing',
  delivered:    'Delivered',
  complete:     'Complete',
}

const WORKFLOW_COLORS: Record<string, { bg: string; color: string }> = {
  lead:         { bg: 'var(--color-navy-50)',  color: 'var(--color-navy-500)'  },
  booked:       { bg: '#e6f4ec',               color: '#276840'                },
  contracted:   { bg: '#e6f4ec',               color: '#276840'                },
  deposit_paid: { bg: '#fdf8e8',               color: '#7a5c0a'                },
  shooting:     { bg: '#fdf8e8',               color: '#7a5c0a'                },
  culling:      { bg: 'var(--color-navy-50)',  color: 'var(--color-steel-600)' },
  editing:      { bg: 'var(--color-navy-50)',  color: 'var(--color-steel-600)' },
  delivered:    { bg: '#e6f4ec',               color: '#276840'                },
  complete:     { bg: 'var(--color-navy-100)', color: 'var(--color-navy-500)'  },
}

export function WorkflowBadge({ status }: { status?: string }) {
  const s = status ?? 'booked'
  const cfg = WORKFLOW_COLORS[s] ?? WORKFLOW_COLORS.booked
  const label = WORKFLOW_LABELS[s] ?? s
  return (
    <span style={{
      fontSize: '11px', fontWeight: 600, padding: '2px 8px',
      borderRadius: '20px', background: cfg.bg, color: cfg.color,
      whiteSpace: 'nowrap',
    }}>
      {label}
    </span>
  )
}