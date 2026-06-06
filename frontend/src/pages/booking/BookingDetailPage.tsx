import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import AppShell from '@/components/layout/AppShell'
import { Badge, Card, Button } from '@/components/ui'
import { useBookingDetail, useToggleTask, useUpdateBooking } from '@/hooks/useData'
import type { Vendor } from '@/types'
import { DayOfSheet } from '@/components/booking/DayOfSheet'
import { WeatherWidget } from '@/components/ui/WeatherWidget'
import { SAMPLE_QUESTIONNAIRE_RESPONSE } from '@/data/questionnaire'
import ShotListTab from './ShotListTab'
import TimelineTab from './TimelineTab'
import BlogGeneratorTab from './BlogGeneratorTab'
import AddTaskForm from '@/components/forms/AddTaskForm'
import AddVendorForm from '@/components/forms/AddVendorForm'
import AddShotGroupForm from '@/components/forms/AddShotGroupForm'

function formatDate(dateStr: string) {
  const [year, month, day] = dateStr.split('-').map(Number)
  return new Date(year, month - 1, day).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
}

function daysUntil(dateStr: string) {
  const [year, month, day] = dateStr.split('-').map(Number)
  return Math.ceil((new Date(year, month - 1, day).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
}

type Tab = 'overview' | 'tasks' | 'timeline' | 'shotlist' | 'vendors' | 'blog'

const TABS: { id: Tab; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'tasks',    label: 'Tasks' },
  { id: 'timeline', label: 'Timeline' },
  { id: 'shotlist', label: 'Shot list' },
  { id: 'vendors',  label: 'Vendors' },
  { id: 'blog',     label: 'Blog post' },
]

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-sm">
      <span style={{ color: 'var(--color-navy-400)' }}>{label}</span>
      <span className="font-medium text-right" style={{ color: 'var(--color-navy-800)' }}>{value}</span>
    </div>
  )
}

// ── Input styles for edit mode ────────────────────────────────────

const iS = {
  width: '100%',
  background: 'var(--color-fog)',
  border: '1px solid var(--color-navy-200)',
  borderRadius: '6px',
  padding: '7px 10px',
  fontSize: '13px',
  color: 'var(--color-navy-800)',
  outline: 'none',
  fontFamily: 'inherit',
  boxSizing: 'border-box' as const,
}

const lS: React.CSSProperties = {
  display: 'block',
  fontSize: '10px',
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  color: 'var(--color-navy-400)',
  marginBottom: '4px',
  fontWeight: 600,
}

// ── Overview tab ──────────────────────────────────────────────────

function OverviewTab({ bookingId }: { bookingId: string }) {
  const { data } = useBookingDetail(bookingId)
  const updateBooking = useUpdateBooking()
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({
    partnerOneName: '',
    partnerTwoName: '',
    email: '',
    phone: '',
    weddingDate: '',
    venueName: '',
    venueAddress: '',
    venueLat: '',
    venueLng: '',
    packageName: '',
    packagePrice: '',
    hoursCovered: '',
    notes: '',
    partnerOneLegalName: '',
    partnerTwoLegalName: '',
    marriedSurname: '',
    mailingAddress: '',
    mailingCity: '',
    mailingState: '',
    mailingZip: '',
  })

  if (!data) return null

  function startEdit() {
    setForm({
      partnerOneName: data!.partnerOneName,
      partnerTwoName: data!.partnerTwoName,
      email:          data!.email,
      phone:          data!.phone ?? '',
      weddingDate:    data!.weddingDate,
      venueName:      data!.venueName,
      venueAddress:   data!.venueAddress ?? '',
      venueLat:       data!.venueLat ? String(data!.venueLat) : '',
      venueLng:       data!.venueLng ? String(data!.venueLng) : '',
      packageName:    data!.packageName ?? '',
      packagePrice:   data!.packagePrice ? String(data!.packagePrice) : '',
      hoursCovered:   data!.hoursCovered ? String(data!.hoursCovered) : '',
      notes:               data!.notes ?? '',
      partnerOneLegalName: (data as any).partnerOneLegalName ?? '',
      partnerTwoLegalName: (data as any).partnerTwoLegalName ?? '',
      marriedSurname:      (data as any).marriedSurname ?? '',
      mailingAddress:      (data as any).mailingAddress ?? '',
      mailingCity:         (data as any).mailingCity ?? '',
      mailingState:        (data as any).mailingState ?? '',
      mailingZip:          (data as any).mailingZip ?? '',
    })
    setEditing(true)
  }

  function handleSave() {
    updateBooking.mutate({
      id:           bookingId,
      partnerOneName: form.partnerOneName,
      partnerTwoName: form.partnerTwoName,
      email:        form.email,
      phone:        form.phone || undefined,
      weddingDate:  form.weddingDate,
      venueName:    form.venueName,
      venueAddress: form.venueAddress || undefined,
      venueLat:     form.venueLat ? parseFloat(form.venueLat) : undefined,
      venueLng:     form.venueLng ? parseFloat(form.venueLng) : undefined,
      packageName:  form.packageName || undefined,
      packagePrice: form.packagePrice ? parseFloat(form.packagePrice) : undefined,
      hoursCovered: form.hoursCovered ? parseFloat(form.hoursCovered) : undefined,
      notes:               form.notes || undefined,
      partnerOneLegalName: form.partnerOneLegalName || undefined,
      partnerTwoLegalName: form.partnerTwoLegalName || undefined,
      marriedSurname:      form.marriedSurname || undefined,
      mailingAddress:      form.mailingAddress || undefined,
      mailingCity:         form.mailingCity || undefined,
      mailingState:        form.mailingState || undefined,
      mailingZip:          form.mailingZip || undefined,
    }, { onSuccess: () => setEditing(false) })
  }

  function F({ label, field, type = 'text', placeholder, span2 }: {
    label: string; field: keyof typeof form; type?: string; placeholder?: string; span2?: boolean
  }) {
    return (
      <div style={span2 ? { gridColumn: 'span 2' } : {}}>
        <label style={lS}>{label}</label>
        <input
          type={type}
          value={form[field]}
          onChange={e => setForm(p => ({ ...p, [field]: e.target.value }))}
          placeholder={placeholder}
          style={iS}
        />
      </div>
    )
  }

  const completedTasks = data.tasks.filter(t => t.completed).length
  const totalTasks = data.tasks.length
  const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

  return (
    <div className="grid grid-cols-2 gap-6">

      {/* Wedding details card */}
      <Card className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs uppercase tracking-widest" style={{ color: 'var(--color-navy-400)' }}>Wedding details</h3>
          {editing ? (
            <div className="flex gap-2 items-center">
              <button
                onClick={handleSave}
                disabled={updateBooking.isPending}
                style={{ fontSize: '12px', fontWeight: 600, color: 'white', background: 'var(--color-navy-800)', border: 'none', borderRadius: '6px', padding: '4px 12px', cursor: 'pointer', fontFamily: 'inherit', opacity: updateBooking.isPending ? 0.7 : 1 }}
              >
                {updateBooking.isPending ? 'Saving...' : 'Save'}
              </button>
              <button
                onClick={() => setEditing(false)}
                style={{ fontSize: '12px', color: 'var(--color-navy-400)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={startEdit}
              style={{ fontSize: '12px', color: 'var(--color-navy-400)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
            >
              Edit
            </button>
          )}
        </div>

        {editing ? (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <F label="Partner 1"     field="partnerOneName" />
            <F label="Partner 2"     field="partnerTwoName" />
            <F label="Email"         field="email"       type="email" />
            <F label="Phone"         field="phone"       type="tel" />
            <F label="Wedding date"  field="weddingDate" type="date" />
            <F label="Package"       field="packageName" placeholder="e.g. Signature" />
            <F label="Venue name"    field="venueName"   span2 />
            <F label="Venue address" field="venueAddress" placeholder="123 Main St, City, State" span2 />
            <F label="Latitude"      field="venueLat"    placeholder="44.3793" />
            <F label="Longitude"     field="venueLng"    placeholder="-73.9799" />
            <F label="Price"         field="packagePrice" type="number" />
            <F label="Hours"         field="hoursCovered" type="number" />
            <div style={{ gridColumn: 'span 2' }}>
              <label style={lS}>Notes</label>
              <textarea
                value={form.notes}
                onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
                rows={3}
                style={{ ...iS, resize: 'vertical' }}
              />
            </div>
            <div style={{ gridColumn: 'span 2', borderTop: '1px solid var(--color-navy-100)', paddingTop: '10px' }}>
              <p style={{ fontSize: '10px', textTransform: 'uppercase' as const, letterSpacing: '0.08em', color: 'var(--color-navy-400)', fontWeight: 600, marginBottom: '10px' }}>Legal & address</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <F label="Partner 1 legal name" field="partnerOneLegalName" placeholder="As on ID" />
                <F label="Partner 2 legal name" field="partnerTwoLegalName" placeholder="As on ID" />
                <F label="Married surname" field="marriedSurname" span2 placeholder="e.g. Mitchell-Chen" />
                <F label="Street address" field="mailingAddress" span2 placeholder="123 Main St" />
                <F label="City" field="mailingCity" />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <F label="State" field="mailingState" placeholder="NY" />
                  <F label="ZIP" field="mailingZip" placeholder="12345" />
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <Row label="Date"    value={formatDate(data.weddingDate)} />
            <Row label="Venue"   value={data.venueName} />
            {data.venueAddress  && <Row label="Address" value={data.venueAddress} />}
            {data.packageName && (
              <Row
                label="Package"
                value={`${data.packageName}${data.packagePrice ? ' | $' + data.packagePrice.toLocaleString() : ''}`}
              />
            )}
            {data.hoursCovered  && <Row label="Coverage"   value={data.hoursCovered + 'h coverage'} />}
            {data.notes         && <Row label="Notes"   value={data.notes} />}
            {(data as any).partnerOneLegalName && <Row label="Legal name 1" value={(data as any).partnerOneLegalName} />}
            {(data as any).partnerTwoLegalName && <Row label="Legal name 2" value={(data as any).partnerTwoLegalName} />}
            {(data as any).marriedSurname      && <Row label="Married surname" value={(data as any).marriedSurname} />}
          </div>
        )}
      </Card>

      {/* Weather */}
      <div className="space-y-3">
        <h3 className="text-xs uppercase tracking-widest" style={{ color: 'var(--color-navy-400)' }}>Weather & light</h3>
        <WeatherWidget booking={data} compact={false} />
        {editing && (
          <p style={{ fontSize: '11px', color: 'var(--color-navy-400)', lineHeight: '1.5' }}>
            Add venue latitude & longitude to get live weather forecasts and accurate sunset times.
          </p>
        )}
      </div>

      {/* Milestone progress */}
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

// ── Tasks tab ─────────────────────────────────────────────────────

function TasksTab({ bookingId }: { bookingId: string }) {
  const { data } = useBookingDetail(bookingId)
  const toggleTask = useToggleTask()
  const [showAdd, setShowAdd] = useState(false)
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
      {showAdd
        ? <AddTaskForm bookingId={bookingId} onClose={() => setShowAdd(false)} />
        : <button onClick={() => setShowAdd(true)} style={{ fontSize: '13px', color: 'var(--color-navy-400)', background: 'none', border: '1px dashed var(--color-navy-200)', borderRadius: '8px', padding: '8px 16px', cursor: 'pointer', fontFamily: 'inherit', width: '100%' }}>+ Add task</button>
      }
    </div>
  )
}

// ── Vendors tab ───────────────────────────────────────────────────

function VendorsTab({ bookingId, vendors }: { bookingId: string; vendors: Vendor[] }) {
  const [showAdd, setShowAdd] = useState(false)
  return (
    <div className="space-y-2">
      <Card>
        <div>
          {vendors.length === 0 && (
            <div className="px-6 py-8 text-center">
              <p className="text-sm italic" style={{ color: 'var(--color-navy-400)' }}>No vendors added yet</p>
            </div>
          )}
          {vendors.map((vendor, i) => (
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
                {vendor.notes && <p className="text-xs italic mt-1" style={{ color: 'var(--color-navy-400)', marginLeft: '124px' }}>{vendor.notes}</p>}
              </div>
              <div className="flex items-center gap-4">
                {vendor.phone && (
                  <a href={'tel:' + vendor.phone} className="text-sm hover:opacity-70 transition-opacity" style={{ color: 'var(--color-steel-500)' }}>
                    📞 {vendor.phone}
                  </a>
                )}
                {vendor.email && (
                  <a href={'mailto:' + vendor.email} className="text-xs hover:opacity-70 transition-opacity" style={{ color: 'var(--color-steel-500)' }}>
                    {vendor.email}
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      </Card>
      {showAdd
        ? <AddVendorForm bookingId={bookingId} onClose={() => setShowAdd(false)} />
        : <button onClick={() => setShowAdd(true)} style={{ marginTop: '8px', fontSize: '13px', color: 'var(--color-navy-400)', background: 'none', border: '1px dashed var(--color-navy-200)', borderRadius: '8px', padding: '8px 16px', cursor: 'pointer', fontFamily: 'inherit', width: '100%' }}>+ Add vendor</button>
      }
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────

export default function BookingDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [activeTab, setActiveTab] = useState<Tab>('overview')
  const [showDayOf, setShowDayOf] = useState(false)
  const [showAddShotGroup, setShowAddShotGroup] = useState(false)
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

        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="font-display text-3xl italic" style={{ color: 'var(--color-navy-900)' }}>
              {data.partnerOneName} & {data.partnerTwoName}
            </h1>
            <p className="mt-1" style={{ color: 'var(--color-navy-500)' }}>{data.venueName} · {formatDate(data.weddingDate)}</p>
            <div className="flex items-center gap-3 mt-2">
              <Badge status={String(data.status)} />
              {days > 0 && <span className="text-xs" style={{ color: 'var(--color-navy-400)' }}>{days} {days === 1 ? 'day' : 'days'} away</span>}
              {days === 0 && <span className="text-xs font-medium" style={{ color: 'var(--color-gold-warm)' }}>Today! 🎉</span>}
              {days < 0 && <span className="text-xs" style={{ color: 'var(--color-navy-400)' }}>{Math.abs(days)} {Math.abs(days) === 1 ? 'day' : 'days'} since</span>}
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
                alert('Portal link copied!')
              }}
            >
              🔗 Copy portal link
            </Button>
            <Button variant="secondary" size="sm" onClick={() => setShowDayOf(true)}>
              📋 Day-of sheet
            </Button>
          </div>
        </div>

        {/* Outstanding tasks banner */}
        {outstandingTasks.length > 0 && (
          <div
            className="rounded-xl px-5 py-4 mb-6 flex items-start justify-between gap-6"
            style={{
              background: overdueTasks.length > 0 ? '#fef3e2' : 'var(--color-navy-50)',
              border: `1px solid ${overdueTasks.length > 0 ? 'var(--color-gold-soft)' : 'var(--color-navy-100)'}`,
            }}
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
                  </span>
                ))}
                {outstandingTasks.length > 3 && (
                  <span className="text-xs" style={{ color: 'var(--color-navy-400)' }}>+{outstandingTasks.length - 3} more</span>
                )}
              </div>
            </div>
            <button onClick={() => setActiveTab('tasks')} className="text-xs font-medium shrink-0 hover:opacity-70 transition-opacity" style={{ color: 'var(--color-steel-500)' }}>
              View all →
            </button>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-0 mb-8" style={{ borderBottom: '1px solid var(--color-navy-100)' }}>
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="px-4 py-2.5 text-sm font-medium border-b-2 transition-all -mb-px"
              style={{
                borderBottomColor: activeTab === tab.id ? 'var(--color-navy-800)' : 'transparent',
                color: activeTab === tab.id ? 'var(--color-navy-900)' : 'var(--color-navy-400)',
                background: 'none',
                border: 'none',
                borderBottom: `2px solid ${activeTab === tab.id ? 'var(--color-navy-800)' : 'transparent'}`,
                cursor: 'pointer',
                fontFamily: 'inherit',
                marginBottom: '-1px',
                padding: '10px 16px',
                fontSize: '14px',
                fontWeight: 500,
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="animate-fade-up">
          {activeTab === 'overview' && <OverviewTab bookingId={id ?? ''} />}
          {activeTab === 'tasks'    && <TasksTab bookingId={id ?? ''} />}
          {activeTab === 'timeline' && <TimelineTab bookingId={id ?? ''} initialTimeline={data.timeline} />}
          {activeTab === 'shotlist' && (
            <div>
              <ShotListTab bookingId={id ?? ''} initialGroups={data.shotListGroups} />
              {showAddShotGroup
                ? <AddShotGroupForm bookingId={id ?? ''} onClose={() => setShowAddShotGroup(false)} />
                : <button onClick={() => setShowAddShotGroup(true)} style={{ marginTop: '12px', fontSize: '13px', color: 'var(--color-navy-400)', background: 'none', border: '1px dashed var(--color-navy-200)', borderRadius: '8px', padding: '8px 16px', cursor: 'pointer', fontFamily: 'inherit', width: '100%' }}>+ Add shot group</button>
              }
            </div>
          )}
          {activeTab === 'vendors' && <VendorsTab bookingId={id ?? ''} vendors={data.vendors} />}
          {activeTab === 'blog'    && <BlogGeneratorTab booking={data} />}
        </div>
      </div>
    </AppShell>
  )
}