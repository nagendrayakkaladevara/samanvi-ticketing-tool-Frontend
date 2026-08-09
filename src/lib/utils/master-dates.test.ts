import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  MASTER_DATE_WARNING_DAYS,
  dateToInputValue,
  formatMasterDateDisplay,
  getMasterDateHighlightStatus,
  inputValueToDate,
  inputValueToMasterDate,
  isMasterDateBeforeToday,
  isValidMasterDate,
  masterDateHighlightClassName,
  masterDateToInputValue,
} from './master-dates'

describe('master-dates', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 7, 9, 12, 0, 0))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('getMasterDateHighlightStatus', () => {
    it.each([
      [null, null],
      [undefined, null],
      ['', null],
      ['invalid', null],
      ['32-01-2026', null],
    ] as const)('returns null for invalid or empty value %j', (value, expected) => {
      expect(getMasterDateHighlightStatus(value)).toBe(expected)
    })

    it('returns expired for past DD-MM-YYYY dates', () => {
      expect(getMasterDateHighlightStatus('08-08-2026')).toBe('expired')
    })

    it('returns warning for today', () => {
      expect(getMasterDateHighlightStatus('09-08-2026')).toBe('warning')
    })

    it(`returns warning through +${MASTER_DATE_WARNING_DAYS} days`, () => {
      expect(getMasterDateHighlightStatus('15-08-2026')).toBe('warning')
    })

    it('returns null beyond warning window', () => {
      expect(getMasterDateHighlightStatus('16-08-2026')).toBeNull()
    })

    it('parses ISO date strings', () => {
      expect(getMasterDateHighlightStatus('2026-08-08')).toBe('expired')
    })
  })

  describe('isMasterDateBeforeToday', () => {
    it('is true only for expired dates', () => {
      expect(isMasterDateBeforeToday('08-08-2026')).toBe(true)
      expect(isMasterDateBeforeToday('09-08-2026')).toBe(false)
      expect(isMasterDateBeforeToday('20-08-2026')).toBe(false)
    })
  })

  describe('masterDateHighlightClassName', () => {
    it.each([
      ['expired', 'font-medium text-red-600 dark:text-red-400'],
      ['warning', 'font-medium text-orange-600 dark:text-orange-400'],
      [null, ''],
    ] as const)('maps %s to class string', (status, expected) => {
      expect(masterDateHighlightClassName(status)).toBe(expected)
    })
  })

  describe('formatMasterDateDisplay', () => {
    it.each([null, undefined, ''])('returns em dash for empty %j', (value) => {
      expect(formatMasterDateDisplay(value)).toBe('—')
    })

    it('formats valid DD-MM-YYYY', () => {
      const formatted = formatMasterDateDisplay('09-08-2026')
      expect(formatted).toMatch(/09/)
      expect(formatted).toMatch(/2026/)
    })

    it('formats valid ISO strings', () => {
      const formatted = formatMasterDateDisplay('2026-08-09')
      expect(formatted).toMatch(/09/)
      expect(formatted).toMatch(/2026/)
    })

    it('returns original value when unparseable', () => {
      expect(formatMasterDateDisplay('not-a-date')).toBe('not-a-date')
    })
  })

  describe('masterDateToInputValue', () => {
    it.each([null, undefined, ''])('returns empty string for %j', (value) => {
      expect(masterDateToInputValue(value)).toBe('')
    })

    it('converts DD-MM-YYYY to input value', () => {
      expect(masterDateToInputValue('09-08-2026')).toBe('2026-08-09')
    })

    it('converts ISO to input value', () => {
      expect(masterDateToInputValue('2026-08-09T00:00:00.000Z')).toMatch(/^2026-08-09$/)
    })

    it('returns empty string for invalid date', () => {
      expect(masterDateToInputValue('invalid')).toBe('')
    })
  })

  describe('inputValueToMasterDate', () => {
    it.each(['', '   '])('returns undefined for blank %j', (value) => {
      expect(inputValueToMasterDate(value)).toBeUndefined()
    })

    it('converts YYYY-MM-DD to DD-MM-YYYY', () => {
      expect(inputValueToMasterDate('2026-08-09')).toBe('09-08-2026')
    })

    it.each(['2026-8-9', 'not-a-date', '2026-13-40'])('returns undefined for invalid %j', (value) => {
      expect(inputValueToMasterDate(value)).toBeUndefined()
    })
  })

  describe('isValidMasterDate', () => {
    it.each(['09-08-2026', ' 09-08-2026 '])('accepts valid DD-MM-YYYY %j', (value) => {
      expect(isValidMasterDate(value)).toBe(true)
    })

    it.each(['2026-08-09', '9-8-2026', '09/08/2026', ''])('rejects invalid %j', (value) => {
      expect(isValidMasterDate(value)).toBe(false)
    })
  })

  describe('inputValueToDate', () => {
    it.each([null, undefined, '', 'bad'])('returns undefined for %j', (value) => {
      expect(inputValueToDate(value)).toBeUndefined()
    })

    it('parses YYYY-MM-DD', () => {
      const date = inputValueToDate('2026-08-09')
      expect(date).toBeInstanceOf(Date)
      expect(date?.getFullYear()).toBe(2026)
      expect(date?.getMonth()).toBe(7)
      expect(date?.getDate()).toBe(9)
    })
  })

  describe('dateToInputValue', () => {
    it('formats date as YYYY-MM-DD', () => {
      expect(dateToInputValue(new Date(2026, 7, 9))).toBe('2026-08-09')
    })
  })
})
