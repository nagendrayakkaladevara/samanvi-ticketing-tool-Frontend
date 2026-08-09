import { describe, expect, it } from 'vitest'

import { makeSpareTank } from '@/test/fixtures/masters'
import {
  compareSpareTanksByBusNumber,
  formatSpareTankUpdatedAt,
  toSpareTankGridRow,
} from './spare-tank-model'

describe('toSpareTankGridRow', () => {
  it('maps spare tank to grid row', () => {
    const row = toSpareTankGridRow(makeSpareTank())
    expect(row.busNumber).toBe('BUS-01')
    expect(row.ownerName).toBe('Owner Name')
    expect(row.updatedAtLabel).toMatch(/2024/)
  })
})

describe('compareSpareTanksByBusNumber', () => {
  it('sorts by bus number numerically', () => {
    const a = makeSpareTank({ busNumber: 'BUS-10' })
    const b = makeSpareTank({ busNumber: 'BUS-2' })
    expect(compareSpareTanksByBusNumber(a, b)).toBeGreaterThan(0)
  })
})

describe('formatSpareTankUpdatedAt', () => {
  it('returns em dash for invalid dates', () => {
    expect(formatSpareTankUpdatedAt(undefined)).toBe('—')
    expect(formatSpareTankUpdatedAt('bad')).toBe('—')
  })

  it('formats valid dates', () => {
    expect(formatSpareTankUpdatedAt('2024-06-01T10:00:00Z')).toMatch(/2024/)
  })
})
