import { fromKey } from './dates.js'

// A workout type takes a full week to recover, counted from the day you trained it:
//
//   day 0     red     the day you did it
//   day 1-2   red     ) still recovering - the indicator breathes
//   day 3-4   orange  )
//   day 5-6   yellow  )
//   day 7     green     ready again (train it Monday, it's green the next Monday)
//   day 8+    blue      rested longer than it needed
//
export const RECOVERY_DAYS = 7

const STAGES = [
  { id: 'red', through: 2 },
  { id: 'orange', through: 4 },
  { id: 'yellow', through: 6 },
  { id: 'green', through: RECOVERY_DAYS },
]

const DAY_MS = 86_400_000

// Whole days between two day keys. fromKey builds local midnights, so a clock change across the
// span shifts the difference by an hour - rounding absorbs that.
export const daysBetween = (from, to) => Math.round((fromKey(to) - fromKey(from)) / DAY_MS)

// `lastDay` is the day key a type was last trained, or null/undefined if it never has been.
export function recoveryStage(lastDay, today) {
  if (!lastDay) return { id: 'blue', days: null, recovering: false, label: 'Not trained yet' }

  const days = daysBetween(lastDay, today)
  const stage = STAGES.find((s) => days <= s.through)

  if (!stage) return { id: 'blue', days, recovering: false, label: `Rested ${days} days` }
  if (stage.id === 'green') return { id: 'green', days, recovering: false, label: 'Ready' }
  return {
    id: stage.id,
    days,
    recovering: true,
    label: days === 0 ? 'Trained today' : `Recovering · day ${days} of ${RECOVERY_DAYS}`,
  }
}

// The most recent day each workout type was actually trained, as { typeId: "2026-09-28" }.
//
// `countsAsTrained(day)` gates which days are allowed to reset a type's clock - it's wired to the
// daily check-in, so logging an exercise by mistake (or planning a day you never did) leaves the
// recovery state alone. Only a day you checked in on counts.
export function lastTrainedByType(logs, countsAsTrained) {
  const out = {}
  Object.keys(logs)
    .sort()
    .forEach((day) => {
      if (!countsAsTrained(day)) return
      logs[day].forEach((w) => {
        if (w.typeId) out[w.typeId] = day
      })
    })
  return out
}
