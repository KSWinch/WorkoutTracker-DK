import { useEffect, useState } from 'react'
import { DAY_NAMES, addDays, dayIndex, formatClock, formatDuration, formatLong, formatTime, todayKey } from '../dates.js'
import { AUTO_CHECKIN_MS, AUTO_END_MS, exerciseState, isPaused, sessionMs, totalMs } from '../timing.js'
import WorkoutForm from '../WorkoutForm.jsx'
import { Thumb } from '../Photo.jsx'
import Dust from '../Dust.jsx'

const fmt = (n) => (Number.isInteger(n) ? String(n) : n.toFixed(1))

const describe = (e, unit) =>
  [e.sets && `${e.sets} sets`, e.reps && `${e.reps} reps`, e.weight && `${e.weight} ${unit}`]
    .filter(Boolean)
    .join(' · ') || 'No details'

// Logged entries don't store photos; look the picture up from the matching exercise in the workout type.
const photoFor = (types, entry) =>
  types
    .find((t) => t.id === entry.typeId)
    ?.exercises.find((e) => e.name.trim().toLowerCase() === entry.name.trim().toLowerCase())?.photo

export default function LogTab({ store, goTo }) {
  const {
    logs, types, plan, unit, bodyWeight, sessions, checkIns,
    addLog, addLogs, editLog, removeLog, resetDayTimers, setBodyWeight, startSession, endSession, clearSession,
    tapExercise, endExercise, resetExercise, endStalePaused, checkIn, undoCheckIn,
  } = store
  const [day, setDay] = useState(todayKey)
  const [editing, setEditing] = useState(null) // null | 'new' | entry id

  const today = todayKey()
  const isToday = day === today
  const workouts = logs[day] ?? []
  const editingEntry = workouts.find((w) => w.id === editing)
  const session = sessions[day]
  const sessionRunning = Boolean(session) && !session.end
  const anyTimed = workouts.some((w) => w.startedAt)

  const planned = types.find((t) => t.id === plan[dayIndex(day)])
  const plannedLoaded = planned && workouts.some((w) => w.typeId === planned.id)
  const hasPlan = plan.some(Boolean)

  const title = planned ? planned.name : hasPlan ? 'Rest day' : 'Nothing planned'

  const go = (key) => {
    setDay(key)
    setEditing(null)
  }

  const save = (data) => {
    if (editing === 'new') addLog(day, data)
    else editLog(day, editing, data)
    setEditing(null)
  }

  const loadPlanned = () =>
    addLogs(
      day,
      planned.exercises.map(({ name, sets, reps, weight }) => ({ name, sets, reps, weight, notes: '', typeId: planned.id })),
    )

  // Pull a different day's workout into this one — swapping leg day forward, or training on a rest day.
  const slotIn = (typeId) => {
    const t = types.find((x) => x.id === typeId)
    if (!t) return
    addLogs(
      day,
      t.exercises.map(({ name, sets, reps, weight }) => ({ name, sets, reps, weight, notes: '', typeId: t.id })),
    )
  }

  // A paused exercise finishes itself once it has been left alone long enough.
  const hasPaused = workouts.some(isPaused)
  useEffect(() => {
    if (!hasPaused) return
    const sweep = () => endStalePaused(day, Date.now() - AUTO_END_MS)
    sweep()
    const id = setInterval(sweep, 1000)
    return () => clearInterval(id)
  }, [hasPaused, day])

  // Starting the workout also pulls the planned exercises into the log.
  const start = () => {
    startSession(day)
    if (planned && !plannedLoaded && planned.exercises.length) loadPlanned()
  }

  return (
    <>
      <header className="today-head">
        <p className="eyebrow">
          {isToday && <span className="badge small">Today</span>}
          {formatLong(day)}
        </p>
        <h1 className="today-title">{title}</h1>
        {!isToday && <button className="link" onClick={() => go(today)}>‹ Back to today</button>}
      </header>

      <div className="today-grid">
        <aside className="rail rail-weight">
          <WeightPanel
            key={day}
            label={isToday ? 'Yesterday' : 'Day before'}
            previous={bodyWeight[addDays(day, -1)]}
            current={bodyWeight[day]}
            unit={unit}
            onSave={(v) => setBodyWeight(day, v)}
            onClear={() => setBodyWeight(day, null)}
          />
        </aside>

        <aside className="rail rail-time">
          <TimePanel
            key={day}
            session={session}
            onStart={start}
            onEnd={() => endSession(day)}
            onReset={() => window.confirm('Reset the workout timer for this day?') && clearSession(day)}
          />
        </aside>

        <main className="center">
          <CheckInCard
            manualAt={checkIns[day]}
            session={session}
            onCheckIn={() => checkIn(day)}
            onUndo={() => undoCheckIn(day)}
          />

          {!planned && !hasPlan && (
            <p className="rest">
              Set up your weekly cycle in the <button className="link" onClick={() => goTo('plan')}>Plan</button> tab.
            </p>
          )}

          {planned?.warmup?.trim() && (
            <section className="card warmup">
              <p className="eyebrow">Warmup</p>
              <p className="warmup-line">{planned.warmup.trim()}</p>
            </section>
          )}

          {planned && !plannedLoaded && (
            <section className="card planned">
              <p className="eyebrow">Planned exercises</p>
              {planned.exercises.length === 0 ? (
                <p className="notes">
                  No exercises yet.{' '}
                  <button className="link" onClick={() => goTo('types')}>Add some in Workouts</button>
                </p>
              ) : (
                <>
                  <ul className="planned-list">
                    {planned.exercises.map((e) => (
                      <li key={e.id}>
                        <span className="pl-main">
                          {e.photo && <Thumb src={e.photo} alt={e.name} small />}
                          <strong>{e.name}</strong>
                        </span>
                        <span>{describe(e, unit)}</span>
                      </li>
                    ))}
                  </ul>
                  {session ? (
                    <button className="secondary add" onClick={loadPlanned}>Add planned exercises</button>
                  ) : (
                    <p className="notes">Tap <strong>Start workout</strong> to begin.</p>
                  )}
                </>
              )}
            </section>
          )}

          {workouts.length > 0 && (
            <div className="logged-head">
              <h2 className="section-title">
                Logged{sessionRunning && <span className="tap-hint"> · tap an exercise to start and finish it</span>}
              </h2>
              {anyTimed && (
                <button
                  className="link"
                  onClick={() =>
                    window.confirm('Reset every exercise for this day? Start and end times are cleared; the exercises stay.') &&
                    resetDayTimers(day)
                  }
                >
                  Reset all
                </button>
              )}
            </div>
          )}

          <ul className="list">
            {workouts.map((w) => {
              if (editing === w.id) {
                return (
                  <li key={w.id}>
                    <WorkoutForm initial={editingEntry} types={types} unit={unit} onSave={save} onCancel={() => setEditing(null)} />
                  </li>
                )
              }
              const type = types.find((t) => t.id === w.typeId)
              const photo = photoFor(types, w)
              const state = exerciseState(w)
              // Tappable once the day's workout has been started — including after it ends, so a reset day can be redone.
              const tappable = Boolean(session) && state !== 'done'
              return (
                <li
                  key={w.id}
                  className={`card ex-row ${state} ${tappable ? 'tappable' : ''}`}
                  tabIndex={tappable ? 0 : undefined}
                  onClick={
                    tappable
                      ? (e) => {
                          if (!e.target.closest('button, a, input, textarea, select')) tapExercise(day, w.id)
                        }
                      : undefined
                  }
                  onKeyDown={
                    tappable
                      ? (e) => {
                          if (e.target === e.currentTarget && (e.key === 'Enter' || e.key === ' ')) {
                            e.preventDefault()
                            tapExercise(day, w.id)
                          }
                        }
                      : undefined
                  }
                >
                  {state === 'active' && <Dust />}
                  {photo && <Thumb src={photo} alt={w.name} />}
                  <div className="ex-body">
                    <div className="card-top">
                      <h2>{w.name}</h2>
                      <div className="card-actions">
                        <button className="link" onClick={() => setEditing(w.id)}>Edit</button>
                        <button
                          className="link danger"
                          onClick={() =>
                            window.confirm(
                              `Remove "${w.name}" from this day's log? It stays in your ${type ? type.name : 'workout'} list.`,
                            ) && removeLog(day, w.id)
                          }
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                    {type && <span className="chip">{type.name}</span>}
                    <p className="stats">{describe(w, unit)}</p>
                    {w.notes && <p className="notes">{w.notes}</p>}

                    {state === 'idle' && sessionRunning && <p className="ex-status">Tap to start</p>}
                    {state === 'active' && (
                      <p className="ex-status live">
                        <span className="pulse" aria-hidden="true" />
                        In progress · started {formatTime(w.startedAt)} · <Running entry={w} />
                        <span className="tap-hint"> · tap to pause</span>
                        <button className="link end-now" onClick={() => endExercise(day, w.id)}>End</button>
                      </p>
                    )}
                    {state === 'paused' && (
                      <p className="ex-status paused">
                        Paused · <strong>{formatDuration(totalMs(w))}</strong> so far
                        <span className="tap-hint"> · tap to resume</span>
                        <CountdownToEnd pausedAt={w.pausedAt} />
                        <button className="link end-now" onClick={() => endExercise(day, w.id)}>End now</button>
                      </p>
                    )}
                    {state === 'done' && (
                      <p className="ex-status done">
                        Started {formatTime(w.startedAt)} · Ended {formatTime(w.endedAt)} ·{' '}
                        <strong>{formatDuration(totalMs(w))}</strong>{' '}
                        <button className="link" onClick={() => resetExercise(day, w.id)}>Redo</button>
                      </p>
                    )}
                  </div>
                </li>
              )
            })}
          </ul>

          <SlotInWorkout types={types} plan={plan} excludeId={planned?.id} onSlot={slotIn} />

          {editing === 'new' ? (
            <WorkoutForm
              types={types}
              defaultTypeId={planned?.id ?? ''}
              unit={unit}
              onSave={save}
              onCancel={() => setEditing(null)}
            />
          ) : (
            <button className="secondary add" onClick={() => setEditing('new')}>+ Add exercise</button>
          )}

          <details className="other-day">
            <summary>Log a different day</summary>
            <input type="date" value={day} onChange={(e) => e.target.value && go(e.target.value)} aria-label="Pick a date" />
          </details>
        </main>
      </div>
    </>
  )
}

// Left rail: the previous day's body weight and a box to log this day's. Shares data with the Weight tab.
function WeightPanel({ label, previous, current, unit, onSave, onClear }) {
  const [text, setText] = useState(current != null ? String(current) : '')

  const submit = (e) => {
    e.preventDefault()
    const n = parseFloat(text)
    if (Number.isFinite(n) && n > 0) onSave(Math.round(n * 10) / 10)
  }

  const diff = current != null && previous != null ? Math.round((current - previous) * 10) / 10 : null

  return (
    <section className="card rail-card">
      <p className="eyebrow">Body weight</p>

      <div className="compare">
        <div>
          <p className="rail-label">{label}</p>
          <p className="rail-value">{previous != null ? fmt(previous) : '—'}</p>
        </div>
        <div>
          <p className="rail-label">Today</p>
          <p className="rail-value today-val">{current != null ? fmt(current) : '—'}</p>
        </div>
        <p className="compare-unit">{unit}</p>
      </div>

      <form onSubmit={submit}>
        <input
          aria-label="Today's weight"
          id="today-weight"
          value={text}
          onChange={(e) => setText(e.target.value)}
          inputMode="decimal"
          placeholder={unit}
        />
        <button type="submit" className="primary">{current != null ? 'Update' : 'Save'}</button>
      </form>

      {current != null && (
        <p className="notes tight">
          Saved{diff !== null && diff !== 0 ? ` · ${diff > 0 ? '+' : ''}${fmt(diff)} ${unit}` : ''}{' '}
          <button
            className="link danger"
            onClick={() => {
              onClear()
              setText('')
            }}
          >
            Clear
          </button>
        </p>
      )}
    </section>
  )
}

// Drops another workout's exercises into this day. Today's own planned workout is left out, since
// the Planned card above already offers it.
function SlotInWorkout({ types, plan, excludeId, onSlot }) {
  const [pick, setPick] = useState('')
  const options = types.filter((t) => t.id !== excludeId)
  if (options.length === 0) return null

  const plannedFor = (id) => {
    const i = plan.indexOf(id)
    return i === -1 ? null : DAY_NAMES[i]
  }

  const add = () => {
    onSlot(pick)
    setPick('')
  }

  return (
    <section className="card slot-in">
      <p className="eyebrow">Slot in another workout</p>
      <div className="slot-row">
        <select value={pick} onChange={(e) => setPick(e.target.value)} aria-label="Workout to slot in">
          <option value="">Choose a workout…</option>
          {options.map((t) => {
            const dayName = plannedFor(t.id)
            return (
              <option key={t.id} value={t.id}>
                {dayName ? `${t.name} (${dayName})` : t.name}
              </option>
            )
          })}
        </select>
        <button className="secondary" disabled={!pick} onClick={add}>Add</button>
      </div>
    </section>
  )
}

// Ticks once a second while mounted, unless there is nothing live to count.
function useNow(active = true) {
  const [now, setNow] = useState(Date.now)
  useEffect(() => {
    if (!active) return
    setNow(Date.now())
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [active])
  return now
}

// Marks the day as trained. Tapping the button is one way in; letting the workout timer pass
// 25 minutes is the other, so a long session counts even if you never tap it.
function CheckInCard({ manualAt, session, onCheckIn, onUndo }) {
  const running = Boolean(session) && !session.end
  // Tick only while a session is live; an ended one has a fixed length and needs no clock.
  const elapsedNow = sessionMs(session, useNow(running))
  const auto = elapsedNow >= AUTO_CHECKIN_MS

  if (manualAt || auto) {
    return (
      <section className="card check-in on">
        <p className="eyebrow">Check-in</p>
        <p className="check-in-state">Checked in</p>
        <p className="notes tight">
          {manualAt ? (
            <>
              Tapped at {formatTime(manualAt)} <button className="link" onClick={onUndo}>Undo</button>
            </>
          ) : (
            `Earned automatically · ${formatDuration(elapsedNow)} of training`
          )}
        </p>
      </section>
    )
  }

  return (
    <section className="card check-in">
      <p className="eyebrow">Check-in</p>
      <button className="primary add" onClick={onCheckIn}>Check in</button>
      <p className="notes tight">
        {running
          ? `Or keep going — ${formatDuration(AUTO_CHECKIN_MS - elapsedNow)} more counts automatically.`
          : 'Or train for 25 minutes and it counts automatically.'}
      </p>
    </section>
  )
}

// Live h:mm:ss total for an exercise in progress, including time banked before it was paused.
function Running({ entry }) {
  return <span className="elapsed">{formatClock(totalMs(entry, useNow()))}</span>
}

// How long a paused exercise has left before it finishes on its own.
function CountdownToEnd({ pausedAt }) {
  const left = Math.max(0, AUTO_END_MS - (useNow() - pausedAt))
  return <span className="tap-hint"> · ends in {Math.ceil(left / 1000)}s</span>
}

// Right rail: workout start / end time and duration.
function TimePanel({ session, onStart, onEnd, onReset }) {
  const running = Boolean(session) && !session.end
  const [now, setNow] = useState(Date.now)

  useEffect(() => {
    if (!running) return
    setNow(Date.now())
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [running])

  return (
    <section className="card rail-card">
      <p className="eyebrow">Workout time</p>

      {!session ? (
        <>
          <p className="notes tight">Not started</p>
          <button className="primary" onClick={onStart}>Start workout</button>
        </>
      ) : (
        <>
          <dl className="times">
            <div>
              <dt>Started</dt>
              <dd>{formatTime(session.start)}</dd>
            </div>
            {running ? (
              <div>
                <dt>Elapsed</dt>
                <dd className="big">{formatClock(now - session.start)}</dd>
              </div>
            ) : (
              <>
                <div>
                  <dt>Ended</dt>
                  <dd>{formatTime(session.end)}</dd>
                </div>
                <div>
                  <dt>Duration</dt>
                  <dd className="big">{formatDuration(session.end - session.start)}</dd>
                </div>
              </>
            )}
          </dl>
          {running && <button className="primary" onClick={onEnd}>End workout</button>}
          <button className="link danger" onClick={onReset}>Reset timer</button>
        </>
      )}
    </section>
  )
}
