import { useQuery } from '@tanstack/react-query'

export interface WeatherData {
  date: string
  tempMax: number
  tempMin: number
  precipitation: number       // mm
  precipitationProbability: number // %
  weatherCode: number
  sunrise: string
  sunset: string
  uvIndex: number
}

// WMO weather code → description + emoji
export function describeWeather(code: number): { label: string; emoji: string } {
  if (code === 0)                    return { label: 'Clear sky',          emoji: '☀️' }
  if (code <= 2)                     return { label: 'Partly cloudy',      emoji: '⛅' }
  if (code === 3)                    return { label: 'Overcast',           emoji: '☁️' }
  if (code <= 49)                    return { label: 'Foggy',              emoji: '🌫️' }
  if (code <= 57)                    return { label: 'Drizzle',            emoji: '🌦️' }
  if (code <= 67)                    return { label: 'Rain',               emoji: '🌧️' }
  if (code <= 77)                    return { label: 'Snow',               emoji: '❄️' }
  if (code <= 82)                    return { label: 'Rain showers',       emoji: '🌦️' }
  if (code <= 86)                    return { label: 'Snow showers',       emoji: '🌨️' }
  if (code <= 99)                    return { label: 'Thunderstorm',       emoji: '⛈️' }
  return { label: 'Unknown', emoji: '🌡️' }
}


function to12h(hhmm: string): string {
  const [h, m] = hhmm.split(':').map(Number)
  const ampm = h < 12 ? 'am' : 'pm'
  const hour = h % 12 === 0 ? 12 : h % 12
  return `${hour}:${String(m).padStart(2, '0')}${ampm}`
}

export function useWeather(lat?: number, lng?: number, date?: string) {
  return useQuery({
    queryKey: ['weather', lat, lng, date],
    queryFn: async (): Promise<WeatherData | null> => {
      if (!lat || !lng || !date) return null

      // Only fetch if date is within 16 days (Open-Meteo forecast limit)
      const daysUntil = Math.ceil(
        (new Date(date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
      )
      if (daysUntil > 16 || daysUntil < 0) return null

      const params = new URLSearchParams({
        latitude: String(lat),
        longitude: String(lng),
        daily: [
          'temperature_2m_max',
          'temperature_2m_min',
          'precipitation_sum',
          'precipitation_probability_max',
          'weather_code',
          'sunrise',
          'sunset',
          'uv_index_max',
        ].join(','),
        temperature_unit: 'fahrenheit',
        wind_speed_unit: 'mph',
        timezone: 'auto',
        start_date: date,
        end_date: date,
      })

      const res = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`)
      if (!res.ok) throw new Error('Weather fetch failed')
      const data = await res.json()

      const d = data.daily
      return {
        date,
        tempMax: Math.round(d.temperature_2m_max[0]),
        tempMin: Math.round(d.temperature_2m_min[0]),
        precipitation: d.precipitation_sum[0],
        precipitationProbability: d.precipitation_probability_max[0],
        weatherCode: d.weather_code[0],
        sunrise: to12h(d.sunrise[0].split('T')[1]),
        sunset: to12h(d.sunset[0].split('T')[1]),
        uvIndex: d.uv_index_max[0],
      }
    },
    enabled: !!lat && !!lng && !!date,
    staleTime: 1000 * 60 * 30, // 30 min cache
  })
}

// ── Sunset calculator from coordinates ───────────────────────────
// Uses the SunCalc algorithm (Meeus, Astronomical Algorithms)
// Returns times in the browser's local timezone — close enough for
// venue-based planning when the photographer is in the same region.

function toRad(deg: number) { return (deg * Math.PI) / 180 }

export function calculateSunset(
  lat: number,
  lng: number,
  dateStr: string
): { sunrise: string; sunset: string; goldenHour: string } | null {
  try {
    // Julian date at noon UTC for the given date
    const date = new Date(dateStr + 'T12:00:00Z')
    const JD = date.getTime() / 86400000 + 2440587.5

    // Days since J2000.0
    const n = JD - 2451545.0

    // Mean longitude & mean anomaly
    const L0 = (280.46646 + 0.9856474 * n) % 360
    const M  = toRad((357.52911 + 0.9856003 * n) % 360)

    // Equation of center
    const C = 1.914602 * Math.sin(M) + 0.019993 * Math.sin(2 * M) + 0.000289 * Math.sin(3 * M)
    const sunLon = toRad(L0 + C)

    // Declination
    const obliq  = toRad(23.439 - 0.0000004 * n)
    const sinDec = Math.sin(obliq) * Math.sin(sunLon)
    const dec    = Math.asin(sinDec)

    // Equation of time (minutes)
    const y      = Math.tan(obliq / 2) ** 2
    const sinM   = Math.sin(M)
    const eqTime = 4 * toDeg(
      y * Math.sin(2 * toRad(L0))
      - 2 * 0.016708634 * sinM
      + 4 * 0.016708634 * y * sinM * Math.cos(2 * toRad(L0))
      - 0.5 * y * y * Math.sin(4 * toRad(L0))
      - 1.25 * 0.016708634 ** 2 * Math.sin(2 * M)
    )

    function toDeg(r: number) { return (r * 180) / Math.PI }

    // Hour angle for sunrise/sunset (solar zenith = 90.833°)
    const cosH =
      (Math.cos(toRad(90.833)) - sinDec * Math.sin(toRad(lat))) /
      (Math.cos(dec) * Math.cos(toRad(lat)))

    if (cosH < -1 || cosH > 1) return null // midnight sun / polar night

    const H = toDeg(Math.acos(cosH)) // degrees

    // Solar noon in minutes from midnight UTC
    const solarNoonUTC = 720 - 4 * lng - eqTime

    const sunriseUTC = solarNoonUTC - H * 4  // minutes from midnight UTC
    const sunsetUTC  = solarNoonUTC + H * 4

    // Convert UTC minutes to local Date, then format
    function utcMinToLocal(utcMin: number): string {
      const ms = date.getTime() - 12 * 3600 * 1000 + utcMin * 60 * 1000
      const d  = new Date(ms)
      let h    = d.getHours()
      const m  = d.getMinutes()
      const ampm = h < 12 ? 'am' : 'pm'
      h = h % 12 === 0 ? 12 : h % 12
      return `${h}:${String(m).padStart(2, '0')}${ampm}`
    }

    return {
      sunrise:    utcMinToLocal(sunriseUTC),
      sunset:     utcMinToLocal(sunsetUTC),
      goldenHour: utcMinToLocal(sunsetUTC - 40),
    }
  } catch {
    return null
  }
}