import { useEffect, useState } from 'react'
import { todayKey } from './dates.js'
import { AUTO_CHECKIN_MS, bankedMs, cleared, endedAt, isPaused, pausedAt, runningSince, sessionMs } from './timing.js'

const KEY = 'workout-tracker:v2'
const V1_KEY = 'workout-tracker:v1' // v1 was just { date: [entries] }

// logs:       { "2026-09-20": [{ id, name, sets, reps, weight, notes, typeId?, exerciseId?, startedAt?, endedAt? }] }
// types:      [{ id, name, exercises: [{ id, name, sets, reps, weight }] }]
// Exercises and log entries with kind: 'time' are timed (e.g. treadmill): they use `minutes` instead of sets/reps/weight.
// plan:       7 type ids (or null = rest), Monday first. Repeats every week.
// bodyWeight: { "2026-09-20": 182.4 }
// types also carry an optional `warmup` string; exercises an optional `photo` (data URL).
// sessions:   { "2026-09-20": { start: ms, end: ms | null } }
// checkIns:   { "2026-09-20": ms } — only the days checked in by tapping the button. Days that
//             earned it by training long enough are derived instead; see isCheckedIn.
// `theme` is the accent color name.
const emptyState = () => ({
  logs: {},
  types: [],
  plan: Array(7).fill(null),
  bodyWeight: {},
  sessions: {},
  checkIns: {},
  unit: 'lb',
  theme: 'green',
  dustStyle: 'natural', // stardust on the active exercise: natural | right | left | up | down | off
})

const isPositive = (v) => Number.isFinite(parseFloat(v)) && parseFloat(v) > 0
const historyPoint = (weight) => ({ day: todayKey(), at: Date.now(), weight: String(weight) })

const read = (key) => {
  try {
    return JSON.parse(localStorage.getItem(key))
  } catch {
    return null
  }
}
const isObject = (v) => v && typeof v === 'object' && !Array.isArray(v)

function load() {
  const base = emptyState()
  const v2 = read(KEY)
  if (isObject(v2)) {
    return {
      ...base,
      ...v2,
      plan: Array.isArray(v2.plan) && v2.plan.length === 7 ? v2.plan : base.plan,
    }
  }
  const v1 = read(V1_KEY)
  if (isObject(v1)) return { ...base, logs: v1 }
  return base
}

// A workout-type exercise copied into a day's log.
export const toLogEntry = (e, typeId) => ({
  name: e.name,
  kind: e.kind ?? 'sets',
  sets: e.sets ?? '',
  reps: e.reps ?? '',
  weight: e.weight ?? '',
  minutes: e.minutes ?? '',
  notes: '',
  typeId,
  exerciseId: e.id,
})

// crypto.randomUUID needs a secure context; over plain http on a LAN IP it's missing.
export const newId = () =>
  globalThis.crypto?.randomUUID?.() ?? `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`

// A day counts as checked in once you tap the button, or once its workout passes AUTO_CHECKIN_MS.
// The long-workout half is derived rather than written down, so it can't be missed by the app being
// closed as the 25 minutes elapse, and it goes away again if the timer is reset.
export const isCheckedIn = ({ checkIns, sessions }, day, now = Date.now()) =>
  Boolean(checkIns?.[day]) || sessionMs(sessions?.[day], now) >= AUTO_CHECKIN_MS

// Checked-in days within a "YYYY-MM" month, oldest first.
export const checkInDays = (state, month, now = Date.now()) =>
  [...new Set([...Object.keys(state.checkIns ?? {}), ...Object.keys(state.sessions ?? {})])]
    .filter((day) => day.startsWith(month) && isCheckedIn(state, day, now))
    .sort()

export function useStore() {
  const [state, setState] = useState(load)
  const [saveFailed, setSaveFailed] = useState(false)

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(state))
      setSaveFailed(false)
    } catch {
      // Storage full or unavailable (photos are the usual cause); the in-memory state still works this session.
      setSaveFailed(true)
    }
  }, [state])

  const patch = (fn) => setState((prev) => ({ ...prev, ...fn(prev) }))

  const updateDay = (key, fn) =>
    patch(({ logs }) => {
      const next = fn(logs[key] ?? [])
      const copy = { ...logs }
      if (next.length) copy[key] = next
      else delete copy[key]
      return { logs: copy }
    })

  const updateType = (id, fn) => patch(({ types }) => ({ types: types.map((t) => (t.id === id ? fn(t) : t)) }))

  // IDs are created outside the updater functions so StrictMode's double-invoke stays harmless.
  return {
    ...state,
    saveFailed,

    startSession: (key) => {
      const start = Date.now()
      patch(({ sessions }) => ({ sessions: { ...sessions, [key]: { start, end: null } } }))
    },
    // Ending the workout also finishes any exercise still running or paused.
    endSession: (key) => {
      const end = Date.now()
      patch(({ sessions, logs }) => {
        if (!sessions[key]) return {}
        const day = logs[key]?.map((w) => (w.startedAt && !w.endedAt ? endedAt(w, end) : w))
        return {
          sessions: { ...sessions, [key]: { ...sessions[key], end } },
          ...(day ? { logs: { ...logs, [key]: day } } : {}),
        }
      })
    },
    clearSession: (key) =>
      patch(({ sessions }) => {
        const copy = { ...sessions }
        delete copy[key]
        return { sessions: copy }
      }),

    checkIn: (key) => {
      const at = Date.now()
      patch(({ checkIns }) => ({ checkIns: { ...checkIns, [key]: at } }))
    },
    // Only clears a tapped check-in. A day earned by a long workout stays until its timer is reset.
    undoCheckIn: (key) =>
      patch(({ checkIns }) => {
        const copy = { ...checkIns }
        delete copy[key]
        return { checkIns: copy }
      }),

    // Replaces workout types and the weekly plan (see planFile.js). Logged history is untouched.
    importPlan: ({ types, plan }) => patch(() => ({ types, plan })),

    // `weightAt` records when an entry's weight was last set, so Progress can tell which change is the newest.
    addLog: (key, entry) => {
      const id = newId()
      const weightAt = Date.now()
      updateDay(key, (list) => [...list, { ...entry, id, weightAt }])
    },
    addLogs: (key, entries) => {
      const weightAt = Date.now()
      const withIds = entries.map((e) => ({ ...e, id: newId(), weightAt }))
      updateDay(key, (list) => [...list, ...withIds])
    },
    editLog: (key, id, entry) => {
      const weightAt = Date.now()
      updateDay(key, (list) =>
        list.map((w) => {
          if (w.id !== id) return w
          const changed = entry.weight !== undefined && entry.weight !== w.weight
          return { ...w, ...entry, ...(changed ? { weightAt } : {}) }
        }),
      )
    },
    removeLog: (key, id) => updateDay(key, (list) => list.filter((w) => w.id !== id)),

    // One tap: start an idle exercise, pause a running one, resume a paused one. Starting or resuming
    // pauses whichever other exercise was running, so only one is ever counting.
    tapExercise: (key, id) => {
      const now = Date.now()
      updateDay(key, (list) => {
        const target = list.find((w) => w.id === id)
        if (!target || target.endedAt) return list
        const wasRunning = Boolean(runningSince(target))
        return list.map((w) => {
          if (w.id === id) {
            return wasRunning
              ? pausedAt(w, now)
              : { ...w, startedAt: w.startedAt ?? now, runningSince: now, pausedAt: null, elapsedMs: bankedMs(w) }
          }
          return !wasRunning && !w.endedAt && runningSince(w) ? pausedAt(w, now) : w
        })
      })
    },
    endExercise: (key, id) => {
      const now = Date.now()
      updateDay(key, (list) => list.map((w) => (w.id === id && w.startedAt && !w.endedAt ? endedAt(w, now) : w)))
    },
    resetExercise: (key, id) => updateDay(key, (list) => list.map((w) => (w.id === id ? cleared(w) : w))),
    // Finishes exercises that have been sitting paused since before `cutoff`.
    endStalePaused: (key, cutoff) =>
      updateDay(key, (list) =>
        list.map((w) => (isPaused(w) && w.pausedAt && w.pausedAt <= cutoff ? endedAt(w, Date.now()) : w)),
      ),

    // Clears every exercise's timing for a day, so the whole workout can be redone.
    resetDayTimers: (key) => updateDay(key, (list) => list.map(cleared)),

    addType: (name) => {
      const id = newId()
      patch(({ types }) => ({ types: [...types, { id, name, exercises: [] }] }))
      return id
    },
    renameType: (id, name) => updateType(id, (t) => ({ ...t, name })),
    setWarmup: (id, warmup) => updateType(id, (t) => ({ ...t, warmup })),
    removeType: (id) =>
      patch(({ types, plan }) => ({
        types: types.filter((t) => t.id !== id),
        plan: plan.map((p) => (p === id ? null : p)),
      })),
    // Every weight set on a workout-type exercise is remembered in `weightHistory` so Progress can show it.
    // If today's log already holds this workout, the new exercise joins it there too.
    addExercise: (typeId, exercise) => {
      const id = newId()
      const logId = newId()
      const weightAt = Date.now()
      const today = todayKey()
      const weightHistory = isPositive(exercise.weight) ? [historyPoint(exercise.weight)] : []
      const added = { ...exercise, id, weightHistory }
      patch(({ types, logs }) => {
        const day = logs[today] ?? []
        const inToday = day.some((w) => w.typeId === typeId)
        return {
          types: types.map((t) => (t.id === typeId ? { ...t, exercises: [...t.exercises, added] } : t)),
          ...(inToday ? { logs: { ...logs, [today]: [...day, { ...toLogEntry(added, typeId), id: logId, weightAt }] } } : {}),
        }
      })
    },
    editExercise: (typeId, id, exercise) => {
      const point = isPositive(exercise.weight) ? historyPoint(exercise.weight) : null
      updateType(typeId, (t) => ({
        ...t,
        exercises: t.exercises.map((e) => {
          if (e.id !== id) return e
          const next = { ...e, ...exercise }
          if (point && exercise.weight !== e.weight) {
            const prior = e.weightHistory ?? []
            // An exercise from before history existed: treat its old weight as where the month started.
            const seed =
              prior.length === 0 && isPositive(e.weight)
                ? [{ day: `${todayKey().slice(0, 7)}-01`, at: 0, weight: String(e.weight) }]
                : []
            next.weightHistory = [...seed, ...prior, point].slice(-200)
          }
          return next
        }),
      }))
    },
    removeExercise: (typeId, id) =>
      updateType(typeId, (t) => ({ ...t, exercises: t.exercises.filter((e) => e.id !== id) })),

    setPlanDay: (index, typeId) =>
      patch(({ plan }) => ({ plan: plan.map((p, i) => (i === index ? typeId || null : p)) })),

    setBodyWeight: (key, value) =>
      patch(({ bodyWeight }) => {
        const copy = { ...bodyWeight }
        if (value == null) delete copy[key]
        else copy[key] = value
        return { bodyWeight: copy }
      }),

    setUnit: (unit) => setState((prev) => ({ ...prev, unit })),
    setTheme: (theme) => setState((prev) => ({ ...prev, theme })),
    setDust: (dustStyle) => setState((prev) => ({ ...prev, dustStyle })),
  }
}
