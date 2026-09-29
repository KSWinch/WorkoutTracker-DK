// Timing model for one logged exercise. An exercise can be started, paused and resumed any number of
// times, so its total is banked time plus whatever the current run has added.
//
//   startedAt     first time it was ever started (shown as "Started 6:05 PM"); cleared only by Redo
//   runningSince  when the current run began; null while paused or finished
//   elapsedMs     time banked from earlier runs
//   pausedAt      when it was paused; null otherwise
//   endedAt       when it was finished; null until then
//
// A paused exercise finishes on its own once it has sat untouched this long:
export const AUTO_END_MS = 60_000

// Entries logged before pause/resume existed only had startedAt + endedAt, so treat a start with no
// banked time as still running.
export const runningSince = (w) =>
  w.runningSince ?? (w.startedAt && w.elapsedMs === undefined && !w.endedAt ? w.startedAt : null)

export const bankedMs = (w) =>
  w.elapsedMs ?? (w.startedAt && w.endedAt ? w.endedAt - w.startedAt : 0)

export const totalMs = (w, now = Date.now()) => {
  const since = runningSince(w)
  return bankedMs(w) + (since ? Math.max(0, now - since) : 0)
}

export const exerciseState = (w) => {
  if (!w.startedAt) return 'idle'
  if (w.endedAt) return 'done'
  return runningSince(w) ? 'active' : 'paused'
}

export const isPaused = (w) => exerciseState(w) === 'paused'

// Snapshot of a running exercise, frozen at `now`.
export const pausedAt = (w, now) => ({ ...w, elapsedMs: totalMs(w, now), runningSince: null, pausedAt: now })

// Finishing keeps the moment it stopped counting: for a paused exercise that's when it was paused.
export const endedAt = (w, now) => {
  const stoppedAt = runningSince(w) ? now : (w.pausedAt ?? now)
  return { ...w, elapsedMs: totalMs(w, stoppedAt), runningSince: null, pausedAt: null, endedAt: stoppedAt }
}

export const cleared = (w) => ({
  ...w,
  startedAt: null,
  runningSince: null,
  elapsedMs: undefined,
  pausedAt: null,
  endedAt: null,
})
