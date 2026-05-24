import { ReactNode } from 'react'
import Sidebar from './Sidebar'

export default function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main
        style={{ marginLeft: 'var(--sidebar-width)' }}
        className="flex-1 min-h-screen overflow-y-auto"
      >
        {children}
      </main>
    </div>
  )
}