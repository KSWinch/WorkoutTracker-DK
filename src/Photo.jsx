import { useRef, useState } from 'react'
import { resizeImage } from './image.js'

// Tap-to-enlarge photo bubble.
export function Thumb({ src, alt, small = false }) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button type="button" className={`thumb ${small ? 'sm' : ''}`} onClick={() => setOpen(true)} aria-label={`View photo of ${alt}`}>
        <img src={src} alt="" />
      </button>
      {open && (
        <div
          className="lightbox"
          onClick={(e) => {
            e.stopPropagation() // don't also trigger a tappable card underneath
            setOpen(false)
          }}
          role="dialog"
          aria-label={alt}
        >
          <img src={src} alt={alt} />
        </div>
      )}
    </>
  )
}

// Hidden file input plus a `pick()` trigger. On phones the picker offers camera or photo library.
function usePhotoPicker(onPhoto) {
  const ref = useRef(null)
  const [error, setError] = useState('')

  const onChange = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = '' // allow picking the same file again
    if (!file) return
    try {
      onPhoto(await resizeImage(file))
      setError('')
    } catch (err) {
      setError(err.message)
    }
  }

  return {
    input: <input ref={ref} type="file" accept="image/*" hidden onChange={onChange} />,
    pick: () => ref.current?.click(),
    error,
  }
}

// Exercise card bubble: shows the photo, or an empty bubble that opens the picker when tapped.
export function PhotoSlot({ photo, name, onChange }) {
  const { input, pick, error } = usePhotoPicker(onChange)
  return (
    <>
      {input}
      {photo ? (
        <Thumb src={photo} alt={name} />
      ) : (
        <button type="button" className="thumb empty" onClick={pick} aria-label={`Add photo for ${name}`} title={error || 'Add photo'}>
          📷
        </button>
      )}
    </>
  )
}

// Photo controls inside the exercise edit form.
export function PhotoField({ photo, onChange }) {
  const { input, pick, error } = usePhotoPicker(onChange)
  return (
    <div className="photo-field">
      {input}
      {photo ? <img className="thumb" src={photo} alt="" /> : <div className="thumb empty">📷</div>}
      <div className="photo-actions">
        <button type="button" className="link" onClick={pick}>{photo ? 'Change photo' : 'Add photo'}</button>
        {photo && <button type="button" className="link danger" onClick={() => onChange(null)}>Remove photo</button>}
        {error && <span className="notes">{error}</span>}
      </div>
    </div>
  )
}
