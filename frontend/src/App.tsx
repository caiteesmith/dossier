import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from '@/lib/auth'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const LoginPage             = lazy(() => import('@/pages/LoginPage'))
const DashboardPage         = lazy(() => import('@/pages/DashboardPage'))
const LeadsPage             = lazy(() => import('@/pages/LeadsPage'))
const BookingsPage          = lazy(() => import('@/pages/BookingsPage'))
const BookingDetailPage     = lazy(() => import('@/pages/booking/BookingDetailPage'))
const AnalyticsPage         = lazy(() => import('@/pages/AnalyticsPage'))
const AccountPage           = lazy(() => import('@/pages/account/AccountPage'))
const ToolsPage             = lazy(() => import('@/pages/ToolsPage'))
const ContractsPage         = lazy(() => import('@/pages/studio/ContractsPage'))
const InvoicesPage          = lazy(() => import('@/pages/studio/InvoicesPage'))
const PackagesPage          = lazy(() => import('@/pages/studio/PackagesPage'))
const GearPage              = lazy(() => import('@/pages/tools/GearPage'))
const BusinessDocumentsPage = lazy(() => import('@/pages/studio/BusinessDocumentsPage'))
const ExpensesPage          = lazy(() => import('@/pages/tools/ExpensesPage'))
const QuestionnairesPage    = lazy(() => import('@/pages/studio/QuestionnaireBuilderPage'))
const HelpPage              = lazy(() => import('@/pages/HelpPage'))
const PortalPage            = lazy(() => import('@/pages/portal/PortalPage'))

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 1000 * 60 * 5, retry: 1 },
  },
})

const Loader = () => (
  <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--color-navy-900)' }}>
    <p style={{ color: 'rgba(255,255,255,0.4)', fontFamily: 'sans-serif', fontSize: '14px' }}>Loading...</p>
  </div>
)

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth()
  if (loading) return <Loader />
  if (!session) return <Navigate to="/login" replace />
  return <>{children}</>
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <Suspense fallback={<Loader />}>
            <Routes>
              <Route path="/login"          element={<LoginPage />} />
              <Route path="/portal/:token/*" element={<PortalPage />} />

              <Route path="/"             element={<ProtectedRoute><Navigate to="/dashboard" replace /></ProtectedRoute>} />
              <Route path="/dashboard"    element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
              <Route path="/leads"        element={<ProtectedRoute><LeadsPage /></ProtectedRoute>} />
              <Route path="/bookings"     element={<ProtectedRoute><BookingsPage /></ProtectedRoute>} />
              <Route path="/bookings/:id" element={<ProtectedRoute><BookingDetailPage /></ProtectedRoute>} />
              <Route path="/analytics"    element={<ProtectedRoute><AnalyticsPage /></ProtectedRoute>} />
              <Route path="/account"      element={<ProtectedRoute><AccountPage /></ProtectedRoute>} />
              <Route path="/tools"        element={<ProtectedRoute><ToolsPage /></ProtectedRoute>} />
              <Route path="/tools/gear"       element={<ProtectedRoute><GearPage /></ProtectedRoute>} />
              <Route path="/tools/expenses"   element={<ProtectedRoute><ExpensesPage /></ProtectedRoute>} />
              <Route path="/studio/contracts"      element={<ProtectedRoute><ContractsPage /></ProtectedRoute>} />
              <Route path="/studio/invoices"       element={<ProtectedRoute><InvoicesPage /></ProtectedRoute>} />
              <Route path="/studio/packages"       element={<ProtectedRoute><PackagesPage /></ProtectedRoute>} />
              <Route path="/studio/documents"      element={<ProtectedRoute><BusinessDocumentsPage /></ProtectedRoute>} />
              <Route path="/studio/questionnaires" element={<ProtectedRoute><QuestionnairesPage /></ProtectedRoute>} />
              <Route path="/help"         element={<ProtectedRoute><HelpPage /></ProtectedRoute>} />

              <Route path="*" element={<ProtectedRoute><Navigate to="/dashboard" replace /></ProtectedRoute>} />
            </Routes>
          </Suspense>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  )
}