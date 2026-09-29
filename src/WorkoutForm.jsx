import { useState } from 'react'
import { PhotoField } from './Photo.jsx'

// Used for both daily log entries and exercises inside a workout type.
//  - pass `types` to show a category picker (log entries)
//  - pass showNotes={false} to hide notes (type exercises)
export default function WorkoutForm({ initial, types, defaultTypeId = '', showNotes = true, showPhoto = false, unit, onSave, onCancel }) {
  const [form, setForm] = useState({
    photo: initial?.photo ?? null,
    name: initial?.name ?? '',
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
    const data = { name: form.name.trim(), sets: form.sets, reps: form.reps, weight: form.weight }
    if (showNotes) data.notes = form.notes.trim()
    if (showPhoto) data.photo = form.photo
    if (types) data.typeId = form.typeId || null
    onSave(data)
  }

  return (
    <form className="card form" onSubmit={submit}>
      <label>
        Exercise
        <input value={form.name} onChange={set('name')} placeholder="e.g. Bench press" autoFocus required />
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
