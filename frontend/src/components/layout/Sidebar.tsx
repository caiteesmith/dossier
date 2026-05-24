import { NavLink, useLocation } from 'react-router-dom'

const nav = [
  { label: 'Dashboard', to: '/dashboard', icon: '◈' },
  { label: 'Leads',     to: '/leads',     icon: '◎' },
  { label: 'Bookings',  to: '/bookings',  icon: '◉' },
]

export default function Sidebar() {
  const location = useLocation()

  return (
    <aside
      style={{ width: 'var(--sidebar-width)', background: 'var(--color-navy-900)' }}
      className="fixed top-0 left-0 h-screen flex flex-col shrink-0 z-20"
    >
      {/* Logo */}
      <div className="px-6 pt-8 pb-10">
        <span className="font-display text-xl tracking-wide italic" style={{ color: 'white' }}>Dossier</span>
        <p className="text-[11px] mt-0.5 tracking-widest uppercase" style={{ color: 'var(--color-navy-400)' }}>Wedding Studio</p>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 space-y-0.5">
        {nav.map(({ label, to, icon }) => {
          const active = location.pathname.startsWith(to)
          return (
            <NavLink
              key={to}
              to={to}
              style={active
                ? { background: 'var(--color-navy-700)', color: 'white' }
                : { color: 'var(--color-navy-300)' }
              }
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-150 hover:bg-white/5 hover:!text-white"
            >
              <span className="text-base opacity-70">{icon}</span>
              <span className="font-medium">{label}</span>
            </NavLink>
          )
        })}
      </nav>

      {/* Bottom */}
      <div className="px-6 py-6" style={{ borderTop: '1px solid var(--color-navy-700)' }}>
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-medium" style={{ background: 'var(--color-gold-warm)' }}>
            C
          </div>
          <div>
            <p className="text-xs font-medium leading-none" style={{ color: 'white' }}>Caitee Smith</p>
            <p className="text-[11px] mt-0.5" style={{ color: 'var(--color-navy-400)' }}>Caitee Smith Photography</p>
          </div>
        </div>
      </div>
    </aside>
  )
}