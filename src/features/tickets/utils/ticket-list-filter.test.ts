import { beforeEach, describe, expect, it } from 'vitest'

import { REPORTING_PERIOD_DEFAULT_DAYS_KEY } from '@/features/preferences/reporting-period'

import {
  dashboardSummaryCardToFilter,
  DEFAULT_TICKET_LIST_WINDOW_DAYS,
  formatTicketListWindowLabel,
  getTicketListFilterLabel,
  getTicketsByStatusPath,
  isTicketListAggregateStatus,
  isTicketListApiStatus,
  isTicketListFilter,
  isTicketListQueryStatus,
  isTicketListSpecialFilter,
  parseTicketListWindowDays,
  queueStatusToTicketListFilter,
  TICKET_LIST_API_STATUSES,
  TICKET_LIST_AGGREGATE_STATUSES,
  TICKET_LIST_QUERY_STATUSES,
  TICKET_LIST_SPECIAL_FILTERS,
  TICKET_LIST_WINDOW_DAYS,
} from './ticket-list-filter'

describe('type guards', () => {
  it.each(TICKET_LIST_API_STATUSES)('isTicketListApiStatus(%s) is true', (status) => {
    expect(isTicketListApiStatus(status)).toBe(true)
  })

  it.each(TICKET_LIST_AGGREGATE_STATUSES)('isTicketListAggregateStatus(%s) is true', (status) => {
    expect(isTicketListAggregateStatus(status)).toBe(true)
  })

  it.each(TICKET_LIST_QUERY_STATUSES)('isTicketListQueryStatus(%s) is true', (status) => {
    expect(isTicketListQueryStatus(status)).toBe(true)
  })

  it.each(TICKET_LIST_SPECIAL_FILTERS)('isTicketListSpecialFilter(%s) is true', (filter) => {
    expect(isTicketListSpecialFilter(filter)).toBe(true)
  })

  it.each(['invalid', '', 'CREATED', 'total'])('rejects unknown value %s', (value) => {
    expect(isTicketListFilter(value)).toBe(false)
  })

  it.each([...TICKET_LIST_QUERY_STATUSES, ...TICKET_LIST_SPECIAL_FILTERS])(
    'isTicketListFilter(%s) is true',
    (filter) => {
      expect(isTicketListFilter(filter)).toBe(true)
    },
  )
})

describe('getTicketListFilterLabel', () => {
  it.each([
    ['created', 'Created'],
    ['open', 'Open Tickets'],
    ['closed_resolved', 'Closed / Resolved'],
  ] as const)('labels %s as %s', (filter, label) => {
    expect(getTicketListFilterLabel(filter)).toBe(label)
  })
})

describe('parseTicketListWindowDays', () => {
  beforeEach(() => {
    localStorage.removeItem(REPORTING_PERIOD_DEFAULT_DAYS_KEY)
  })

  it.each([null, ''] as const)('returns preference fallback for %s', (raw) => {
    expect(parseTicketListWindowDays(raw)).toBe(DEFAULT_TICKET_LIST_WINDOW_DAYS)
  })

  it.each(TICKET_LIST_WINDOW_DAYS)('accepts allowed window %s', (days) => {
    expect(parseTicketListWindowDays(String(days))).toBe(days)
  })

  it.each(['3', '4.5', 'abc', '100', '-1'])('rejects invalid window %s', (raw) => {
    expect(parseTicketListWindowDays(raw)).toBe(DEFAULT_TICKET_LIST_WINDOW_DAYS)
  })

  it('uses stored reporting period preference as fallback', () => {
    localStorage.setItem(REPORTING_PERIOD_DEFAULT_DAYS_KEY, '30')
    expect(parseTicketListWindowDays(null)).toBe(30)
  })
})

describe('formatTicketListWindowLabel', () => {
  it.each([
    [0, 'today'],
    [1, 'the last 1 day'],
    [14, 'the last 14 days'],
  ] as const)('formats %s days', (days, label) => {
    expect(formatTicketListWindowLabel(days)).toBe(label)
  })
})

describe('getTicketsByStatusPath', () => {
  it('builds path with filter and days query', () => {
    expect(getTicketsByStatusPath('open', 14)).toBe('/tickets/by-status/open?days=14')
    expect(getTicketsByStatusPath('closed_resolved')).toBe(
      `/tickets/by-status/closed_resolved?days=${DEFAULT_TICKET_LIST_WINDOW_DAYS}`,
    )
  })

  it('rejects invalid days in path builder', () => {
    expect(getTicketsByStatusPath('open', 99)).toBe(`/tickets/by-status/open?days=${DEFAULT_TICKET_LIST_WINDOW_DAYS}`)
  })
})

describe('queueStatusToTicketListFilter', () => {
  it('maps unassigned and api statuses', () => {
    expect(queueStatusToTicketListFilter('unassigned')).toBe('unassigned')
    expect(queueStatusToTicketListFilter('in_progress')).toBe('in_progress')
  })

  it('returns null for unknown status', () => {
    expect(queueStatusToTicketListFilter('total')).toBeNull()
  })
})

describe('dashboardSummaryCardToFilter', () => {
  it.each([
    ['Open Tickets', 'open'],
    ['Unassigned', 'unassigned'],
    ['In Progress', 'in_progress'],
    ['Closed / Resolved', 'closed_resolved'],
    ['Overdue', 'overdue'],
  ] as const)('maps card %s', (title, filter) => {
    expect(dashboardSummaryCardToFilter(title)).toBe(filter)
  })

  it('returns null for unknown card title', () => {
    expect(dashboardSummaryCardToFilter('Total')).toBeNull()
  })
})
