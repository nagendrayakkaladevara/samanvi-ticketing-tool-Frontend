import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import { App } from '@/app/App'
import '@/styles/globals.css'

registerSW({ immediate: true })

const THEME_STORAGE_KEY = 'samanvi.theme.mode'

try {
  const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY)
  document.documentElement.classList.toggle('dark', storedTheme === 'dark')
} catch {
  // Ignore storage errors (private mode, quota, etc.) and keep the light default.
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
