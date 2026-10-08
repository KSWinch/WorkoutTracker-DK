import { useState } from 'react'
import { PhotoField } from './Photo.jsx'

// One-line summary of an exercise or logged entry: "3 sets · 10 reps · 135 lb" or "20 min".
export const describe = (e, unit) =>
  (e.kind === 'time'
    ? e.minutes && `${e.minutes} min`
    : [e.sets && `${e.sets} sets`, e.reps && `${e.reps} reps`, e.weight && `${e.weight} ${unit}`].filter(Boolean).join(' · ')) ||
  'No details'

// Used for both daily log entries and exercises inside a workout type.
// An exercise is either set-based (sets/reps/weight) or timed (kind: 'time', minutes) like a treadmill run.
//  - pass `types` to show a category picker (log entries)
//  - pass showNotes={false} to hide notes (type exercises)
export default function WorkoutForm({ initial, types, defaultTypeId = '', showNotes = true, showPhoto = false, unit, onSave, onCancel }) {
  const [form, setForm] = useState({
    photo: initial?.photo ?? null,
    kind: initial?.kind === 'time' ? 'time' : 'sets',
    name: initial?.name ?? '',
    minutes: initial?.minutes ?? '',
    sets: initial?.sets ?? '',
    reps: initial?.reps ?? '',
    weight: initial?.weight ?? '',
    notes: initial?.notes ?? '',
    typeId: initial ? (initial.typeId ?? '') : defaultTypeId,
  })

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }))

  const submit = (e) => {
    e.preventDefault()
    if (!form.name.trim()) return
    const data =
      form.kind === 'time'
        ? { kind: 'time', name: form.name.trim(), minutes: form.minutes, sets: '', reps: '', weight: '' }
        : { kind: 'sets', name: form.name.trim(), sets: form.sets, reps: form.reps, weight: form.weight, minutes: '' }
    if (showNotes) data.notes = form.notes.trim()
    if (showPhoto) data.photo = form.photo
    if (types) data.typeId = form.typeId || null
    onSave(data)
  }

  return (
    <form className="card form" onSubmit={submit}>
      <div className="seg kind" role="group" aria-label="Exercise type">
        {[['sets', 'Sets & reps'], ['time', 'Timed']].map(([kind, label]) => (
          <button
            key={kind}
            type="button"
            className={form.kind === kind ? 'on' : ''}
            aria-pressed={form.kind === kind}
            onClick={() => setForm((f) => ({ ...f, kind }))}
          >
            {label}
          </button>
        ))}
      </div>
      <label>
        Exercise
        <input
          value={form.name}
          onChange={set('name')}
          placeholder={form.kind === 'time' ? 'e.g. Treadmill' : 'e.g. Bench press'}
          autoFocus
          required
        />
      </label>
      {types && types.length > 0 && (
        <label>
          Category
          <select value={form.typeId} onChange={set('typeId')}>
            <option value="">None</option>
            {types.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </label>
      )}
      {form.kind === 'time' ? (
        <label>
          Time (min)
          <input value={form.minutes} onChange={set('minutes')} inputMode="decimal" placeholder="20" />
        </label>
      ) : (
        <div className="row">
          <label>
            Sets
            <input value={form.sets} onChange={set('sets')} inputMode="numeric" placeholder="3" />
          </label>
          <label>
            Reps
            <input value={form.reps} onChange={set('reps')} inputMode="numeric" placeholder="10" />
          </label>
          <label>
            {unit ? `Weight (${unit})` : 'Weight'}
            <input value={form.weight} onChange={set('weight')} inputMode="decimal" placeholder="135" />
          </label>
        </div>
      )}
      {showPhoto && <PhotoField photo={form.photo} onChange={(photo) => setForm((f) => ({ ...f, photo }))} />}
      {showNotes && (
        <label>
          Notes
          <textarea value={form.notes} onChange={set('notes')} rows={2} placeholder="Optional" />
        </label>
      )}
      <div className="row buttons">
        <button type="button" className="secondary" onClick={onCancel}>Cancel</button>
        <button type="submit" className="primary">{initial ? 'Save' : 'Add'}</button>
      </div>
    </form>
  )
}
