import { useState } from 'react'

export const TICKETS_AUTO_REFRESH_KEY = 'tickets-auto-refresh'

export function readTicketsAutoRefreshPreference(): boolean {
  try {
    return window.localStorage.getItem(TICKETS_AUTO_REFRESH_KEY) === 'true'
  } catch {
    return false
  }
}

export function persistTicketsAutoRefreshPreference(enabled: boolean) {
  try {
    window.localStorage.setItem(TICKETS_AUTO_REFRESH_KEY, String(enabled))
  } catch {
    // Ignore storage errors (private mode, quota, etc.)
  }
}

export function useTicketsAutoRefresh() {
  const [autoRefresh, setAutoRefreshState] = useState(readTicketsAutoRefreshPreference)

  function setAutoRefresh(enabled: boolean) {
    persistTicketsAutoRefreshPreference(enabled)
    setAutoRefreshState(enabled)
  }

  function toggleAutoRefresh() {
    setAutoRefresh(!autoRefresh)
  }

  return { autoRefresh, setAutoRefresh, toggleAutoRefresh }
}
