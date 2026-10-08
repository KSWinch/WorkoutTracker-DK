import { useMemo, useState } from 'react'
import { monthKey, monthLabel, monthLabelLong, todayKey } from '../dates.js'
import { checkInDays } from '../store.js'

const fmt = (n) => (Number.isInteger(n) ? String(n) : n.toFixed(1))

// Every weight I know about for an exercise becomes a dated point:
//  - weights on logged entries (dated by the day they were logged)
//  - weights set on the exercise in the Workouts tab (dated by when they were changed)
// Per month, the first point is what you "started at" and the last is your "current" weight.
function buildGroups(logs, types) {
  const typeById = new Map(types.map((t) => [t.id, t]))
  const groups = new Map()

  const group = (id, label) => {
    if (!groups.has(id)) groups.set(id, { id, label, exercises: new Map() })
    return groups.get(id)
  }
  const exercise = (g, name) => {
    const k = name.trim().toLowerCase()
    if (!g.exercises.has(k)) g.exercises.set(k, { name, planned: '', points: [] })
    return g.exercises.get(k)
  }
  const addPoint = (ex, day, ms, weight) => {
    const value = parseFloat(weight)
    if (Number.isFinite(value) && value > 0) ex.points.push({ day, ms, value })
  }

  // Seed from the templates so a type's exercises show up even before anything is logged.
  types.forEach((t) => {
    const g = group(t.id, t.name)
    t.exercises.forEach((e) => {
      if (e.kind === 'time') return // timed exercises have no weight to track
      const ex = exercise(g, e.name)
      ex.planned = e.weight
      ;(e.weightHistory ?? []).forEach((h) => addPoint(ex, h.day, h.at ?? 0, h.weight))
    })
  })

  Object.keys(logs)
    .sort()
    .forEach((day) => {
      logs[day].forEach((w) => {
        if (w.kind === 'time') return
        const type = typeById.get(w.typeId)
        const g = type ? group(type.id, type.name) : group('none', 'Other')
        const ex = exercise(g, w.name)
        ex.name = w.name
        addPoint(ex, day, w.weightAt ?? 0, w.weight)
      })
    })

  return [...groups.values()].filter((g) => g.exercises.size > 0)
}

export default function ProgressTab({ store }) {
  const { logs, types, unit } = store
  const [filter, setFilter] = useState('all')
  const groups = useMemo(() => buildGroups(logs, types), [logs, types])
  const shown = filter === 'all' ? groups : groups.filter((g) => g.id === filter)

  const month = monthKey(todayKey())
  const checkedIn = checkInDays(store, month).length

  return (
    <main className="main">
      <h1 className="page-title">Progress</h1>
      <p className="hint">Your weight for each exercise, month by month: where you started and where you are now.</p>

      <section className="card check-in-summary">
        <p className="eyebrow">Check-ins</p>
        <p className="check-in-count">{checkedIn}</p>
        <p className="notes tight">
          {checkedIn === 1 ? 'day' : 'days'} trained in {monthLabelLong(month)}
        </p>
      </section>

      {groups.length === 0 ? (
        <p className="empty">Log some workouts with weights and your progress will show up here.</p>
      ) : (
        <>
          <select className="filter" value={filter} onChange={(e) => setFilter(e.target.value)} aria-label="Workout type">
            <option value="all">All workout types</option>
            {groups.map((g) => (
              <option key={g.id} value={g.id}>{g.label}</option>
            ))}
          </select>

          {shown.map((g) => (
            <section key={g.id}>
              {filter === 'all' && <h2 className="group-title">{g.label}</h2>}
              <ul className="list">
                {[...g.exercises.values()].map((ex) => (
                  <ExerciseCard key={ex.name.toLowerCase()} ex={ex} unit={unit} />
                ))}
              </ul>
            </section>
          ))}
        </>
      )}
    </main>
  )
}

function ExerciseCard({ ex, unit }) {
  // Oldest first by day, then by when the weight was set; months come out in order.
  const byMonth = new Map()
  ;[...ex.points]
    .sort((a, b) => a.day.localeCompare(b.day) || a.ms - b.ms)
    .forEach((p) => {
      const month = p.day.slice(0, 7)
      const entry = byMonth.get(month)
      if (!entry) byMonth.set(month, { month, start: p.value, current: p.value })
      else entry.current = p.value
    })
  const months = [...byMonth.values()]
  const rows = months.slice(-6).reverse()

  const total = months.length ? months[months.length - 1].current - months[0].start : 0

  return (
    <li className="card">
      <div className="card-top">
        <h2>{ex.name}</h2>
        {(total !== 0 || months.length > 1) && (
          <span className={`delta ${total > 0 ? 'up' : total < 0 ? 'down' : ''}`}>
            {total > 0 ? '+' : ''}{fmt(Math.round(total * 10) / 10)} {unit} total
          </span>
        )}
      </div>

      {rows.length === 0 ? (
        <p className="notes">
          No weights logged yet{ex.planned ? ` · planned ${ex.planned} ${unit}` : ''}
        </p>
      ) : (
        <ul className="months">
          {rows.map((r) => (
            <li key={r.month}>
              <span>{monthLabel(r.month)}</span>
              <strong className="m-now">{fmt(r.current)} {unit}</strong>
              <span className="m-start">Started {fmt(r.start)}</span>
            </li>
          ))}
        </ul>
      )}
    </li>
  )
}
