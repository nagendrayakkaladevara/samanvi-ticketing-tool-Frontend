import type { Ticket } from '@/features/tickets/types/ticket'

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

/** Dashboard-only filters that are not stored API status values. */
export const TICKET_LIST_VIRTUAL_FILTERS = [
  'open',
  'unassigned',
  'closed_resolved',
  'overdue',
] as const

export type TicketListVirtualFilter = (typeof TICKET_LIST_VIRTUAL_FILTERS)[number]

export type TicketListFilter = TicketListApiStatus | TicketListVirtualFilter

const API_STATUS_LABELS: Record<TicketListApiStatus, string> = {
  created: 'Created',
  assigned: 'Assigned',
  in_progress: 'In Progress',
  blocked: 'Blocked',
  resolved: 'Resolved',
  closed: 'Closed',
  reopened: 'Reopened',
}

const VIRTUAL_FILTER_LABELS: Record<TicketListVirtualFilter, string> = {
  open: 'Open Tickets',
  unassigned: 'Unassigned',
  closed_resolved: 'Closed / Resolved',
  overdue: 'Overdue',
}

const CLOSED_STATUSES = new Set<Ticket['status']>(['CLOSED', 'RESOLVED'])

export function isTicketListApiStatus(value: string): value is TicketListApiStatus {
  return (TICKET_LIST_API_STATUSES as readonly string[]).includes(value)
}

export function isTicketListVirtualFilter(value: string): value is TicketListVirtualFilter {
  return (TICKET_LIST_VIRTUAL_FILTERS as readonly string[]).includes(value)
}

export function isTicketListFilter(value: string): value is TicketListFilter {
  return isTicketListApiStatus(value) || isTicketListVirtualFilter(value)
}

export function getTicketListFilterLabel(filter: TicketListFilter): string {
  if (isTicketListApiStatus(filter)) {
    return API_STATUS_LABELS[filter]
  }
  return VIRTUAL_FILTER_LABELS[filter]
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

function isSlaOverdue(rawSlaDueAt: string): boolean {
  if (!rawSlaDueAt) {
    return false
  }

  const parsed = new Date(rawSlaDueAt)
  if (Number.isNaN(parsed.getTime())) {
    return false
  }

  return parsed.getTime() < Date.now()
}

export function applyTicketListVirtualFilter(tickets: Ticket[], filter: TicketListVirtualFilter): Ticket[] {
  switch (filter) {
    case 'open':
      return tickets.filter((ticket) => !CLOSED_STATUSES.has(ticket.status))
    case 'unassigned':
      return tickets.filter(
        (ticket) => !CLOSED_STATUSES.has(ticket.status) && !ticket.assignedToUserId?.trim(),
      )
    case 'closed_resolved':
      return tickets.filter((ticket) => CLOSED_STATUSES.has(ticket.status))
    case 'overdue':
      return tickets.filter((ticket) => ticket.status !== 'CLOSED' && isSlaOverdue(ticket.slaDueAt))
  }
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
