import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import AppShell from '@/components/layout/AppShell'
import { Badge, Card, Button } from '@/components/ui'
import { useBookingDetail, useToggleTask } from '@/hooks/useData'
import { DayOfSheet } from '@/components/booking/DayOfSheet'
import { SAMPLE_QUESTIONNAIRE_RESPONSE } from '@/data/questionnaire'
import ShotListTab from './ShotListTab'
import TimelineTab from './TimelineTab'

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
}

function daysUntil(dateStr: string) {
  const diff = new Date(dateStr).getTime() - new Date().getTime()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

type Tab = 'overview' | 'tasks' | 'timeline' | 'shotlist' | 'vendors'

const TABS: { id: Tab; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'tasks',    label: 'Tasks' },
  { id: 'timeline', label: 'Timeline' },
  { id: 'shotlist', label: 'Shot list' },
  { id: 'vendors',  label: 'Vendors' },
]

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-sm">
      <span style={{ color: 'var(--color-navy-400)' }}>{label}</span>
      <span className="font-medium text-right" style={{ color: 'var(--color-navy-800)' }}>{value}</span>
    </div>
  )
}

function OverviewTab({ bookingId }: { bookingId: string }) {
  const { data } = useBookingDetail(bookingId)
  if (!data) return null
  const completedTasks = data.tasks.filter(t => t.completed).length
  const totalTasks = data.tasks.length
  const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

  return (
    <div className="grid grid-cols-2 gap-6">
      <Card className="p-6 space-y-4">
        <h3 className="text-xs uppercase tracking-widest" style={{ color: 'var(--color-navy-400)' }}>Wedding details</h3>
        <div className="space-y-3">
          <Row label="Date" value={formatDate(data.weddingDate)} />
          <Row label="Venue" value={data.venueName} />
          {data.venueAddress && <Row label="Address" value={data.venueAddress} />}
          {data.packageName && <Row label="Package" value={data.packageName} />}
          {data.packagePrice && <Row label="Price" value={"$" + data.packagePrice.toLocaleString()} />}
          {data.hoursCovered && <Row label="Hours" value={data.hoursCovered + "h coverage"} />}
        </div>
      </Card>

      <Card className="p-6 space-y-4">
        <h3 className="text-xs uppercase tracking-widest" style={{ color: 'var(--color-navy-400)' }}>Light & weather</h3>
        {data.timeline?.sunsetTime ? (
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span style={{ color: 'var(--color-navy-400)' }}>Sunset</span>
              <span className="font-medium" style={{ color: 'var(--color-gold-warm)' }}>🌅 {data.timeline.sunsetTime}</span>
            </div>
            <div className="flex justify-between">
              <span style={{ color: 'var(--color-navy-400)' }}>Golden hour</span>
              <span className="font-medium" style={{ color: 'var(--color-gold-warm)' }}>✨ {data.timeline.goldenHourTime}</span>
            </div>
            <div className="mt-4 p-3 rounded-lg" style={{ background: 'var(--color-gold-pale)' }}>
              <p className="text-xs" style={{ color: 'var(--color-gold-warm)' }}>
                Plan couple portraits no later than {data.timeline.goldenHourTime} for best light.
              </p>
            </div>
          </div>
        ) : (
          <p className="text-sm italic" style={{ color: 'var(--color-navy-400)' }}>Build your timeline to calculate sunset time.</p>
        )}
      </Card>

      <Card className="p-6 col-span-2">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs uppercase tracking-widest" style={{ color: 'var(--color-navy-400)' }}>Milestone progress</h3>
          <span className="text-sm font-medium" style={{ color: 'var(--color-navy-700)' }}>{completedTasks} / {totalTasks} complete</span>
        </div>
        <div className="w-full rounded-full h-1.5 mb-4" style={{ background: 'var(--color-navy-100)' }}>
          <div className="h-1.5 rounded-full transition-all duration-500" style={{ width: progress + '%', background: 'var(--color-navy-700)' }} />
        </div>
        <div className="grid grid-cols-2 gap-2">
          {data.tasks.slice(0, 6).map(task => (
            <div key={task.id} className="flex items-center gap-2 text-sm">
              <span style={{ color: task.completed ? '#276840' : 'var(--color-navy-300)' }}>
                {task.completed ? '✓' : '○'}
              </span>
              <span style={{ color: task.completed ? 'var(--color-navy-400)' : 'var(--color-navy-700)', textDecoration: task.completed ? 'line-through' : 'none' }}>
                {task.title}
              </span>
            </div>
          ))}
        </div>
        {data.notes && (
          <div className="mt-4 pt-4" style={{ borderTop: '1px solid var(--color-navy-100)' }}>
            <p className="text-xs uppercase tracking-widest mb-1" style={{ color: 'var(--color-navy-400)' }}>Notes</p>
            <p className="text-sm italic" style={{ color: 'var(--color-navy-600)' }}>{data.notes}</p>
          </div>
        )}
      </Card>
    </div>
  )
}

function TasksTab({ bookingId }: { bookingId: string }) {
  const { data } = useBookingDetail(bookingId)
  const toggleTask = useToggleTask()
  if (!data) return null

  const categories = ['admin', 'client', 'day_of', 'post_wedding', 'manual'] as const
  const categoryLabels: Record<string, string> = {
    admin: 'Admin', client: 'Client', day_of: 'Day of', post_wedding: 'Post wedding', manual: 'Custom',
  }

  return (
    <div className="space-y-6">
      {categories.map(cat => {
        const tasks = data.tasks.filter(t => t.category === cat)
        if (tasks.length === 0) return null
        return (
          <div key={cat}>
            <h3 className="text-xs uppercase tracking-widest mb-3" style={{ color: 'var(--color-navy-400)' }}>
              {categoryLabels[cat]}
            </h3>
            <Card>
              <div>
                {tasks.map((task, i) => (
                  <label
                    key={task.id}
                    className="flex items-center gap-3 px-5 py-3.5 cursor-pointer transition-colors"
                    style={{ borderTop: i === 0 ? 'none' : '1px solid var(--color-navy-100)' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-fog)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    <input
                      type="checkbox"
                      checked={task.completed}
                      onChange={e => toggleTask.mutate({ bookingId, taskId: task.id, completed: e.target.checked })}
                      className="w-4 h-4 rounded"
                    />
                    <span className="text-sm flex-1" style={{
                      color: task.completed ? 'var(--color-navy-400)' : 'var(--color-navy-800)',
                      textDecoration: task.completed ? 'line-through' : 'none',
                    }}>
                      {task.title}
                    </span>
                    {task.dueDate && (
                      <span className="text-xs" style={{ color: 'var(--color-navy-400)' }}>
                        due {new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                    )}
                  </label>
                ))}
              </div>
            </Card>
          </div>
        )
      })}
      <Button variant="secondary" size="sm">+ Add task</Button>
    </div>
  )
}



function VendorsTab({ bookingId }: { bookingId: string }) {
  const { data } = useBookingDetail(bookingId)
  if (!data) return null
  return (
    <div className="space-y-4">
      <Card>
        <div>
          {data.vendors.map((vendor, i) => (
            <div
              key={vendor.id}
              className="flex items-center justify-between px-6 py-4"
              style={{ borderTop: i === 0 ? 'none' : '1px solid var(--color-navy-100)' }}
            >
              <div>
                <div className="flex items-center gap-3">
                  <span className="text-xs uppercase tracking-widest w-28 shrink-0" style={{ color: 'var(--color-navy-400)' }}>{vendor.role}</span>
                  <span className="text-sm font-medium" style={{ color: 'var(--color-navy-800)' }}>{vendor.name}</span>
                </div>
                {vendor.notes && <p className="text-xs italic mt-1 ml-31" style={{ color: 'var(--color-navy-400)' }}>{vendor.notes}</p>}
              </div>
              <div className="flex items-center gap-4">
                {vendor.phone && (
                  <a href={"tel:" + vendor.phone} className="text-sm hover:opacity-70 transition-opacity" style={{ color: 'var(--color-steel-500)' }}>
                    📞 {vendor.phone}
                  </a>
                )}
                {vendor.email && (
                  <a href={"mailto:" + vendor.email} className="text-xs hover:opacity-70 transition-opacity" style={{ color: 'var(--color-steel-500)' }}>
                    {vendor.email}
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      </Card>
      <Button variant="secondary" size="sm">+ Add vendor</Button>
    </div>
  )
}

export default function BookingDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [activeTab, setActiveTab] = useState<Tab>('overview')
  const [showDayOf, setShowDayOf] = useState(false)
  const { data, isLoading } = useBookingDetail(id ?? '')

  if (isLoading) {
    return <AppShell><div className="px-10 py-10 text-sm" style={{ color: 'var(--color-navy-400)' }}>Loading...</div></AppShell>
  }

  if (!data) {
    return (
      <AppShell>
        <div className="px-10 py-10">
          <p style={{ color: 'var(--color-navy-400)' }}>Booking not found.</p>
          <Link to="/bookings" className="text-sm mt-2 inline-block hover:opacity-70" style={{ color: 'var(--color-steel-500)' }}>← Back to bookings</Link>
        </div>
      </AppShell>
    )
  }
  const days = daysUntil(data.weddingDate)
  const completedTasks = data.tasks.filter(t => t.completed).length
  const outstandingTasks = data.tasks.filter(t => !t.completed)
  const overdueTasks = outstandingTasks.filter(t => t.dueDate && new Date(t.dueDate) < new Date())
  const upcomingTasks = outstandingTasks.filter(t => !t.dueDate || new Date(t.dueDate) >= new Date()).slice(0, 3)

  return (
    <AppShell>
      <div className="px-10 py-10 max-w-4xl">
        <Link to="/bookings" className="text-xs mb-6 inline-block hover:opacity-70 transition-opacity" style={{ color: 'var(--color-navy-400)' }}>
          ← Bookings
        </Link>

        {showDayOf && <DayOfSheet booking={data} answers={SAMPLE_QUESTIONNAIRE_RESPONSE} onClose={() => setShowDayOf(false)} />}

        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="font-display text-3xl italic" style={{ color: 'var(--color-navy-900)' }}>
              {data.partnerOneName} & {data.partnerTwoName}
            </h1>
            <p className="mt-1" style={{ color: 'var(--color-navy-500)' }}>{data.venueName} · {formatDate(data.weddingDate)}</p>
            <div className="flex items-center gap-3 mt-2">
              <Badge status={data.status} />
              {days > 0 && <span className="text-xs" style={{ color: 'var(--color-navy-400)' }}>{days} days away</span>}
              {days === 0 && <span className="text-xs font-medium" style={{ color: 'var(--color-gold-warm)' }}>Today! 🎉</span>}
              <span className="text-xs" style={{ color: 'var(--color-navy-400)' }}>{completedTasks}/{data.tasks.length} tasks done</span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                const url = window.location.origin + '/portal/' + data.portalToken
                navigator.clipboard.writeText(url)
                alert('Portal link copied to clipboard!')
              }}
            >
              🔗 Copy portal link
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setShowDayOf(true)}
            >
              📋 Day-of sheet
            </Button>
          </div>
        </div>

        {/* Outstanding tasks banner */}
        {outstandingTasks.length > 0 && (
          <div className="rounded-xl px-5 py-4 mb-6 flex items-start justify-between gap-6"
            style={{ background: overdueTasks.length > 0 ? '#fef3e2' : 'var(--color-navy-50)', border: `1px solid ${overdueTasks.length > 0 ? 'var(--color-gold-soft)' : 'var(--color-navy-100)'}` }}
          >
            <div className="flex-1">
              <p className="text-xs font-medium uppercase tracking-widest mb-2" style={{ color: overdueTasks.length > 0 ? 'var(--color-gold-warm)' : 'var(--color-navy-500)' }}>
                {overdueTasks.length > 0 ? `⚠ ${overdueTasks.length} overdue · ` : ''}{outstandingTasks.length} tasks remaining
              </p>
              <div className="flex flex-wrap gap-x-4 gap-y-1">
                {upcomingTasks.map(task => (
                  <span key={task.id} className="text-xs flex items-center gap-1.5" style={{ color: 'var(--color-navy-600)' }}>
                    <span style={{ color: 'var(--color-navy-300)' }}>○</span>
                    {task.title}
                    {task.dueDate && (
                      <span style={{ color: 'var(--color-navy-400)' }}>
                        · due {new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                    )}
                  </span>
                ))}
                {outstandingTasks.length > 3 && (
                  <span className="text-xs" style={{ color: 'var(--color-navy-400)' }}>+{outstandingTasks.length - 3} more</span>
                )}
              </div>
            </div>
            <button
              onClick={() => setActiveTab('tasks')}
              className="text-xs font-medium shrink-0 hover:opacity-70 transition-opacity"
              style={{ color: 'var(--color-steel-500)' }}
            >
              View all →
            </button>
          </div>
        )}

        <div className="flex gap-0 mb-8" style={{ borderBottom: '1px solid var(--color-navy-100)' }}>
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="px-4 py-2.5 text-sm font-medium border-b-2 transition-all -mb-px"
              style={{
                borderBottomColor: activeTab === tab.id ? 'var(--color-navy-800)' : 'transparent',
                color: activeTab === tab.id ? 'var(--color-navy-900)' : 'var(--color-navy-400)',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="animate-fade-up">
          {activeTab === 'overview' && <OverviewTab bookingId={id ?? ''} />}
          {activeTab === 'tasks'    && <TasksTab bookingId={id ?? ''} />}
          {activeTab === 'timeline' && <TimelineTab bookingId={id ?? ''} initialTimeline={data.timeline} />}
          {activeTab === 'shotlist' && <ShotListTab bookingId={id ?? ''} initialGroups={data.shotListGroups} />}
          {activeTab === 'vendors'  && <VendorsTab bookingId={id ?? ''} />}
        </div>
      </div>
    </AppShell>
  )
}