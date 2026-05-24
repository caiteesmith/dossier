import { ReactNode } from 'react'

// ── Badge ─────────────────────────────────────────────────────────

const badgeStyles: Record<string, { background: string; color: string }> = {
  new:           { background: 'var(--color-navy-50)',  color: 'var(--color-navy-600)' },
  contacted:     { background: 'var(--color-mist)',     color: 'var(--color-steel-600)' },
  proposal_sent: { background: 'var(--color-gold-pale)',color: 'var(--color-gold-warm)' },
  negotiating:   { background: '#ede9f8',               color: '#5b3fa8' },
  booked:        { background: '#e6f4ec',               color: '#276840' },
  lost:          { background: 'var(--color-navy-50)',  color: 'var(--color-navy-400)' },
  pending:       { background: 'var(--color-gold-pale)',color: 'var(--color-gold-warm)' },
  confirmed:     { background: '#e6f4ec',               color: '#276840' },
  completed:     { background: 'var(--color-navy-50)',  color: 'var(--color-navy-400)' },
  cancelled:     { background: '#fde8e8',               color: '#b91c1c' },
}

export function Badge({ status }: { status: string }) {
  const style = badgeStyles[status] ?? { background: 'var(--color-navy-50)', color: 'var(--color-navy-500)' }
  const label = status.replace(/_/g, ' ')
  return (
    <span
      style={style}
      className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium tracking-wide uppercase"
    >
      {label}
    </span>
  )
}

// ── Card ──────────────────────────────────────────────────────────

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={`rounded-xl ${className}`}
      style={{ background: 'white', border: '1px solid var(--color-navy-100)' }}
    >
      {children}
    </div>
  )
}

// ── Button ────────────────────────────────────────────────────────

type ButtonVariant = 'primary' | 'secondary' | 'ghost'

interface ButtonProps {
  children: ReactNode
  onClick?: () => void
  variant?: ButtonVariant
  size?: 'sm' | 'md'
  className?: string
  disabled?: boolean
}

const btnSizes = { sm: 'px-3 py-1.5 text-xs', md: 'px-4 py-2 text-sm' }

export function Button({ children, onClick, variant = 'primary', size = 'md', className = '', disabled = false }: ButtonProps) {
  const styles: Record<ButtonVariant, React.CSSProperties> = {
    primary:   { background: 'var(--color-navy-800)', color: 'white' },
    secondary: { background: 'var(--color-navy-50)',  color: 'var(--color-navy-800)' },
    ghost:     { background: 'transparent',           color: 'var(--color-navy-500)' },
  }
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={styles[variant]}
      className={`inline-flex items-center gap-1.5 rounded-lg font-medium transition-all duration-150 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-80 ${btnSizes[size]} ${className}`}
    >
      {children}
    </button>
  )
}

// ── Page header ───────────────────────────────────────────────────

export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div className="flex items-start justify-between mb-8">
      <div>
        <h1 className="font-display text-2xl italic" style={{ color: 'var(--color-navy-900)' }}>{title}</h1>
        {subtitle && <p className="text-sm mt-1" style={{ color: 'var(--color-navy-400)' }}>{subtitle}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  )
}

// ── Empty state ───────────────────────────────────────────────────

export function EmptyState({ icon, title, body }: { icon: string; title: string; body: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="text-4xl mb-4 opacity-20">{icon}</div>
      <p className="font-display italic text-lg" style={{ color: 'var(--color-navy-300)' }}>{title}</p>
      <p className="text-sm mt-1 max-w-xs" style={{ color: 'var(--color-navy-300)' }}>{body}</p>
    </div>
  )
}

// ── Stat card ─────────────────────────────────────────────────────

export function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <Card className="p-5">
      <p className="text-xs uppercase tracking-widest mb-1" style={{ color: 'var(--color-navy-400)' }}>{label}</p>
      <p className="font-display text-3xl italic" style={{ color: 'var(--color-navy-900)' }}>{value}</p>
      {sub && <p className="text-xs mt-1" style={{ color: 'var(--color-navy-300)' }}>{sub}</p>}
    </Card>
  )
}

// ── Divider ───────────────────────────────────────────────────────

export function Divider() {
  return <div style={{ borderTop: '1px solid var(--color-navy-100)' }} />
}