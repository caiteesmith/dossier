import { useState } from 'react'
import { Card } from '@/components/ui'

// ── Exact port of compute_results() from codb_calculator.py ──────

interface CODBInputs {
  // Annual fixed costs
  insurance_annual: number
  software_annual: number
  website_annual: number
  accounting_legal_annual: number
  education_annual: number
  marketing_annual: number
  office_annual: number
  other_fixed_annual: number
  gear_replacement_annual: number
  // Volume
  weddings_per_year: number
  // Variable costs per wedding
  second_shooter_per_wedding: number
  assistant_per_wedding: number
  travel_per_wedding: number
  lodging_per_wedding: number
  meals_per_wedding: number
  delivery_packaging_per_wedding: number
  gallery_overages_per_wedding: number
  album_prints_per_wedding: number
  other_variable_per_wedding: number
  // Time per wedding (hours)
  inquiry_booking_hours: number
  planning_hours: number
  engagement_hours: number
  wedding_day_hours: number
  travel_hours: number
  culling_hours: number
  editing_hours: number
  export_upload_hours: number
  delivery_admin_hours: number
  blogging_vendor_hours: number
  // Income & pricing
  target_take_home_income_annual: number
  effective_tax_rate_pct: number
  target_profit_margin_pct: number
  current_avg_price_per_wedding: number
}

interface CODBResults {
  annual_fixed_costs: number
  annual_total_costs: number
  avg_variable_cost_per_wedding: number
  fixed_cost_allocation_per_wedding: number
  true_cost_per_wedding: number
  total_hours_per_wedding: number
  break_even_price_per_wedding_no_profit: number
  recommended_price_per_wedding_with_profit: number
  gross_profit_per_wedding_at_current_price: number
  net_profit_per_wedding_at_current_price: number
  effective_hourly_at_current_price: number
  weddings_needed_to_hit_income_goal_at_current_price: number
}

function nn(x: number) { return Math.max(0, x) }

function computeResults(inp: CODBInputs): CODBResults {
  const weddings = Math.max(1, Math.round(inp.weddings_per_year))

  const annual_fixed =
    nn(inp.insurance_annual) + nn(inp.software_annual) + nn(inp.website_annual) +
    nn(inp.accounting_legal_annual) + nn(inp.education_annual) + nn(inp.marketing_annual) +
    nn(inp.office_annual) + nn(inp.other_fixed_annual) + nn(inp.gear_replacement_annual)

  const avg_variable =
    nn(inp.second_shooter_per_wedding) + nn(inp.assistant_per_wedding) + nn(inp.travel_per_wedding) +
    nn(inp.lodging_per_wedding) + nn(inp.meals_per_wedding) + nn(inp.delivery_packaging_per_wedding) +
    nn(inp.gallery_overages_per_wedding) + nn(inp.album_prints_per_wedding) + nn(inp.other_variable_per_wedding)

  const fixed_alloc = annual_fixed / weddings
  const true_cost = avg_variable + fixed_alloc

  const total_hours =
    nn(inp.inquiry_booking_hours) + nn(inp.planning_hours) + nn(inp.engagement_hours) +
    nn(inp.wedding_day_hours) + nn(inp.travel_hours) + nn(inp.culling_hours) +
    nn(inp.editing_hours) + nn(inp.export_upload_hours) + nn(inp.delivery_admin_hours) +
    nn(inp.blogging_vendor_hours)

  const tax_rate = Math.max(0, Math.min(0.9, inp.effective_tax_rate_pct / 100))
  const target_take_home = nn(inp.target_take_home_income_annual)
  const required_pre_tax = tax_rate < 1 ? target_take_home / (1 - tax_rate) : target_take_home
  const income_per_wedding = required_pre_tax / weddings
  const break_even_no_profit = true_cost + income_per_wedding

  const profit_pct = Math.max(0, Math.min(95, inp.target_profit_margin_pct))
  const recommended_with_profit =
    profit_pct < 100 ? break_even_no_profit / (1 - profit_pct / 100) : break_even_no_profit

  const current_price = nn(inp.current_avg_price_per_wedding)
  const gross_profit_current = current_price - avg_variable
  const net_profit_current = current_price - true_cost
  const effective_hourly = total_hours > 0 ? net_profit_current / total_hours : 0
  const weddings_needed = net_profit_current > 0
    ? required_pre_tax / net_profit_current
    : Infinity

  return {
    annual_fixed_costs: annual_fixed,
    annual_total_costs: annual_fixed + avg_variable * weddings,
    avg_variable_cost_per_wedding: avg_variable,
    fixed_cost_allocation_per_wedding: fixed_alloc,
    true_cost_per_wedding: true_cost,
    total_hours_per_wedding: total_hours,
    break_even_price_per_wedding_no_profit: break_even_no_profit,
    recommended_price_per_wedding_with_profit: recommended_with_profit,
    gross_profit_per_wedding_at_current_price: gross_profit_current,
    net_profit_per_wedding_at_current_price: net_profit_current,
    effective_hourly_at_current_price: effective_hourly,
    weddings_needed_to_hit_income_goal_at_current_price: weddings_needed,
  }
}

// ── Defaults from _defaults() in your Python ─────────────────────

const DEFAULTS: CODBInputs = {
  insurance_annual: 900,
  software_annual: 900,
  website_annual: 350,
  accounting_legal_annual: 600,
  education_annual: 800,
  marketing_annual: 1200,
  office_annual: 0,
  other_fixed_annual: 300,
  gear_replacement_annual: 1500,
  weddings_per_year: 20,
  second_shooter_per_wedding: 450,
  assistant_per_wedding: 0,
  travel_per_wedding: 80,
  lodging_per_wedding: 0,
  meals_per_wedding: 30,
  delivery_packaging_per_wedding: 10,
  gallery_overages_per_wedding: 0,
  album_prints_per_wedding: 0,
  other_variable_per_wedding: 0,
  inquiry_booking_hours: 2,
  planning_hours: 3,
  engagement_hours: 0,
  wedding_day_hours: 8,
  travel_hours: 2,
  culling_hours: 3,
  editing_hours: 10,
  export_upload_hours: 1.5,
  delivery_admin_hours: 1,
  blogging_vendor_hours: 1,
  target_take_home_income_annual: 70000,
  effective_tax_rate_pct: 30,
  target_profit_margin_pct: 20,
  current_avg_price_per_wedding: 4500,
}

// ── UI helpers ────────────────────────────────────────────────────

const inputStyle = {
  width: '100%',
  background: 'var(--color-fog)',
  border: '1px solid var(--color-navy-100)',
  borderRadius: '8px',
  padding: '8px 12px',
  fontSize: '13px',
  color: 'var(--color-navy-800)',
  outline: 'none',
  fontFamily: 'inherit',
  boxSizing: 'border-box' as const,
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '11px',
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  color: 'var(--color-navy-400)',
  marginBottom: '4px',
  fontWeight: 500,
}

function money(x: number) {
  return '$' + Math.round(x).toLocaleString()
}

function NumInput({ label, value, onChange, step = 50, hint }: {
  label: string; value: number; onChange: (v: number) => void; step?: number; hint?: string
}) {
  return (
    <div>
      <label style={labelStyle}>{label}</label>
      <input
        type="number"
        value={value}
        min={0}
        step={step}
        onChange={e => onChange(parseFloat(e.target.value) || 0)}
        style={inputStyle}
      />
      {hint && <p style={{ fontSize: '11px', color: 'var(--color-navy-300)', marginTop: '3px', lineHeight: '1.4' }}>{hint}</p>}
    </div>
  )
}

function StatBox({ label, value, sub, highlight }: { label: string; value: string; sub?: string; highlight?: 'good' | 'warn' | 'bad' }) {
  const colors = { good: '#276840', warn: '#7a5c0a', bad: '#b91c1c' }
  return (
    <div style={{ background: 'white', borderRadius: '10px', padding: '14px 16px', border: `1px solid ${highlight ? colors[highlight] + '40' : 'var(--color-navy-100)'}` }}>
      <p style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-navy-400)', marginBottom: '4px' }}>{label}</p>
      <p style={{ fontSize: '20px', fontWeight: 700, color: highlight ? colors[highlight] : 'var(--color-navy-900)', lineHeight: 1 }}>{value}</p>
      {sub && <p style={{ fontSize: '11px', color: 'var(--color-navy-400)', marginTop: '3px' }}>{sub}</p>}
    </div>
  )
}

function Section({ title, children, defaultOpen = false }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div style={{ border: '1px solid var(--color-navy-100)', borderRadius: '10px', overflow: 'hidden', marginBottom: '8px' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{ width: '100%', padding: '12px 16px', background: open ? 'var(--color-navy-50)' : 'white', border: 'none', cursor: 'pointer', fontFamily: 'inherit', display: 'flex', justifyContent: 'space-between', alignItems: 'center', textAlign: 'left' }}
      >
        <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-navy-700)' }}>{title}</span>
        <span style={{ fontSize: '12px', color: 'var(--color-navy-400)', transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s', display: 'inline-block' }}>▾</span>
      </button>
      {open && (
        <div style={{ padding: '16px', background: 'white', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', borderTop: '1px solid var(--color-navy-100)' }}>
          {children}
        </div>
      )}
    </div>
  )
}

function FullWidthField({ children }: { children: React.ReactNode }) {
  return <div style={{ gridColumn: 'span 2' }}>{children}</div>
}

// ── Main component ────────────────────────────────────────────────

export default function CodbCalculatorTab() {
  const [inp, setInp] = useState<CODBInputs>({ ...DEFAULTS })
  const [resetKey, setResetKey] = useState(0)

  function set(field: keyof CODBInputs, value: number) {
    setInp(prev => ({ ...prev, [field]: value }))
  }

  function reset() {
    setInp({ ...DEFAULTS })
    setResetKey(k => k + 1)
  }

  const res = computeResults(inp)

  const delta = res.recommended_price_per_wedding_with_profit - inp.current_avg_price_per_wedding
  const isUnsustainable = res.net_profit_per_wedding_at_current_price <= 0
  const isLowHourly = res.effective_hourly_at_current_price < 35
  const hourlyHighlight: 'good' | 'warn' | 'bad' = isUnsustainable ? 'bad' : isLowHourly ? 'warn' : 'good'

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px', maxWidth: '1100px' }}>

      {/* ── LEFT: Inputs ─────────────────────────────────────────── */}
      <div key={resetKey}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--color-navy-800)' }}>CODB Calculator</h3>
            <p style={{ fontSize: '12px', color: 'var(--color-navy-400)', marginTop: '2px' }}>True cost per wedding, break-even, and effective hourly</p>
          </div>
          <button
            onClick={reset}
            style={{ fontSize: '12px', color: 'var(--color-navy-400)', background: 'none', border: '1px solid var(--color-navy-200)', borderRadius: '6px', padding: '5px 10px', cursor: 'pointer', fontFamily: 'inherit' }}
          >
            Reset defaults
          </button>
        </div>

        <Section title="Annual fixed costs" defaultOpen>
          <NumInput label="Insurance" value={inp.insurance_annual} onChange={v => set('insurance_annual', v)} />
          <NumInput label="Software stack" value={inp.software_annual} onChange={v => set('software_annual', v)} hint="LR, PS, gallery platform, CRM, etc." />
          <NumInput label="Website & domain" value={inp.website_annual} onChange={v => set('website_annual', v)} step={25} />
          <NumInput label="Accounting & legal" value={inp.accounting_legal_annual} onChange={v => set('accounting_legal_annual', v)} />
          <NumInput label="Education" value={inp.education_annual} onChange={v => set('education_annual', v)} />
          <NumInput label="Marketing baseline" value={inp.marketing_annual} onChange={v => set('marketing_annual', v)} />
          <NumInput label="Office / home office" value={inp.office_annual} onChange={v => set('office_annual', v)} />
          <NumInput label="Other fixed costs" value={inp.other_fixed_annual} onChange={v => set('other_fixed_annual', v)} />
          <FullWidthField>
            <NumInput label="Gear replacement / depreciation" value={inp.gear_replacement_annual} onChange={v => set('gear_replacement_annual', v)} step={100} hint="How much to set aside yearly to replace bodies and lenses over time." />
          </FullWidthField>
        </Section>

        <Section title="Wedding volume" defaultOpen>
          <FullWidthField>
            <NumInput label="Weddings per year" value={inp.weddings_per_year} onChange={v => set('weddings_per_year', Math.max(1, Math.round(v)))} step={1} />
          </FullWidthField>
        </Section>

        <Section title="Variable costs per wedding (averages)">
          <NumInput label="Second shooter" value={inp.second_shooter_per_wedding} onChange={v => set('second_shooter_per_wedding', v)} step={25} />
          <NumInput label="Assistant" value={inp.assistant_per_wedding} onChange={v => set('assistant_per_wedding', v)} step={25} />
          <NumInput label="Travel: gas/tolls/parking" value={inp.travel_per_wedding} onChange={v => set('travel_per_wedding', v)} step={10} />
          <NumInput label="Lodging" value={inp.lodging_per_wedding} onChange={v => set('lodging_per_wedding', v)} step={25} />
          <NumInput label="Meals" value={inp.meals_per_wedding} onChange={v => set('meals_per_wedding', v)} step={5} />
          <NumInput label="Delivery / packaging" value={inp.delivery_packaging_per_wedding} onChange={v => set('delivery_packaging_per_wedding', v)} step={5} />
          <NumInput label="Gallery hosting overages" value={inp.gallery_overages_per_wedding} onChange={v => set('gallery_overages_per_wedding', v)} step={5} />
          <NumInput label="Albums / prints costs" value={inp.album_prints_per_wedding} onChange={v => set('album_prints_per_wedding', v)} step={25} />
          <NumInput label="Other variable costs" value={inp.other_variable_per_wedding} onChange={v => set('other_variable_per_wedding', v)} step={10} />
        </Section>

        <Section title="Time per wedding (hours)">
          <NumInput label="Inquiry + booking admin" value={inp.inquiry_booking_hours} onChange={v => set('inquiry_booking_hours', v)} step={0.5} />
          <NumInput label="Planning (timeline, questionnaires, calls)" value={inp.planning_hours} onChange={v => set('planning_hours', v)} step={0.5} />
          <NumInput label="Engagement session (if included)" value={inp.engagement_hours} onChange={v => set('engagement_hours', v)} step={0.5} />
          <NumInput label="Wedding day coverage" value={inp.wedding_day_hours} onChange={v => set('wedding_day_hours', v)} step={0.5} />
          <NumInput label="Travel time" value={inp.travel_hours} onChange={v => set('travel_hours', v)} step={0.5} />
          <NumInput label="Culling" value={inp.culling_hours} onChange={v => set('culling_hours', v)} step={0.5} />
          <NumInput label="Editing" value={inp.editing_hours} onChange={v => set('editing_hours', v)} step={0.5} />
          <NumInput label="Export + upload" value={inp.export_upload_hours} onChange={v => set('export_upload_hours', v)} step={0.5} />
          <NumInput label="Delivery + admin follow-up" value={inp.delivery_admin_hours} onChange={v => set('delivery_admin_hours', v)} step={0.5} />
          <NumInput label="Blogging + vendor outreach" value={inp.blogging_vendor_hours} onChange={v => set('blogging_vendor_hours', v)} step={0.5} />
        </Section>

        <Section title="Income & pricing" defaultOpen>
          <FullWidthField>
            <NumInput
              label="Target take-home income (annual)"
              value={inp.target_take_home_income_annual}
              onChange={v => set('target_take_home_income_annual', v)}
              step={1000}
              hint="Your goal after taxes. The calculator grosses this up using the estimated tax rate."
            />
          </FullWidthField>
          <div style={{ gridColumn: 'span 2' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
              <label style={labelStyle}>Estimated effective tax rate</label>
              <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-navy-700)' }}>{inp.effective_tax_rate_pct}%</span>
            </div>
            <input type="range" min={10} max={45} step={1} value={inp.effective_tax_rate_pct} onChange={e => set('effective_tax_rate_pct', parseInt(e.target.value))} style={{ width: '100%', accentColor: 'var(--color-navy-800)' }} />
            <p style={{ fontSize: '11px', color: 'var(--color-navy-300)', marginTop: '3px' }}>Blended federal + state + self-employment. Estimate only.</p>
          </div>
          <div style={{ gridColumn: 'span 2' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
              <label style={labelStyle}>Target profit margin</label>
              <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-navy-700)' }}>{inp.target_profit_margin_pct}%</span>
            </div>
            <input type="range" min={0} max={60} step={1} value={inp.target_profit_margin_pct} onChange={e => set('target_profit_margin_pct', parseInt(e.target.value))} style={{ width: '100%', accentColor: 'var(--color-navy-800)' }} />
          </div>
          <FullWidthField>
            <NumInput label="Current average price per wedding" value={inp.current_avg_price_per_wedding} onChange={v => set('current_avg_price_per_wedding', v)} step={100} />
          </FullWidthField>
        </Section>
      </div>

      {/* ── RIGHT: Results ───────────────────────────────────────── */}
      <div className="space-y-5">
        <div>
          <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--color-navy-800)', marginBottom: '12px' }}>Results</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginBottom: '8px' }}>
            <StatBox label="True cost per wedding" value={money(res.true_cost_per_wedding)} />
            <StatBox label="Break-even (incl. taxes)" value={money(res.break_even_price_per_wedding_no_profit)} />
            <StatBox label="Recommended (with profit)" value={money(res.recommended_price_per_wedding_with_profit)} highlight="good" />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
            <StatBox label="Hours per wedding" value={`${res.total_hours_per_wedding.toFixed(1)} hrs`} />
            <StatBox label="Net profit per wedding" value={money(res.net_profit_per_wedding_at_current_price)} highlight={isUnsustainable ? 'bad' : 'good'} />
            <StatBox label="Effective hourly" value={`$${Math.round(res.effective_hourly_at_current_price)}/hr`} highlight={hourlyHighlight} />
          </div>
        </div>

        {/* Insight */}
        <div style={{
          padding: '14px 16px',
          borderRadius: '10px',
          background: isUnsustainable ? '#fde8e8' : isLowHourly ? 'var(--color-gold-pale)' : '#e6f4ec',
          border: `1px solid ${isUnsustainable ? '#fca5a5' : isLowHourly ? '#e8d48a' : '#86efac'}`,
        }}>
          {isUnsustainable ? (
            <p style={{ fontSize: '13px', color: '#b91c1c', lineHeight: '1.5' }}>
              At your current average price, you're not covering your total costs after fixed-cost allocation. Your fixed costs may be too high for your volume, your time may be undercounted, or pricing needs to move.
            </p>
          ) : isLowHourly ? (
            <p style={{ fontSize: '13px', color: '#7a5c0a', lineHeight: '1.5' }}>
              Your effective hourly at your current price is <strong>${Math.round(res.effective_hourly_at_current_price)}/hr</strong>. Your quickest levers are pricing, outsourcing editing, or increasing volume.
            </p>
          ) : (
            <p style={{ fontSize: '13px', color: '#276840', lineHeight: '1.5' }}>
              This looks sustainable on paper. Sanity-check your time estimates and seasonal workload.
            </p>
          )}
        </div>

        {/* Recommended vs current */}
        <Card className="p-4">
          <p style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-navy-400)', marginBottom: '8px' }}>Recommended vs your current price</p>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px' }}>
            <span style={{ fontSize: '28px', fontWeight: 700, color: 'var(--color-navy-900)' }}>{money(res.recommended_price_per_wedding_with_profit)}</span>
            <span style={{ fontSize: '14px', fontWeight: 600, color: delta >= 0 ? '#b91c1c' : '#276840' }}>
              {delta >= 0 ? '+' : ''}{money(delta)} vs current
            </span>
          </div>
          <p style={{ fontSize: '12px', color: 'var(--color-navy-400)', marginTop: '4px' }}>
            Based on a {inp.target_profit_margin_pct}% target profit margin.
          </p>
          {res.weddings_needed_to_hit_income_goal_at_current_price === Infinity ? (
            <p style={{ fontSize: '12px', color: '#b91c1c', marginTop: '8px' }}>
              At current pricing, the model can't reach your income goal (net profit per wedding is 0 or negative).
            </p>
          ) : (
            <p style={{ fontSize: '12px', color: 'var(--color-navy-500)', marginTop: '8px' }}>
              Estimated weddings needed to hit your income goal at current pricing: <strong>{res.weddings_needed_to_hit_income_goal_at_current_price.toFixed(1)}</strong>
            </p>
          )}
        </Card>

        {/* Breakdowns */}
        <Card className="p-4">
          <p style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-navy-400)', marginBottom: '10px' }}>Cost breakdown</p>
          {[
            { label: 'Annual fixed costs',          value: res.annual_fixed_costs },
            { label: 'Annual variable costs',       value: res.avg_variable_cost_per_wedding * inp.weddings_per_year },
            { label: 'Annual total costs',          value: res.annual_total_costs },
          ].map(row => (
            <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid var(--color-navy-50)', fontSize: '13px' }}>
              <span style={{ color: 'var(--color-navy-500)' }}>{row.label}</span>
              <span style={{ fontWeight: 600, color: 'var(--color-navy-800)' }}>{money(row.value)}</span>
            </div>
          ))}
          <div style={{ height: '8px' }} />
          {[
            { label: 'Fixed allocation per wedding',  value: res.fixed_cost_allocation_per_wedding },
            { label: 'Avg variable cost per wedding', value: res.avg_variable_cost_per_wedding },
            { label: 'True cost per wedding',         value: res.true_cost_per_wedding },
          ].map(row => (
            <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid var(--color-navy-50)', fontSize: '13px' }}>
              <span style={{ color: 'var(--color-navy-500)' }}>{row.label}</span>
              <span style={{ fontWeight: 600, color: 'var(--color-navy-800)' }}>{money(row.value)}</span>
            </div>
          ))}
        </Card>

        {/* Hours breakdown */}
        <Card className="p-4">
          <p style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-navy-400)', marginBottom: '10px' }}>
            Hours per wedding — {res.total_hours_per_wedding.toFixed(1)} total
          </p>
          {[
            ['Inquiry + booking',    inp.inquiry_booking_hours],
            ['Planning',             inp.planning_hours],
            ['Engagement',           inp.engagement_hours],
            ['Wedding day',          inp.wedding_day_hours],
            ['Travel',               inp.travel_hours],
            ['Culling',              inp.culling_hours],
            ['Editing',              inp.editing_hours],
            ['Export + upload',      inp.export_upload_hours],
            ['Delivery + admin',     inp.delivery_admin_hours],
            ['Blogging + vendors',   inp.blogging_vendor_hours],
          ].filter(([, v]) => (v as number) > 0).map(([label, hours]) => {
            const pct = res.total_hours_per_wedding > 0 ? ((hours as number) / res.total_hours_per_wedding) * 100 : 0
            return (
              <div key={label as string} style={{ marginBottom: '6px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '3px' }}>
                  <span style={{ color: 'var(--color-navy-500)' }}>{label as string}</span>
                  <span style={{ fontWeight: 500, color: 'var(--color-navy-700)' }}>{(hours as number).toFixed(1)} hrs</span>
                </div>
                <div style={{ background: 'var(--color-navy-100)', borderRadius: '999px', height: '4px', overflow: 'hidden' }}>
                  <div style={{ background: 'var(--color-navy-600)', height: '100%', width: `${pct}%`, borderRadius: '999px' }} />
                </div>
              </div>
            )
          })}
        </Card>
      </div>
    </div>
  )
}