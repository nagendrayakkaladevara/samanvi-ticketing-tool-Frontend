import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/features/tickets/utils/ticket-list-filter', () => ({
  DEFAULT_TICKET_LIST_WINDOW_DAYS: 2,
  TICKET_LIST_WINDOW_DAYS: [0, 1, 2, 6, 14, 30, 60, 90],
}))

import {
  DEFAULT_TICKET_LIST_WINDOW_DAYS,
  TICKET_LIST_WINDOW_DAYS,
} from '@/features/tickets/utils/ticket-list-filter'
import {
  getReportingPeriodOptionLabel,
  persistReportingPeriodDefaultDays,
  readReportingPeriodDefaultDays,
  REPORTING_PERIOD_DEFAULT_DAYS_KEY,
  REPORTING_PERIOD_OPTIONS,
} from './reporting-period'

describe('reporting-period', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  describe('readReportingPeriodDefaultDays', () => {
    it('returns default when storage is empty', () => {
      expect(readReportingPeriodDefaultDays()).toBe(DEFAULT_TICKET_LIST_WINDOW_DAYS)
    })

    it('returns stored valid days', () => {
      localStorage.setItem(REPORTING_PERIOD_DEFAULT_DAYS_KEY, '14')
      expect(readReportingPeriodDefaultDays()).toBe(14)
    })

    it.each(['', 'invalid', '3.5', '999'])('rejects invalid raw value %s', (raw) => {
      localStorage.setItem(REPORTING_PERIOD_DEFAULT_DAYS_KEY, raw)
      expect(readReportingPeriodDefaultDays()).toBe(DEFAULT_TICKET_LIST_WINDOW_DAYS)
    })
  })

  describe('persistReportingPeriodDefaultDays', () => {
    it('persists only allowed window day values', () => {
      persistReportingPeriodDefaultDays(30)
      expect(localStorage.getItem(REPORTING_PERIOD_DEFAULT_DAYS_KEY)).toBe('30')

      persistReportingPeriodDefaultDays(999)
      expect(localStorage.getItem(REPORTING_PERIOD_DEFAULT_DAYS_KEY)).toBe('30')
    })
  })

  describe('getReportingPeriodOptionLabel', () => {
    it.each([
      [0, 'Today'],
      [1, 'Last 1 day'],
      [14, 'Last 14 days'],
    ] as const)('formats %i days as %s', (days, label) => {
      expect(getReportingPeriodOptionLabel(days)).toBe(label)
    })
  })

  it('exports options for every allowed window day', () => {
    expect(REPORTING_PERIOD_OPTIONS.map((option) => option.value)).toEqual([...TICKET_LIST_WINDOW_DAYS])
    expect(REPORTING_PERIOD_OPTIONS[0]).toEqual({ value: 0, label: 'Today' })
  })
})
