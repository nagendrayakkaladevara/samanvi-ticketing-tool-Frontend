import { useState } from 'react'

import {
  DEFAULT_TICKET_LIST_WINDOW_DAYS,
  parseTicketListWindowDays,
} from '@/features/tickets/utils/ticket-list-filter'

export const DASHBOARD_WINDOW_DAYS_KEY = 'dashboard-window-days'

export function readDashboardWindowDaysPreference(): number {
  try {
    return parseTicketListWindowDays(window.localStorage.getItem(DASHBOARD_WINDOW_DAYS_KEY))
  } catch {
    return DEFAULT_TICKET_LIST_WINDOW_DAYS
  }
}

export function persistDashboardWindowDaysPreference(days: number) {
  try {
    window.localStorage.setItem(DASHBOARD_WINDOW_DAYS_KEY, String(days))
  } catch {
    // Ignore storage errors (private mode, quota, etc.)
  }
}

export function useDashboardWindowDays() {
  const [windowDays, setWindowDaysState] = useState(readDashboardWindowDaysPreference)

  function setWindowDays(days: number) {
    persistDashboardWindowDaysPreference(days)
    setWindowDaysState(days)
  }

  return { windowDays, setWindowDays }
}
