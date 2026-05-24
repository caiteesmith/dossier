import { useState } from 'react'
import AppShell from '@/components/layout/AppShell'
import { Badge, PageHeader, Button } from '@/components/ui'
import { useLeads, useUpdateLeadStatus } from '@/hooks/useData'
import type { Lead, LeadStatus } from '@/types'

const COLUMNS: { status: LeadStatus; label: string }[] = [
  { status: 'new',           label: 'New' },
  { status: 'contacted',     label: 'Contacted' },
  { status: 'proposal_sent', label: 'Proposal sent' },
  { status: 'negotiating',   label: 'Negotiating' },
  { status: 'booked',        label: 'Booked' },
]

function formatDate(dateStr?: string) {
  if (!dateStr) return null
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function LeadCard({ lead }: { lead: Lead }) {
  const updateStatus = useUpdateLeadStatus()
  return (
    <div className="rounded-xl p-4 space-y-3 hover:shadow-sm transition-shadow" style={{ background: 'white', border: '1px solid var(--color-navy-100)' }}>
      <div>
        <p className="font-medium text-sm" style={{ color: 'var(--color-navy-800)' }}>
          {lead.firstName} {lead.lastName}
          {lead.partnerName && <span className="font-normal" style={{ color: 'var(--color-navy-400)' }}> & {lead.partnerName}</span>}
        </p>
        {lead.weddingDate && (
          <p className="text-xs mt-0.5" style={{ color: 'var(--color-navy-400)' }}>{formatDate(lead.weddingDate)}</p>
        )}
      </div>
      {lead.venueName && <p className="text-xs" style={{ color: 'var(--color-navy-500)' }}>📍 {lead.venueName}</p>}
      {lead.budget && <p className="text-xs" style={{ color: 'var(--color-navy-500)' }}>💰 ${lead.budget.toLocaleString()} budget</p>}
      {lead.source && (
        <p className="text-xs" style={{ color: 'var(--color-navy-400)' }}>
          via {lead.source.replace(/_/g, ' ')}
          {lead.referralName && ` · ${lead.referralName}`}
        </p>
      )}
      {lead.notes && (
        <p className="text-xs italic line-clamp-2 pt-2" style={{ color: 'var(--color-navy-400)', borderTop: '1px solid var(--color-navy-100)' }}>
          {lead.notes}
        </p>
      )}
      <div className="flex gap-1 flex-wrap pt-1">
        {COLUMNS.filter(c => c.status !== lead.status).slice(0, 2).map(col => (
          <button
            key={col.status}
            onClick={() => updateStatus.mutate({ id: lead.id, status: col.status })}
            className="text-[10px] px-2 py-0.5 rounded transition-colors hover:opacity-80"
            style={{ color: 'var(--color-navy-400)', border: '1px solid var(--color-navy-200)' }}
          >
            → {col.label}
          </button>
        ))}
      </div>
    </div>
  )
}

export default function LeadsPage() {
  const { data: leads = [], isLoading } = useLeads()
  const [showLost, setShowLost] = useState(false)
  const activeLeads = leads.filter(l => showLost ? true : l.status !== 'lost')

  return (
    <AppShell>
      <div className="px-10 py-10">
        <PageHeader
          title="Lead pipeline"
          subtitle={`${leads.filter(l => l.status !== 'lost').length} active leads`}
          action={
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowLost(!showLost)}
                className="text-xs transition-colors hover:opacity-70"
                style={{ color: 'var(--color-navy-400)' }}
              >
                {showLost ? 'Hide lost' : 'Show lost'}
              </button>
              <Button size="sm">+ New lead</Button>
            </div>
          }
        />
        {isLoading ? (
          <div className="text-sm" style={{ color: 'var(--color-navy-400)' }}>Loading...</div>
        ) : (
          <div className="flex gap-4 overflow-x-auto pb-6">
            {COLUMNS.map(col => {
              const colLeads = activeLeads.filter(l => l.status === col.status)
              return (
                <div key={col.status} className="flex-shrink-0 w-64">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-medium uppercase tracking-widest" style={{ color: 'var(--color-navy-500)' }}>
                      {col.label}
                    </span>
                    <span className="text-xs rounded-full px-2 py-0.5" style={{ background: 'var(--color-navy-100)', color: 'var(--color-navy-500)' }}>
                      {colLeads.length}
                    </span>
                  </div>
                  <div className="space-y-3 min-h-32">
                    {colLeads.length === 0 ? (
                      <div className="rounded-xl h-24 flex items-center justify-center" style={{ border: '2px dashed var(--color-navy-200)' }}>
                        <span className="text-xs" style={{ color: 'var(--color-navy-300)' }}>empty</span>
                      </div>
                    ) : (
                      colLeads.map(lead => <LeadCard key={lead.id} lead={lead} />)
                    )}
                  </div>
                </div>
              )
            })}
            {showLost && (
              <div className="flex-shrink-0 w-64 opacity-50">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-medium uppercase tracking-widest" style={{ color: 'var(--color-navy-400)' }}>Lost</span>
                  <span className="text-xs rounded-full px-2 py-0.5" style={{ background: 'var(--color-navy-100)', color: 'var(--color-navy-400)' }}>
                    {leads.filter(l => l.status === 'lost').length}
                  </span>
                </div>
                <div className="space-y-3">
                  {leads.filter(l => l.status === 'lost').map(lead => <LeadCard key={lead.id} lead={lead} />)}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </AppShell>
  )
}