import Dust from '../Dust.jsx'

// Swatch colors mirror the accents in styles.css.
export const THEMES = [
  { id: 'green', label: 'Green', color: '#34d399' },
  { id: 'blue', label: 'Blue', color: '#60a5fa' },
  { id: 'purple', label: 'Purple', color: '#a78bfa' },
  { id: 'pink', label: 'Pink', color: '#f472b6' },
  { id: 'red', label: 'Red', color: '#f87171' },
  { id: 'orange', label: 'Orange', color: '#fb923c' },
  { id: 'yellow', label: 'Sunlight', color: '#fcd34d' },
  { id: 'white', label: 'White', color: '#f3f4f6' },
]

const DUST = [
  { id: 'natural', label: 'Natural' },
  { id: 'right', label: 'Right →' },
  { id: 'left', label: '← Left' },
  { id: 'up', label: 'Up ↑' },
  { id: 'down', label: 'Down ↓' },
  { id: 'off', label: 'Off' },
]

export default function SettingsTab({ store }) {
  const { theme, unit, dustStyle, setTheme, setUnit, setDust } = store

  return (
    <main className="main">
      <h1 className="page-title">Settings</h1>

      <section className="card setting">
        <h2 className="setting-title">Color theme</h2>
        <div className="swatches">
          {THEMES.map((t) => (
            <button
              key={t.id}
              className={`swatch ${theme === t.id ? 'on' : ''}`}
              style={{ '--swatch': t.color }}
              onClick={() => setTheme(t.id)}
              aria-label={t.label}
              aria-pressed={theme === t.id}
            />
          ))}
        </div>
      </section>

      <section className="card setting">
        <h2 className="setting-title">Weight unit</h2>
        <div className="seg" role="group" aria-label="Weight unit">
          {['lb', 'kg'].map((u) => (
            <button key={u} className={unit === u ? 'on' : ''} onClick={() => setUnit(u)}>
              {u}
            </button>
          ))}
        </div>
      </section>

      <section className="card setting">
        <h2 className="setting-title">Stardust effect</h2>
        <p className="notes tight">
          On the exercise you're currently doing. Natural lets each sparkle twinkle and float on its own; the
          arrows make them all drift one way.
        </p>
        <div className="seg wrap" role="group" aria-label="Stardust style">
          {DUST.map((d) => (
            <button key={d.id} className={dustStyle === d.id ? 'on' : ''} onClick={() => setDust(d.id)}>
              {d.label}
            </button>
          ))}
        </div>

        <div className="card ex-row active dust-preview">
          <Dust />
          <div className="ex-body">
            <h2>Incline chest press</h2>
            <p className="stats">3 sets · 8 reps · 95 lb</p>
            <p className="ex-status live">
              <span className="pulse" aria-hidden="true" />
              In progress · preview
            </p>
          </div>
        </div>
      </section>

      <section className="card setting">
        <h2 className="setting-title">About</h2>
        <p className="notes tight">Tracker DK v{__APP_VERSION__}</p>
        <p className="notes tight">Built {__BUILD_TIME__} UTC</p>
      </section>
    </main>
  )
}
