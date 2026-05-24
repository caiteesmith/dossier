import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from '@/lib/auth'
import LoginPage from '@/pages/LoginPage'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

import DashboardPage from '@/pages/DashboardPage'
import LeadsPage from '@/pages/LeadsPage'
import BookingsPage from '@/pages/BookingsPage'
import BookingDetailPage from '@/pages/booking/BookingDetailPage'
import AnalyticsPage from '@/pages/AnalyticsPage'
import AccountPage from '@/pages/account/AccountPage'
import ToolsPage from '@/pages/ToolsPage'
import ContractsPage from '@/pages/studio/ContractsPage'
import InvoicesPage from '@/pages/studio/InvoicesPage'
import PortalPage from '@/pages/portal/PortalPage'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 1000 * 60 * 5, retry: 1 },
  },
})


function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth()
  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--color-navy-900)' }}>
      <p style={{ color: 'rgba(255,255,255,0.4)', fontFamily: 'sans-serif', fontSize: '14px' }}>Loading...</p>
    </div>
  )
  if (!session) return <Navigate to="/login" replace />
  return <>{children}</>
}

export default function App() {
  return (
    <AuthProvider>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<ProtectedRoute><Navigate to="/dashboard" replace /></ProtectedRoute>} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/leads" element={<LeadsPage />} />
          <Route path="/bookings" element={<BookingsPage />} />
          <Route path="/bookings/:id" element={<BookingDetailPage />} />
          <Route path="/analytics" element={<AnalyticsPage />} />
          <Route path="/account" element={<AccountPage />} />
          <Route path="/tools" element={<ToolsPage />} />
          <Route path="/studio/contracts" element={<ContractsPage />} />
          <Route path="/studio/invoices" element={<InvoicesPage />} />
          {/* Client portal - outside protected routes, token-based auth */}
          <Route path="/portal/:token/*" element={<PortalPage />} />

          <Route path="*" element={<ProtectedRoute><Navigate to="/dashboard" replace /></ProtectedRoute>} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
    </AuthProvider>
  )
}