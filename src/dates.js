const pad = (n) => String(n).padStart(2, '0')

export const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

// Local-time YYYY-MM-DD key (avoids the UTC shift of toISOString).
export const toKey = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`

export const fromKey = (key) => {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export const todayKey = () => toKey(new Date())

export const addDays = (key, n) => {
  const d = fromKey(key)
  d.setDate(d.getDate() + n)
  return toKey(d)
}

// 0 = Monday ... 6 = Sunday. The weekly plan is indexed this way.
export const dayIndex = (key) => (fromKey(key).getDay() + 6) % 7

// Monday-start week containing `key`.
export const weekOf = (key) => {
  const start = addDays(key, -dayIndex(key))
  return Array.from({ length: 7 }, (_, i) => addDays(start, i))
}

export const formatLong = (key) =>
  fromKey(key).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })

export const formatMedium = (key) =>
  fromKey(key).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })

export const weekdayShort = (key) => fromKey(key).toLocaleDateString(undefined, { weekday: 'short' })
export const dayNumber = (key) => fromKey(key).getDate()

// Month keys look like "2026-09".
export const monthKey = (key) => key.slice(0, 7)

const monthDate = (mk) => {
  const [y, m] = mk.split('-').map(Number)
  return new Date(y, m - 1, 1)
}

export const monthLabel = (mk) => monthDate(mk).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })
export const monthLabelLong = (mk) => monthDate(mk).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })

export const addMonths = (mk, n) => {
  const d = monthDate(mk)
  d.setMonth(d.getMonth() + n)
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`
}

// Timestamps (ms since epoch) for workout start/end.
export const formatTime = (ms) => new Date(ms).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
export const formatTime24 = (ms) => new Date(ms).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })
export const formatTime12 = (ms) => new Date(ms).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })

// Live elapsed display: h:mm:ss
export const formatClock = (ms) => {
  const total = Math.max(0, Math.floor(ms / 1000))
  const h = Math.floor(total / 3600)
  return `${h}:${pad(Math.floor((total % 3600) / 60))}:${pad(total % 60)}`
}

// Final duration: "1 h 12 min", "45 min", or "30 sec" for very short sessions.
export const formatDuration = (ms) => {
  if (ms < 60000) return `${Math.max(0, Math.round(ms / 1000))} sec`
  const totalMin = Math.round(ms / 60000)
  const h = Math.floor(totalMin / 60)
  const m = totalMin % 60
  return h ? `${h} h ${m} min` : `${m} min`
}

// Day keys for a month, Monday-start, with leading nulls to align the first day.
export const monthGrid = (mk) => {
  const first = monthDate(mk)
  const lead = (first.getDay() + 6) % 7
  const count = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate()
  return [...Array(lead).fill(null), ...Array.from({ length: count }, (_, i) => `${mk}-${pad(i + 1)}`)]
}
