import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { usePortalBooking } from '@/hooks/useData'
import PortalQuestionnaire from './PortalQuestionnaire'
import PortalTimeline from './PortalTimeline'
import PortalVendors from './PortalVendors'
import PortalTodo from './PortalToDo'
import PortalDocuments from './PortalDocuments'
import PortalResources from './PortalResources'

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
  })
}

function daysUntil(dateStr: string) {
  const diff = new Date(dateStr).getTime() - new Date().getTime()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

type PortalTab = 'questionnaire' | 'checklist' | 'timeline' | 'vendors' | 'documents' | 'resources'

const TABS: { id: PortalTab; label: string }[] = [
  { id: 'questionnaire', label: 'Questionnaire' },
  { id: 'checklist',     label: 'Checklist' },
  { id: 'timeline',      label: 'Timeline' },
  { id: 'vendors',       label: 'Contacts' },
  { id: 'documents',     label: 'Documents' },
  { id: 'resources',     label: 'Resources' },
]

export default function PortalPage() {
  const { token } = useParams<{ token: string }>()
  const { data: booking, isLoading } = usePortalBooking(token ?? '')
  const [activeTab, setActiveTab] = useState<PortalTab>('questionnaire')

  if (isLoading) {
    return (
      <div style={{ minHeight: '100vh', background: '#f8f6f2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ fontFamily: 'sans-serif', color: '#888', fontSize: '14px' }}>Loading your portal...</p>
      </div>
    )
  }

  if (!booking) {
    return (
      <div style={{ minHeight: '100vh', background: '#f8f6f2', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '12px', padding: '40px' }}>
        <p style={{ fontFamily: 'Georgia, serif', fontSize: '22px', fontStyle: 'italic', color: '#333' }}>Link not found</p>
        <p style={{ fontFamily: 'sans-serif', color: '#888', fontSize: '13px', textAlign: 'center', maxWidth: '360px' }}>
          This portal link may have expired or been disabled. Contact your photographer.
        </p>
      </div>
    )
  }

  const days = daysUntil(booking.weddingDate)
  const completedTasks = booking.tasks.filter(t => t.completed).length
  const totalTasks = booking.tasks.length

  return (
    <div style={{ minHeight: '100vh', background: '#f8f6f2', fontFamily: "'DM Sans', ui-sans-serif, system-ui, sans-serif" }}>

      {/* ── Header ─────────────────────────────────────────────── */}
      <header style={{ background: '#0d1525', color: 'white' }}>

        {/* Branding bar */}
        <div style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', padding: '14px 40px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '34px', height: '34px', background: 'rgba(255,255,255,0.08)', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', color: 'rgba(255,255,255,0.5)', fontWeight: 600 }}>
              CS
            </div>
            <div>
              <p style={{ fontSize: '13px', fontWeight: 500, color: 'white', lineHeight: 1 }}>Caitee Smith Photography</p>
              <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginTop: '2px' }}>Wedding Photography Studio</p>
            </div>
          </div>
          <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)' }}>Your wedding portal</div>
        </div>

        {/* Hero */}
        <div style={{ padding: '36px 40px 0' }}>
          <p style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'rgba(255,255,255,0.4)', marginBottom: '6px' }}>
            Welcome
          </p>
          <h1 style={{ fontFamily: 'Georgia, serif', fontSize: '34px', fontStyle: 'italic', fontWeight: 400, color: 'white', lineHeight: 1.1, marginBottom: '10px' }}>
            {booking.partnerOneName} & {booking.partnerTwoName}
          </h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap', marginBottom: '20px' }}>
            <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)' }}>📅 {formatDate(booking.weddingDate)}</span>
            <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)' }}>📍 {booking.venueName}</span>
            {days > 0 && (
              <span style={{ background: 'rgba(200,134,10,0.2)', color: '#f5c842', fontSize: '12px', fontWeight: 500, padding: '3px 10px', borderRadius: '20px', border: '1px solid rgba(200,134,10,0.3)' }}>
                {days} days to go
              </span>
            )}
            {days === 0 && (
              <span style={{ background: 'rgba(200,134,10,0.2)', color: '#f5c842', fontSize: '12px', fontWeight: 500, padding: '3px 10px', borderRadius: '20px' }}>
                Today! 🎉
              </span>
            )}
          </div>

          {/* Mini progress bar in header */}
          {totalTasks > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
              <div style={{ flex: 1, background: 'rgba(255,255,255,0.1)', borderRadius: '999px', height: '3px', maxWidth: '200px' }}>
                <div style={{
                  background: completedTasks === totalTasks ? '#4ade80' : 'rgba(255,255,255,0.5)',
                  height: '100%',
                  width: `${Math.round((completedTasks / totalTasks) * 100)}%`,
                  borderRadius: '999px',
                  transition: 'width 0.5s ease',
                }} />
              </div>
              <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>
                {completedTasks}/{totalTasks} tasks done
              </span>
            </div>
          )}
        </div>

        {/* Tab nav */}
        <div style={{ display: 'flex', gap: '0', padding: '20px 40px 0', overflowX: 'auto' }}>
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '10px 18px',
                fontSize: '13px',
                fontWeight: 500,
                background: 'transparent',
                border: 'none',
                borderBottom: `2px solid ${activeTab === tab.id ? 'white' : 'transparent'}`,
                color: activeTab === tab.id ? 'white' : 'rgba(255,255,255,0.4)',
                cursor: 'pointer',
                transition: 'all 0.15s',
                marginBottom: '-1px',
                fontFamily: 'inherit',
                whiteSpace: 'nowrap',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </header>

      {/* ── Content ─────────────────────────────────────────────── */}
      <main style={{ maxWidth: '760px', margin: '0 auto', padding: '40px 24px 80px' }}>
        {activeTab === 'questionnaire' && <PortalQuestionnaire booking={booking} />}
        {activeTab === 'checklist'     && <PortalTodo booking={booking} />}
        {activeTab === 'timeline'      && <PortalTimeline booking={booking} />}
        {activeTab === 'vendors'       && <PortalVendors booking={booking} />}
        {activeTab === 'documents'     && <PortalDocuments booking={booking} />}
        {activeTab === 'resources'     && <PortalResources booking={booking} />}
      </main>

      {/* ── Footer ──────────────────────────────────────────────── */}
      <footer style={{ borderTop: '1px solid #e0ddd8', padding: '18px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
        <p style={{ fontSize: '12px', color: '#aaa' }}>Caitee Smith Photography · Your wedding portal</p>
        <p style={{ fontSize: '12px', color: '#aaa' }}>
          Questions?{' '}
          <a href="mailto:hello@caiteesmith.com" style={{ color: '#5483a8', textDecoration: 'none' }}>hello@caiteesmith.com</a>
        </p>
      </footer>
    </div>
  )
}