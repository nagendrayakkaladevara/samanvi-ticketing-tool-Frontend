import { describe, expect, it } from 'vitest'

import { makeRepairJobPart } from '@/test/fixtures/garage'
import {
  formatJobPartAddedAt,
  formatJobPartLineTotal,
  formatJobPartsTotal,
  getJobPartLineTotal,
  getJobPartsTotal,
} from './job-part-model'

describe('getJobPartLineTotal', () => {
  it('multiplies quantity by unit price', () => {
    expect(getJobPartLineTotal(makeRepairJobPart({ quantity: 3, unitPrice: '10.00' }))).toBe(30)
  })

  it('returns 0 for invalid unit price', () => {
    expect(getJobPartLineTotal(makeRepairJobPart({ unitPrice: 'invalid' }))).toBe(0)
  })
})

describe('formatJobPartLineTotal', () => {
  it('formats line total as currency string', () => {
    const formatted = formatJobPartLineTotal(makeRepairJobPart({ quantity: 2, unitPrice: '10.50' }))
    expect(formatted).toMatch(/21/)
  })
})

describe('getJobPartsTotal', () => {
  it('sums all part line totals', () => {
    const parts = [
      makeRepairJobPart({ quantity: 2, unitPrice: '10.00' }),
      makeRepairJobPart({ id: 'p2', quantity: 1, unitPrice: '5.00' }),
    ]
    expect(getJobPartsTotal(parts)).toBe(25)
  })

  it('returns 0 for empty array', () => {
    expect(getJobPartsTotal([])).toBe(0)
  })
})

describe('formatJobPartsTotal', () => {
  it('formats aggregate total', () => {
    const parts = [makeRepairJobPart({ quantity: 2, unitPrice: '10.00' })]
    expect(formatJobPartsTotal(parts)).toMatch(/20/)
  })
})

describe('formatJobPartAddedAt', () => {
  it('returns em dash for missing or invalid dates', () => {
    expect(formatJobPartAddedAt(undefined)).toBe('—')
    expect(formatJobPartAddedAt('bad')).toBe('—')
  })

  it('formats valid dates', () => {
    const formatted = formatJobPartAddedAt('2024-06-01T10:00:00Z')
    expect(formatted).toMatch(/2024/)
    expect(formatted).not.toBe('—')
  })
})
