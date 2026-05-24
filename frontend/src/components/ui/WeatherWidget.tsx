import { useWeather, describeWeather, calculateSunset } from '@/hooks/useWeather'
import type { Booking } from '@/types'

interface WeatherWidgetProps {
  booking: Booking
  compact?: boolean  // compact = card for dashboard, full = overview tab
}

function daysUntil(dateStr: string) {
  return Math.ceil((new Date(dateStr).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
}

export function WeatherWidget({ booking, compact = false }: WeatherWidgetProps) {
  const days = daysUntil(booking.weddingDate)
  const canFetch = days >= 0 && days <= 16
  const hasCoords = !!booking.venueLat && !!booking.venueLng

  const { data: weather, isLoading } = useWeather(
    booking.venueLat ?? undefined,
    booking.venueLng ?? undefined,
    canFetch ? booking.weddingDate : undefined
  )

  const sunTimes = hasCoords
    ? calculateSunset(booking.venueLat!, booking.venueLng!, booking.weddingDate)
    : null

  // ── Too far out ───────────────────────────────────────────────
  if (!canFetch) {
    return (
      <div style={{
        background: 'var(--color-navy-50)',
        border: '1px solid var(--color-navy-100)',
        borderRadius: compact ? '10px' : '12px',
        padding: compact ? '12px 14px' : '18px 20px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: compact ? '20px' : '28px' }}>🌤</span>
          <div>
            <p style={{ fontSize: compact ? '12px' : '13px', fontWeight: 500, color: 'var(--color-navy-600)' }}>
              Forecast available {16 - days > 0 ? `in ${days - 16} days` : 'soon'}
            </p>
            {sunTimes && (
              <p style={{ fontSize: '11px', color: 'var(--color-navy-400)', marginTop: '2px' }}>
                🌅 Sunset ~{sunTimes.sunset} · ✨ Golden hour ~{sunTimes.goldenHour}
              </p>
            )}
          </div>
        </div>
      </div>
    )
  }

  // ── No coordinates ────────────────────────────────────────────
  if (!hasCoords) {
    return (
      <div style={{
        background: 'var(--color-navy-50)',
        border: '1px solid var(--color-navy-100)',
        borderRadius: compact ? '10px' : '12px',
        padding: compact ? '12px 14px' : '18px 20px',
      }}>
        <p style={{ fontSize: '12px', color: 'var(--color-navy-400)' }}>
          Add venue coordinates to see weather forecast and sunset times.
        </p>
      </div>
    )
  }

  // ── Loading ───────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div style={{
        background: 'var(--color-navy-50)',
        border: '1px solid var(--color-navy-100)',
        borderRadius: compact ? '10px' : '12px',
        padding: compact ? '12px 14px' : '18px 20px',
      }}>
        <p style={{ fontSize: '12px', color: 'var(--color-navy-400)' }}>Loading forecast...</p>
      </div>
    )
  }

  if (!weather) return null

  const { label, emoji } = describeWeather(weather.weatherCode)
  const rainRisk = weather.precipitationProbability
  const rainColor = rainRisk >= 60 ? '#b91c1c' : rainRisk >= 30 ? 'var(--color-gold-warm)' : '#276840'
  const rainBg   = rainRisk >= 60 ? '#fde8e8' : rainRisk >= 30 ? 'var(--color-gold-pale)' : '#e6f4ec'

  if (compact) {
    return (
      <div style={{
        background: 'white',
        border: '1px solid var(--color-navy-100)',
        borderRadius: '10px',
        padding: '12px 14px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        flexWrap: 'wrap',
      }}>
        <span style={{ fontSize: '24px' }}>{emoji}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-navy-800)', lineHeight: 1 }}>
            {weather.tempMax}°F · {label}
          </p>
          <p style={{ fontSize: '11px', color: 'var(--color-navy-400)', marginTop: '3px' }}>
            Low {weather.tempMin}°F
            {sunTimes && ` · 🌅 ${sunTimes.sunset} · ✨ ${sunTimes.goldenHour}`}
          </p>
        </div>
        <span style={{
          fontSize: '11px', fontWeight: 600, padding: '3px 8px', borderRadius: '20px',
          background: rainBg, color: rainColor, flexShrink: 0,
        }}>
          {rainRisk}% rain
        </span>
      </div>
    )
  }

  // ── Full card ─────────────────────────────────────────────────
  return (
    <div style={{
      background: 'white',
      border: '1px solid var(--color-navy-100)',
      borderRadius: '12px',
      overflow: 'hidden',
    }}>
      {/* Main weather row */}
      <div style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
        <span style={{ fontSize: '44px', lineHeight: 1 }}>{emoji}</span>
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: '28px', fontWeight: 700, color: 'var(--color-navy-900)', lineHeight: 1 }}>
            {weather.tempMax}°F
          </p>
          <p style={{ fontSize: '14px', color: 'var(--color-navy-500)', marginTop: '3px' }}>
            {label} · Low {weather.tempMin}°F
          </p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: '5px',
            fontSize: '13px', fontWeight: 600, padding: '5px 12px', borderRadius: '20px',
            background: rainBg, color: rainColor,
          }}>
            🌧 {rainRisk}% chance of rain
          </span>
          {rainRisk >= 30 && (
            <p style={{ fontSize: '11px', color: 'var(--color-navy-400)', marginTop: '4px' }}>
              {rainRisk >= 60 ? 'Have a rain plan ready' : 'Keep an eye on the forecast'}
            </p>
          )}
        </div>
      </div>

      {/* Sun times */}
      {sunTimes && (
        <div style={{
          borderTop: '1px solid var(--color-navy-100)',
          background: 'var(--color-gold-pale)',
          padding: '12px 20px',
          display: 'flex', gap: '24px', flexWrap: 'wrap',
        }}>
          <span style={{ fontSize: '13px', color: 'var(--color-gold-warm)', fontWeight: 500 }}>
            🌅 Sunrise {sunTimes.sunrise}
          </span>
          <span style={{ fontSize: '13px', color: 'var(--color-gold-warm)', fontWeight: 500 }}>
            🌇 Sunset {sunTimes.sunset}
          </span>
          <span style={{ fontSize: '13px', color: 'var(--color-gold-warm)', fontWeight: 500 }}>
            ✨ Golden hour from {sunTimes.goldenHour}
          </span>
        </div>
      )}

      {/* Detail row */}
      <div style={{
        borderTop: '1px solid var(--color-navy-100)',
        padding: '12px 20px',
        display: 'flex', gap: '20px', flexWrap: 'wrap',
      }}>
        {[
          { label: 'UV Index', value: String(weather.uvIndex) },
          { label: 'Precipitation', value: weather.precipitation > 0 ? `${weather.precipitation}mm` : 'None' },
        ].map(item => (
          <div key={item.label}>
            <p style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-navy-400)' }}>{item.label}</p>
            <p style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-navy-700)', marginTop: '2px' }}>{item.value}</p>
          </div>
        ))}
        <div style={{ marginLeft: 'auto' }}>
          <p style={{ fontSize: '10px', color: 'var(--color-navy-300)' }}>via Open-Meteo · updates every 30 min</p>
        </div>
      </div>
    </div>
  )
}