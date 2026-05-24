/** Stored ticket statuses accepted by GET /tickets?status= */
export const TICKET_LIST_API_STATUSES = [
  'created',
  'assigned',
  'in_progress',
  'blocked',
  'resolved',
  'closed',
  'reopened',
] as const

export type TicketListApiStatus = (typeof TICKET_LIST_API_STATUSES)[number]

/** Aggregate statuses accepted by GET /tickets?status= (not stored ticket rows). */
export const TICKET_LIST_AGGREGATE_STATUSES = ['open', 'unassigned', 'overdue'] as const

export type TicketListAggregateStatus = (typeof TICKET_LIST_AGGREGATE_STATUSES)[number]

/** Status values sent to GET /tickets?status= */
export const TICKET_LIST_QUERY_STATUSES = [
  ...TICKET_LIST_API_STATUSES,
  ...TICKET_LIST_AGGREGATE_STATUSES,
] as const

export type TicketListQueryStatus = (typeof TICKET_LIST_QUERY_STATUSES)[number]

/** Filters that require multiple API calls or a dedicated route segment. */
export const TICKET_LIST_SPECIAL_FILTERS = ['closed_resolved'] as const

export type TicketListSpecialFilter = (typeof TICKET_LIST_SPECIAL_FILTERS)[number]

export type TicketListFilter = TicketListQueryStatus | TicketListSpecialFilter

const API_STATUS_LABELS: Record<TicketListApiStatus, string> = {
  created: 'Created',
  assigned: 'Assigned',
  in_progress: 'In Progress',
  blocked: 'Blocked',
  resolved: 'Resolved',
  closed: 'Closed',
  reopened: 'Reopened',
}

const AGGREGATE_STATUS_LABELS: Record<TicketListAggregateStatus, string> = {
  open: 'Open Tickets',
  unassigned: 'Unassigned',
  overdue: 'Overdue',
}

const SPECIAL_FILTER_LABELS: Record<TicketListSpecialFilter, string> = {
  closed_resolved: 'Closed / Resolved',
}

export function isTicketListApiStatus(value: string): value is TicketListApiStatus {
  return (TICKET_LIST_API_STATUSES as readonly string[]).includes(value)
}

export function isTicketListAggregateStatus(value: string): value is TicketListAggregateStatus {
  return (TICKET_LIST_AGGREGATE_STATUSES as readonly string[]).includes(value)
}

export function isTicketListQueryStatus(value: string): value is TicketListQueryStatus {
  return (TICKET_LIST_QUERY_STATUSES as readonly string[]).includes(value)
}

export function isTicketListSpecialFilter(value: string): value is TicketListSpecialFilter {
  return (TICKET_LIST_SPECIAL_FILTERS as readonly string[]).includes(value)
}

export function isTicketListFilter(value: string): value is TicketListFilter {
  return isTicketListQueryStatus(value) || isTicketListSpecialFilter(value)
}

export function getTicketListFilterLabel(filter: TicketListFilter): string {
  if (isTicketListApiStatus(filter)) {
    return API_STATUS_LABELS[filter]
  }
  if (isTicketListAggregateStatus(filter)) {
    return AGGREGATE_STATUS_LABELS[filter]
  }
  return SPECIAL_FILTER_LABELS[filter]
}

/** Allowed dashboard period values (must match DashboardPage WINDOW_DAYS_OPTIONS). */
export const TICKET_LIST_WINDOW_DAYS = [0, 1, 2, 6, 14, 30, 60, 90] as const

export const DEFAULT_TICKET_LIST_WINDOW_DAYS = 2

export function parseTicketListWindowDays(raw: string | null): number {
  if (raw === null || raw === '') {
    return DEFAULT_TICKET_LIST_WINDOW_DAYS
  }

  const parsed = Number(raw)
  if (!Number.isInteger(parsed) || !(TICKET_LIST_WINDOW_DAYS as readonly number[]).includes(parsed)) {
    return DEFAULT_TICKET_LIST_WINDOW_DAYS
  }

  return parsed
}

export function formatTicketListWindowLabel(days: number): string {
  if (days === 0) {
    return 'today'
  }
  if (days === 1) {
    return 'the last 1 day'
  }
  return `the last ${days} days`
}

export function getTicketsByStatusPath(
  filter: TicketListFilter,
  days: number = DEFAULT_TICKET_LIST_WINDOW_DAYS,
): string {
  const windowDays = parseTicketListWindowDays(String(days))
  return `/tickets/by-status/${filter}?days=${windowDays}`
}

/** Maps dashboard queue status keys to list filters. */
export function queueStatusToTicketListFilter(status: string): TicketListFilter | null {
  if (status === 'unassigned') {
    return 'unassigned'
  }
  if (isTicketListApiStatus(status)) {
    return status
  }
  return null
}

/** Maps dashboard summary cards to navigable list filters (total is excluded). */
export function dashboardSummaryCardToFilter(cardTitle: string): TicketListFilter | null {
  switch (cardTitle) {
    case 'Open Tickets':
      return 'open'
    case 'Unassigned':
      return 'unassigned'
    case 'In Progress':
      return 'in_progress'
    case 'Closed / Resolved':
      return 'closed_resolved'
    case 'Overdue':
      return 'overdue'
    default:
      return null
  }
}
