import { useState } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'

const NAV = [
  { label: 'Dashboard', to: '/dashboard', icon: '◈' },
  { label: 'Leads',     to: '/leads',     icon: '◎' },
  { label: 'Bookings',  to: '/bookings',  icon: '◉' },
  { label: 'Analytics', to: '/analytics', icon: '◇' },
]

const STUDIO_ITEMS = [
  { label: 'Contracts',      to: '/studio/contracts'      },
  { label: 'Invoices',       to: '/studio/invoices'       },
  { label: 'Packages',       to: '/studio/packages'       },
  { label: 'Documents',      to: '/studio/documents'      },
  { label: 'Questionnaires', to: '/studio/questionnaires' },
]

const TOOL_ITEMS = [
  { label: 'CODB Calculator',     tool: 'codb'     },
  { label: 'Workflow Calculator', tool: 'workflow' },
  { label: 'Mileage Calculator',  tool: 'mileage'  },
]

const HELP_ITEMS = [
  { label: 'User guide',      href: 'https://docs.dossier.app', external: true  },
  { label: 'Report an issue', href: '/help?tab=issue',          external: false },
  { label: 'Contact',         href: '/help?tab=contact',        external: false },
]

export default function Sidebar() {
  const location = useLocation()
  const navigate = useNavigate()

  const onStudio = location.pathname.startsWith('/studio')
  const onTools  = location.pathname.startsWith('/tools')
  const onHelp   = location.pathname.startsWith('/help')
  const currentTool = new URLSearchParams(location.search).get('tool')

  const [studioOpen, setStudioOpen] = useState(onStudio)
  const [toolsOpen,  setToolsOpen]  = useState(onTools)
  const [helpOpen,   setHelpOpen]   = useState(onHelp)

  function CollapsibleGroup({ label, icon, isOn, open, setOpen, children }: {
    label: string; icon: string; isOn: boolean; open: boolean
    setOpen: (v: boolean) => void; children: React.ReactNode
  }) {
    return (
      <div className="pt-0.5">
        <button onClick={() => setOpen(!open)}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium w-full hover:bg-white/5 transition-all duration-150"
          style={{ color: isOn ? 'white' : 'var(--color-navy-300)', background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left' }}>
          <span className="text-base opacity-70">{icon}</span>
          <span className="flex-1">{label}</span>
          <span style={{ fontSize: '10px', opacity: 0.5, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s', display: 'inline-block' }}>▾</span>
        </button>
        {open && (
          <div style={{ marginLeft: '28px', marginTop: '2px' }} className="space-y-0.5">
            {children}
          </div>
        )}
      </div>
    )
  }

  function SubItem({ to, label, active }: { to: string; label: string; active: boolean }) {
    return (
      <NavLink to={to}
        className="flex items-center px-3 py-2 rounded-lg text-xs font-medium transition-all duration-150 hover:bg-white/5 hover:text-white!"
        style={active ? { background: 'var(--color-navy-700)', color: 'white' } : { color: 'var(--color-navy-400)' }}>
        {label}
      </NavLink>
    )
  }

  function HelpItem({ label, href, external }: { label: string; href: string; external: boolean }) {
    if (external) {
      return (
        <a href={href} target="_blank" rel="noopener noreferrer"
          className="flex items-center px-3 py-2 rounded-lg text-xs font-medium transition-all duration-150 hover:bg-white/5"
          style={{ color: 'var(--color-navy-400)', textDecoration: 'none' }}
          onMouseEnter={e => (e.currentTarget.style.color = 'white')}
          onMouseLeave={e => (e.currentTarget.style.color = 'var(--color-navy-400)')}>
          {label}
          <span style={{ marginLeft: '4px', fontSize: '9px', opacity: 0.5 }}>↗</span>
        </a>
      )
    }
    return (
      <NavLink to={href}
        className="flex items-center px-3 py-2 rounded-lg text-xs font-medium transition-all duration-150 hover:bg-white/5"
        style={({ isActive }) => ({ color: isActive ? 'white' : 'var(--color-navy-400)', background: isActive ? 'var(--color-navy-700)' : 'transparent', textDecoration: 'none' })}>
        {label}
      </NavLink>
    )
  }

  return (
    <aside style={{ width: '300px', background: 'var(--color-navy-900)' }}
      className="fixed top-0 left-0 h-screen flex flex-col shrink-0 z-20">
      {/* Logo */}
      <div className="px-6 pt-8 pb-10">
        <span className="font-display text-xl tracking-wide italic" style={{ color: 'white' }}>Dossier</span>
        <p className="text-[11px] mt-0.5 tracking-widest uppercase" style={{ color: 'var(--color-navy-400)' }}>Wedding Studio</p>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto pb-4">
        {NAV.map(({ label, to, icon }) => {
          const active = location.pathname.startsWith(to)
          return (
            <NavLink key={to} to={to}
              style={active ? { background: 'var(--color-navy-700)', color: 'white' } : { color: 'var(--color-navy-300)' }}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-150 hover:bg-white/5 hover:text-white!">
              <span className="text-base opacity-70">{icon}</span>
              <span className="font-medium">{label}</span>
            </NavLink>
          )
        })}

        <CollapsibleGroup label="Studio" icon="◫" isOn={onStudio} open={studioOpen} setOpen={setStudioOpen}>
          {STUDIO_ITEMS.map(({ label, to }) => (
            <SubItem key={to} to={to} label={label} active={location.pathname === to} />
          ))}
        </CollapsibleGroup>

        <CollapsibleGroup label="Tools" icon="⬡" isOn={onTools} open={toolsOpen} setOpen={setToolsOpen}>
          {TOOL_ITEMS.map(({ label, tool }) => (
            <SubItem key={tool} to={`/tools?tool=${tool}`} label={label} active={onTools && currentTool === tool} />
          ))}
          <SubItem to="/tools/expenses" label="Expense Tracking" active={location.pathname === '/tools/expenses'} />
          <SubItem to="/tools/gear"     label="Gear Catalog"     active={location.pathname === '/tools/gear'} />
        </CollapsibleGroup>

        <div style={{ height: '1px', background: 'var(--color-navy-800)', margin: '8px 12px' }} />

        <CollapsibleGroup label="Help" icon="?" isOn={onHelp} open={helpOpen} setOpen={setHelpOpen}>
          {HELP_ITEMS.map(({ label, href, external }) => (
            <HelpItem key={label} label={label} href={href} external={external} />
          ))}
        </CollapsibleGroup>
      </nav>

      {/* Bottom */}
      <button onClick={() => navigate('/account')}
        className="px-6 py-5 w-full text-left transition-colors hover:bg-white/5"
        style={{ borderTop: '1px solid var(--color-navy-700)', background: 'transparent', cursor: 'pointer', fontFamily: 'inherit' }}>
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-medium shrink-0" style={{ background: 'var(--color-gold-warm)' }}>C</div>
          <div className="min-w-0">
            <p className="text-xs font-medium leading-none truncate" style={{ color: 'white' }}>Caitee Smith</p>
            <p className="text-[11px] mt-0.5 truncate" style={{ color: 'var(--color-navy-400)' }}>Caitee Smith Photography</p>
          </div>
          <span className="text-[10px] ml-auto shrink-0" style={{ color: 'var(--color-navy-500)' }}>⚙</span>
        </div>
      </button>
    </aside>
  )
}