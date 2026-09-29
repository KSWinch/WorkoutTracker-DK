import { useEffect, useState } from 'react';
import { useStore } from './store.js';
import LogTab from './tabs/LogTab.jsx';
import PlanTab from './tabs/PlanTab.jsx';
import TypesTab from './tabs/TypesTab.jsx';
import ProgressTab from './tabs/ProgressTab.jsx';
import WeightTab from './tabs/WeightTab.jsx';
import SettingsTab, { THEMES } from './tabs/SettingsTab.jsx';

const TABS = [
  { id: 'plan', label: 'Plan', icon: '🗓️', Component: PlanTab },
  { id: 'types', label: 'Workouts', icon: '🏋️', Component: TypesTab },
  { id: 'log', label: 'Today', icon: '📅', Component: LogTab }, // center tab; also the default
  { id: 'progress', label: 'Progress', icon: '📈', Component: ProgressTab },
  { id: 'weight', label: 'Weight', icon: '⚖️', Component: WeightTab },
];

export default function App() {
  const store = useStore();
  const [tab, setTab] = useState('log');
  const [settingsOpen, setSettingsOpen] = useState(false); // opened from the gear; the bottom tab underneath is remembered
  const [pickingTheme, setPickingTheme] = useState(false);
  const Component = settingsOpen
    ? SettingsTab
    : TABS.find((t) => t.id === tab).Component;

  useEffect(() => {
    document.documentElement.dataset.theme = store.theme;
    document.documentElement.dataset.dust = store.dustStyle;
  }, [store.theme, store.dustStyle]);

  const openTab = (id) => {
    setTab(id);
    setSettingsOpen(false);
  };

  return (
    <div className={`app ${tab === 'log' && !settingsOpen ? 'wide' : ''}`}>
      {store.saveFailed && (
        <p className="banner" role="alert">
          Couldn't save — this device's storage is full. Recent changes may be
          lost; try removing some exercise photos.
        </p>
      )}
      <div className="topbar">
        <span className="brand">Tracker DK</span>
        <div className="topbar-actions">
          <button
            className={`gear ${pickingTheme ? 'on' : ''}`}
            onClick={() => setPickingTheme((v) => !v)}
            aria-label="Change color theme"
            aria-expanded={pickingTheme}
          >
            🎨
          </button>
          <button
            className={`gear ${settingsOpen ? 'on' : ''}`}
            onClick={() => setSettingsOpen((v) => !v)}
            aria-label={settingsOpen ? 'Close settings' : 'Open settings'}
            aria-pressed={settingsOpen}
          >
            ⚙️
          </button>
        </div>
      </div>

      {pickingTheme && (
        <div className="card themes">
          <p className="eyebrow">Color theme</p>
          <div className="swatches">
            {THEMES.map((t) => (
              <button
                key={t.id}
                className={`swatch ${store.theme === t.id ? 'on' : ''}`}
                style={{ '--swatch': t.color }}
                onClick={() => store.setTheme(t.id)}
                aria-label={t.label}
                aria-pressed={store.theme === t.id}
              />
            ))}
          </div>
        </div>
      )}

      <Component store={store} goTo={openTab} />

      <nav className="tabbar" aria-label="Sections">
        {TABS.map((t) => (
          <button
            key={t.id}
            className={t.id === tab && !settingsOpen ? 'on' : ''}
            onClick={() => openTab(t.id)}
          >
            <span className="tab-icon" aria-hidden="true">
              {t.icon}
            </span>
            {t.label}
          </button>
        ))}
      </nav>
    </div>
  );
}
