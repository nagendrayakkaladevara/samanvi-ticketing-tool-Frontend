import { describe, expect, it } from 'vitest'

import { makeRepairPart } from '@/test/fixtures/garage'
import {
  compareRepairPartsByName,
  formatRepairPartPrice,
  formatRepairPartUpdatedAt,
  getRepairPartFieldError,
  validateRepairPartForm,
} from './repair-part-model'

describe('formatRepairPartPrice', () => {
  it('formats numeric prices with two decimals', () => {
    expect(formatRepairPartPrice('10.5')).toMatch(/10\.50/)
    expect(formatRepairPartPrice('1000')).toMatch(/1,000\.00|1000\.00/)
  })

  it('returns original string for non-numeric values', () => {
    expect(formatRepairPartPrice('N/A')).toBe('N/A')
  })
})

describe('formatRepairPartUpdatedAt', () => {
  it('returns em dash for empty or invalid dates', () => {
    expect(formatRepairPartUpdatedAt(undefined)).toBe('—')
    expect(formatRepairPartUpdatedAt('bad')).toBe('—')
  })

  it('formats valid dates', () => {
    expect(formatRepairPartUpdatedAt('2024-06-01T10:00:00Z')).toMatch(/2024/)
  })
})

describe('compareRepairPartsByName', () => {
  it('sorts by part name', () => {
    const a = makeRepairPart({ partName: 'Alpha' })
    const b = makeRepairPart({ partName: 'Beta' })
    expect(compareRepairPartsByName(a, b)).toBeLessThan(0)
    expect(compareRepairPartsByName(b, a)).toBeGreaterThan(0)
  })
})

describe('getRepairPartFieldError', () => {
  const base = { partName: 'Filter', price: '10.00', description: 'Notes' }

  it('validates partName', () => {
    expect(getRepairPartFieldError('partName', { ...base, partName: '' })).toBe(
      'Part name is required.',
    )
    expect(getRepairPartFieldError('partName', { ...base, partName: '   ' })).toBe(
      'Part name is required.',
    )
    expect(getRepairPartFieldError('partName', { ...base, partName: 'a'.repeat(121) })).toBe(
      'Part name must be 120 characters or fewer.',
    )
    expect(getRepairPartFieldError('partName', base)).toBeUndefined()
  })

  it('validates price', () => {
    expect(getRepairPartFieldError('price', { ...base, price: '' })).toBe('Price is required.')
    expect(getRepairPartFieldError('price', { ...base, price: '-1' })).toBe(
      'Enter a valid non-negative price.',
    )
    expect(getRepairPartFieldError('price', { ...base, price: 'abc' })).toBe(
      'Enter a valid non-negative price.',
    )
    expect(getRepairPartFieldError('price', { ...base, price: '0' })).toBeUndefined()
  })

  it('validates description length', () => {
    expect(getRepairPartFieldError('description', { ...base, description: 'a'.repeat(501) })).toBe(
      'Description must be 500 characters or fewer.',
    )
    expect(getRepairPartFieldError('description', base)).toBeUndefined()
    expect(getRepairPartFieldError('description', { ...base, description: '' })).toBeUndefined()
  })
})

describe('validateRepairPartForm', () => {
  it('collects all field errors', () => {
    const errors = validateRepairPartForm({ partName: '', price: '', description: 'a'.repeat(501) })
    expect(errors.partName).toBeDefined()
    expect(errors.price).toBeDefined()
    expect(errors.description).toBeDefined()
  })

  it('returns empty object when valid', () => {
    expect(
      validateRepairPartForm({ partName: 'Filter', price: '10', description: 'ok' }),
    ).toEqual({})
  })
})
