import { useState } from 'react'
import WorkoutForm from '../WorkoutForm.jsx'
import { PhotoSlot } from '../Photo.jsx'

export default function TypesTab({ store }) {
  const [openId, setOpenId] = useState(null)
  const [newName, setNewName] = useState('')
  const { types, addType } = store

  const open = types.find((t) => t.id === openId)
  if (open) return <TypeDetail key={open.id} type={open} store={store} onBack={() => setOpenId(null)} />

  const create = (e) => {
    e.preventDefault()
    const name = newName.trim()
    if (!name) return
    setOpenId(addType(name))
    setNewName('')
  }

  return (
    <main className="main">
      <h1 className="page-title">Workout types</h1>
      <p className="hint">
        Create a category like "Chest Day", then list every exercise you do in it and your working weight.
      </p>

      <form className="inline-form" onSubmit={create}>
        <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="New type, e.g. Chest Day" />
        <button type="submit" className="primary">Add</button>
      </form>

      {types.length === 0 && <p className="empty">No workout types yet.</p>}

      <ul className="list">
        {types.map((t) => (
          <li key={t.id}>
            <button className="card type-card" onClick={() => setOpenId(t.id)}>
              <span>
                <strong>{t.name}</strong>
                <span className="notes tight">
                  {t.exercises.length === 0 ? 'No exercises yet' : t.exercises.map((e) => e.name).join(' · ')}
                </span>
              </span>
              <span className="chev" aria-hidden="true">›</span>
            </button>
          </li>
        ))}
      </ul>
    </main>
  )
}

function TypeDetail({ type, store, onBack }) {
  const { unit, renameType, setWarmup, removeType, addExercise, editExercise, removeExercise } = store
  const [editing, setEditing] = useState(null) // null | 'new' | exercise id

  const save = (data) => {
    if (editing === 'new') addExercise(type.id, data)
    else editExercise(type.id, editing, data)
    setEditing(null)
  }

  const remove = () => {
    if (window.confirm(`Delete "${type.name}"? It will also be removed from your weekly plan. Logged history is kept.`)) {
      removeType(type.id)
      onBack()
    }
  }

  return (
    <main className="main">
      <button className="link back" onClick={onBack}>‹ All types</button>

      <input
        className="name-input"
        value={type.name}
        onChange={(e) => renameType(type.id, e.target.value)}
        aria-label="Workout type name"
      />

      <section className="card warmup">
        <label>
          <span className="eyebrow">Warmup</span>
          <textarea
            value={type.warmup ?? ''}
            onChange={(e) => setWarmup(type.id, e.target.value)}
            rows={3}
            placeholder="e.g. 5 min bike, arm circles, 2 light sets of bench"
          />
        </label>
      </section>

      <h2 className="section-title">Exercises</h2>

      {type.exercises.length === 0 && editing !== 'new' && <p className="empty">Add the exercises you do in this workout.</p>}

      <ul className="list">
        {type.exercises.map((ex) =>
          editing === ex.id ? (
            <li key={ex.id}>
              <WorkoutForm initial={ex} showNotes={false} showPhoto unit={unit} onSave={save} onCancel={() => setEditing(null)} />
            </li>
          ) : (
            <li key={ex.id} className="card ex-row">
              <PhotoSlot photo={ex.photo} name={ex.name} onChange={(photo) => editExercise(type.id, ex.id, { photo })} />
              <div className="ex-body">
                <div className="card-top">
                  <h2>{ex.name}</h2>
                  <div className="card-actions">
                    <button className="link" onClick={() => setEditing(ex.id)}>Edit</button>
                    <button
                      className="link danger"
                      onClick={() => window.confirm(`Remove "${ex.name}"?`) && removeExercise(type.id, ex.id)}
                    >
                      Remove
                    </button>
                  </div>
                </div>
                <p className="stats">
                  {[ex.sets && `${ex.sets} sets`, ex.reps && `${ex.reps} reps`, ex.weight && `${ex.weight} ${unit}`]
                    .filter(Boolean)
                    .join(' · ') || 'No details'}
                </p>
              </div>
            </li>
          ),
        )}
      </ul>

      {editing === 'new' ? (
        <WorkoutForm showNotes={false} showPhoto unit={unit} onSave={save} onCancel={() => setEditing(null)} />
      ) : (
        <button className="primary add" onClick={() => setEditing('new')}>+ Add exercise</button>
      )}

      <button className="link danger delete-type" onClick={remove}>Delete this workout type</button>
    </main>
  )
}
