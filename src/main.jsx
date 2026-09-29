import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import App from './App.jsx'
import './styles.css'

// The worker is generated with skipWaiting/clientsClaim and registerSW reloads
// the page once a new one activates, so updates need no prompt. But the browser
// only looks for a new worker on a navigation, and an installed PWA resumed from
// the app switcher never navigates — so check on a timer too, or the app can sit
// on an old build indefinitely.
const UPDATE_CHECK_MS = 60 * 60 * 1000

registerSW({
  immediate: true,
  onRegisteredSW(swUrl, registration) {
    if (!registration) return
    // While the app is backgrounded iOS suspends timers, so also check the
    // moment it comes back to the foreground — that's the common case.
    setInterval(() => registration.update(), UPDATE_CHECK_MS)
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') registration.update()
    })
  },
})

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
