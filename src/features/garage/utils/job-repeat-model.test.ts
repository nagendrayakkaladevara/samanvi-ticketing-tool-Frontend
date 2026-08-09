import { beforeEach, describe, expect, it, vi } from 'vitest'

import { makeRepairJob } from '@/test/fixtures/garage'
import {
  formatRepeatScheduledDate,
  getMinRepeatScheduleDateInput,
  hasPendingRepeatSchedule,
  hasProcessedRepeatSchedule,
  isValidRepeatScheduleDateInput,
  repeatScheduleDateInputToIso,
  repeatScheduledForToDateInput,
} from './job-repeat-model'

describe('formatRepeatScheduledDate', () => {
  it('returns em dash for empty values', () => {
    expect(formatRepeatScheduledDate(null)).toBe('—')
    expect(formatRepeatScheduledDate(undefined)).toBe('—')
  })

  it('formats valid dates via formatJobDate', () => {
    expect(formatRepeatScheduledDate('2024-06-15T10:00:00Z')).toMatch(/2024/)
  })
})

describe('getMinRepeatScheduleDateInput', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2024-06-15T12:00:00Z'))
  })

  it('returns tomorrow as YYYY-MM-DD', () => {
    expect(getMinRepeatScheduleDateInput()).toBe('2024-06-16')
  })
})

describe('isValidRepeatScheduleDateInput', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2024-06-15T12:00:00Z'))
  })

  it('rejects invalid and past dates', () => {
    expect(isValidRepeatScheduleDateInput('')).toBe(false)
    expect(isValidRepeatScheduleDateInput('2024-06-15')).toBe(false)
    expect(isValidRepeatScheduleDateInput('invalid')).toBe(false)
  })

  it('accepts tomorrow and future dates', () => {
    expect(isValidRepeatScheduleDateInput('2024-06-16')).toBe(true)
    expect(isValidRepeatScheduleDateInput('2024-07-01')).toBe(true)
  })
})

describe('repeatScheduleDateInputToIso', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2024-06-15T20:00:00Z'))
  })

  it('throws for invalid date input', () => {
    expect(() => repeatScheduleDateInputToIso('')).toThrow('Select a valid date for the repeat job.')
    expect(() => repeatScheduleDateInputToIso('bad')).toThrow('Select a valid date for the repeat job.')
  })

  it('throws when date is not in the future', () => {
    expect(() => repeatScheduleDateInputToIso('2024-06-15')).toThrow(
      'Repeat job must be scheduled for a future date.',
    )
  })

  it('returns ISO string for future date at noon local', () => {
    const iso = repeatScheduleDateInputToIso('2024-06-20')
    expect(iso).toMatch(/2024-06-20/)
    expect(new Date(iso).getTime()).toBeGreaterThan(Date.now())
  })
})

describe('repeatScheduledForToDateInput', () => {
  it('returns empty string for nullish values', () => {
    expect(repeatScheduledForToDateInput(null)).toBe('')
    expect(repeatScheduledForToDateInput(undefined)).toBe('')
  })

  it('converts master date to input value', () => {
    expect(repeatScheduledForToDateInput('15-06-2024')).toBe('2024-06-15')
  })
})

describe('hasPendingRepeatSchedule', () => {
  it('detects pending repeat when scheduled but not processed', () => {
    expect(
      hasPendingRepeatSchedule({ repeatScheduledFor: '2024-07-01', repeatProcessedAt: null }),
    ).toBe(true)
    expect(
      hasPendingRepeatSchedule({ repeatScheduledFor: '2024-07-01', repeatProcessedAt: '2024-07-02' }),
    ).toBe(false)
    expect(hasPendingRepeatSchedule(makeRepairJob())).toBe(false)
  })
})

describe('hasProcessedRepeatSchedule', () => {
  it('detects processed repeat schedule', () => {
    expect(hasProcessedRepeatSchedule({ repeatProcessedAt: '2024-07-02' })).toBe(true)
    expect(hasProcessedRepeatSchedule(makeRepairJob())).toBe(false)
  })
})
