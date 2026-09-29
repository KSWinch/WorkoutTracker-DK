import { useRef, useState } from 'react'
import { DAY_NAMES, dayIndex, todayKey } from '../dates.js'
import { buildPlanFile, parsePlanFile, saveJsonFile } from '../planFile.js'
import { lastTrainedByType, recoveryStage } from '../recovery.js'
import { isCheckedIn } from '../store.js'

export default function PlanTab({ store, goTo }) {
  const { types, plan, logs, setPlanDay, importPlan } = store
  const today = todayKey()
  const todayIdx = dayIndex(today)
  // Only a day you checked in on resets a workout's recovery clock.
  const lastTrained = lastTrainedByType(logs, (day) => isCheckedIn(store, day))
  const fileInput = useRef(null)
  const [message, setMessage] = useState(null) // { ok: boolean, text: string }

  const exportPlan = async () => {
    try {
      await saveJsonFile(`workout-plan-${todayKey()}.json`, buildPlanFile({ types, plan }))
      setMessage(null)
    } catch (err) {
      setMessage({ ok: false, text: `Couldn't export: ${err.message}` })
    }
  }

  const onImportFile = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = '' // allow choosing the same file again
    if (!file) return
    try {
      const imported = parsePlanFile(await file.text())
      const summary = `${imported.types.length} workout type${imported.types.length === 1 ? '' : 's'}`
      if (!window.confirm(`Import ${summary}? This replaces your current plan and workout types. Your logged history is kept.`)) return
      importPlan(imported)
      setMessage({ ok: true, text: `Imported ${summary}.` })
    } catch (err) {
      setMessage({ ok: false, text: err.message })
    }
  }

  return (
    <main className="main">
      <h1 className="page-title">Weekly plan</h1>
      <p className="hint">
        Pick a workout for each weekday. This cycle repeats every week, indefinitely. Each one shows how
        recovered it is — checking in on the Today tab starts its 7-day clock.
      </p>

      {types.length === 0 && (
        <p className="hint warn">
          You haven't created any workout types yet.{' '}
          <button className="link" onClick={() => goTo('types')}>Create one in Workouts</button>
        </p>
      )}

      <ul className="list">
        {DAY_NAMES.map((name, i) => {
          const type = types.find((t) => t.id === plan[i])
          return (
            <li key={name} className={`card plan-row ${i === todayIdx ? 'is-today' : ''}`}>
              <div>
                <strong>{name}</strong>
                {i === todayIdx && <span className="badge small">Today</span>}
                <p className="notes tight">
                  {type ? `${type.exercises.length} exercise${type.exercises.length === 1 ? '' : 's'}` : 'Rest day'}
                </p>
                {type && <Recovery lastDay={lastTrained[type.id]} today={today} />}
              </div>
              <select value={type ? type.id : ''} onChange={(e) => setPlanDay(i, e.target.value)} aria-label={`${name} workout`}>
                <option value="">Rest</option>
                {types.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </li>
          )
        })}
      </ul>

      <section className="card share">
        <p className="eyebrow">Export &amp; import</p>
        <p className="notes tight">
          Save your whole plan — weekly cycle, workout types, warmups, exercises and photos — to a file, or load one
          from another device.
        </p>
        <div className="row buttons">
          <button className="secondary" onClick={exportPlan} disabled={types.length === 0}>Export plan</button>
          <button className="secondary" onClick={() => fileInput.current?.click()}>Import plan</button>
        </div>
        <input ref={fileInput} type="file" accept="application/json,.json" hidden onChange={onImportFile} />
        {message && <p className={`notes ${message.ok ? 'ok' : 'err'}`} role="status">{message.text}</p>}
      </section>
    </main>
  )
}

// How rested this workout is. The dot breathes while the muscle group is still recovering and
// settles once it's ready, so the row reads at a glance without parsing the text.
function Recovery({ lastDay, today }) {
  const { id, recovering, label } = recoveryStage(lastDay, today)
  return (
    <p className={`recovery rec-${id}`}>
      <span className={`recovery-dot ${recovering ? 'breathing' : ''}`} aria-hidden="true" />
      {label}
    </p>
  )
}
