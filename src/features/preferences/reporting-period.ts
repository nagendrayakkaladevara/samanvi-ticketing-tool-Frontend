import {
  DEFAULT_TICKET_LIST_WINDOW_DAYS,
  TICKET_LIST_WINDOW_DAYS,
} from '@/features/tickets/utils/ticket-list-filter'

export const REPORTING_PERIOD_DEFAULT_DAYS_KEY = 'reporting-period-default-days'

function isValidReportingPeriodDays(days: number): boolean {
  return Number.isInteger(days) && (TICKET_LIST_WINDOW_DAYS as readonly number[]).includes(days)
}

export function readReportingPeriodDefaultDays(): number {
  if (typeof window === 'undefined') {
    return DEFAULT_TICKET_LIST_WINDOW_DAYS
  }

  try {
    const raw = window.localStorage.getItem(REPORTING_PERIOD_DEFAULT_DAYS_KEY)
    if (raw === null || raw === '') {
      return DEFAULT_TICKET_LIST_WINDOW_DAYS
    }

    const parsed = Number(raw)
    if (!isValidReportingPeriodDays(parsed)) {
      return DEFAULT_TICKET_LIST_WINDOW_DAYS
    }

    return parsed
  } catch {
    return DEFAULT_TICKET_LIST_WINDOW_DAYS
  }
}

export function persistReportingPeriodDefaultDays(days: number) {
  if (!isValidReportingPeriodDays(days)) {
    return
  }

  try {
    window.localStorage.setItem(REPORTING_PERIOD_DEFAULT_DAYS_KEY, String(days))
  } catch {
    // Ignore storage errors (private mode, quota, etc.)
  }
}

export function getReportingPeriodOptionLabel(days: number): string {
  if (days === 0) {
    return 'Today'
  }
  if (days === 1) {
    return 'Last 1 day'
  }
  return `Last ${days} days`
}

export const REPORTING_PERIOD_OPTIONS = TICKET_LIST_WINDOW_DAYS.map((value) => ({
  value,
  label: getReportingPeriodOptionLabel(value),
}))
