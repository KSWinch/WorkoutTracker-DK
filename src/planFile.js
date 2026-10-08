import { newId } from './store.js'

// Export/import of the full plan: workout types (with warmups, exercises, photos) + the weekly cycle.
const FILE_KIND = 'plan'

export function buildPlanFile({ types, plan }) {
  return { app: 'workout-tracker', kind: FILE_KIND, version: 1, exportedAt: new Date().toISOString(), types, plan }
}

const text = (v, max) => (typeof v === 'string' ? v.slice(0, max) : typeof v === 'number' ? String(v) : '')

// Validates and cleans an imported file; throws a user-readable Error if it isn't a plan file.
export function parsePlanFile(raw) {
  let data
  try {
    data = JSON.parse(raw)
  } catch {
    throw new Error("That file isn't valid JSON.")
  }
  if (data?.app !== 'workout-tracker' || data.kind !== FILE_KIND || !Array.isArray(data.types) || !Array.isArray(data.plan)) {
    throw new Error("That doesn't look like an exported workout plan.")
  }

  const seen = new Set()
  const types = []
  for (const t of data.types) {
    if (!t || typeof t !== 'object') continue
    const id = typeof t.id === 'string' && t.id && !seen.has(t.id) ? t.id : newId()
    seen.add(id)
    types.push({
      id,
      name: text(t.name, 80).trim() || 'Untitled',
      warmup: text(t.warmup, 2000),
      exercises: (Array.isArray(t.exercises) ? t.exercises : [])
        .filter((e) => e && typeof e === 'object')
        .map((e) => ({
          id: typeof e.id === 'string' && e.id ? e.id : newId(),
          name: text(e.name, 80).trim() || 'Exercise',
          kind: e.kind === 'time' ? 'time' : 'sets',
          minutes: text(e.minutes, 10),
          sets: text(e.sets, 10),
          reps: text(e.reps, 10),
          weight: text(e.weight, 10),
          photo: typeof e.photo === 'string' && e.photo.startsWith('data:image/') ? e.photo : null,
        })),
    })
  }

  const plan = Array.from({ length: 7 }, (_, i) => (types.some((t) => t.id === data.plan[i]) ? data.plan[i] : null))
  return { types, plan }
}

// Prefer the phone's share sheet (save to Files, AirDrop, messages...); fall back to a normal download.
export async function saveJsonFile(filename, obj) {
  const file = new File([JSON.stringify(obj, null, 2)], filename, { type: 'application/json' })
  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: 'Workout plan' })
      return
    } catch (err) {
      if (err?.name === 'AbortError') return // user closed the share sheet
    }
  }
  const url = URL.createObjectURL(file)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
