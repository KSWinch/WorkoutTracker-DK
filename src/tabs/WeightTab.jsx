import { useState } from 'react'
import { addMonths, formatMedium, monthGrid, monthKey, monthLabelLong, todayKey } from '../dates.js'

const WEEKDAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S']
const fmt = (n) => (Number.isInteger(n) ? String(n) : n.toFixed(1))

export default function WeightTab({ store }) {
  const { bodyWeight, unit, setBodyWeight } = store
  const today = todayKey()
  const [month, setMonth] = useState(monthKey(today))
  const [selected, setSelected] = useState(today)

  const changeMonth = (delta) => {
    const next = addMonths(month, delta)
    setMonth(next)
    setSelected(next === monthKey(today) ? today : `${next}-01`)
  }

  const inMonth = Object.keys(bodyWeight)
    .filter((k) => k.startsWith(month))
    .sort()
  const average = inMonth.length ? inMonth.reduce((sum, k) => sum + bodyWeight[k], 0) / inMonth.length : null
  const change = inMonth.length > 1 ? bodyWeight[inMonth[inMonth.length - 1]] - bodyWeight[inMonth[0]] : null

  const latestKey = Object.keys(bodyWeight).sort().pop()

  return (
    <main className="main">
      <h1 className="page-title">Body weight</h1>

      <div className="stat-row">
        <div className="stat">
          <span>Latest</span>
          <strong>{latestKey ? `${fmt(bodyWeight[latestKey])} ${unit}` : '—'}</strong>
        </div>
        <div className="stat">
          <span>Month avg</span>
          <strong>{average !== null ? `${fmt(Math.round(average * 10) / 10)} ${unit}` : '—'}</strong>
        </div>
        <div className="stat">
          <span>Month change</span>
          <strong className={change > 0 ? 'up' : change < 0 ? 'down' : ''}>
            {change !== null ? `${change > 0 ? '+' : ''}${fmt(Math.round(change * 10) / 10)} ${unit}` : '—'}
          </strong>
        </div>
      </div>

      <div className="nav cal-nav">
        <button className="icon-btn" onClick={() => changeMonth(-1)} aria-label="Previous month">‹</button>
        <div className="title"><h1>{monthLabelLong(month)}</h1></div>
        <button className="icon-btn" onClick={() => changeMonth(1)} aria-label="Next month">›</button>
      </div>

      <div className="cal">
        {WEEKDAYS.map((d, i) => (
          <span key={i} className="cal-head">{d}</span>
        ))}
        {monthGrid(month).map((key, i) =>
          key === null ? (
            <span key={`pad-${i}`} />
          ) : (
            <button
              key={key}
              className={`cal-day ${key === selected ? 'selected' : ''} ${key === today ? 'today' : ''}`}
              onClick={() => setSelected(key)}
            >
              <span className="num">{Number(key.slice(8))}</span>
              <span className="val">{bodyWeight[key] != null ? fmt(bodyWeight[key]) : ''}</span>
            </button>
          ),
        )}
      </div>

      <WeightEditor
        key={selected}
        dateKey={selected}
        value={bodyWeight[selected]}
        unit={unit}
        onSave={(v) => setBodyWeight(selected, v)}
        onClear={() => setBodyWeight(selected, null)}
      />
    </main>
  )
}

function WeightEditor({ dateKey, value, unit, onSave, onClear }) {
  const [text, setText] = useState(value != null ? String(value) : '')

  const submit = (e) => {
    e.preventDefault()
    const n = parseFloat(text)
    if (Number.isFinite(n) && n > 0) onSave(Math.round(n * 10) / 10)
  }

  return (
    <form className="card form weight-form" onSubmit={submit}>
      <label>
        {formatMedium(dateKey)}
        <div className="inline-form">
          <input value={text} onChange={(e) => setText(e.target.value)} inputMode="decimal" placeholder={`Weight (${unit})`} />
          <button type="submit" className="primary">Save</button>
        </div>
      </label>
      {value != null && (
        <button
          type="button"
          className="link danger"
          onClick={() => {
            onClear()
            setText('')
          }}
        >
          Clear this day
        </button>
      )}
    </form>
  )
}
