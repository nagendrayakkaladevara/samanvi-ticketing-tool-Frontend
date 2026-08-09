import { describe, expect, it } from 'vitest'

import { makeServiceNumber } from '@/test/fixtures/masters'
import {
  buildServiceNumberPayload,
  compareServiceNumbersByNo,
  defaultServiceNumberFormValues,
  formatAmount,
  formatDateTime,
  formatDistance,
  serviceNumberToFormValues,
  toServiceNumberGridRow,
} from './service-number-model'

describe('serviceNumberToFormValues', () => {
  it('maps service number to form values', () => {
    const item = makeServiceNumber()
    const values = serviceNumberToFormValues(item)
    expect(values.serviceNo).toBe('101')
    expect(values.parkingAmount).toBe('100')
    expect(values.serviceForId).toBe('sf-1')
  })
})

describe('toServiceNumberGridRow', () => {
  it('maps to grid row with route and labels', () => {
    const row = toServiceNumberGridRow(makeServiceNumber())
    expect(row.route).toBe('City A → City B')
    expect(row.distanceLabel).toContain('km')
    expect(row.updatedAtLabel).toMatch(/2024/)
  })
})

describe('compareServiceNumbersByNo', () => {
  it('sorts numerically by service number', () => {
    const a = makeServiceNumber({ serviceNo: '10' })
    const b = makeServiceNumber({ serviceNo: '2' })
    expect(compareServiceNumbersByNo(a, b)).toBeGreaterThan(0)
  })
})

describe('formatAmount', () => {
  it('formats numbers', () => {
    expect(formatAmount(1000)).toMatch(/1,000|1000/)
    expect(formatAmount(10.5)).toMatch(/10\.5/)
  })
})

describe('formatDistance', () => {
  it('includes km suffix', () => {
    expect(formatDistance(120)).toContain('km')
  })
})

describe('formatDateTime', () => {
  it('returns em dash for invalid dates', () => {
    expect(formatDateTime(undefined)).toBe('—')
    expect(formatDateTime('bad')).toBe('—')
  })

  it('formats valid dates', () => {
    expect(formatDateTime('2024-06-01T10:00:00Z')).toMatch(/2024/)
  })
})

describe('buildServiceNumberPayload', () => {
  const valid = {
    serviceForId: 'sf-1',
    serviceNo: '101',
    from: 'A',
    to: 'B',
    via: 'Highway',
    parkingAmount: '100',
    driverOneBeta: '50',
    driverTwoBeta: '40',
    helperBeta: '30',
    conductorBeta: '20',
    distance: '120',
    optDriver: 'Driver',
    optHelper: 'Helper',
    remarks: 'Notes',
  }

  it('builds payload with defaults for empty numeric fields', () => {
    const payload = buildServiceNumberPayload({
      ...valid,
      parkingAmount: '',
      driverOneBeta: '',
      driverTwoBeta: '',
      helperBeta: '',
      conductorBeta: '',
      distance: '',
    })
    expect(payload.parkingAmount).toBe(0)
    expect(payload.distance).toBe(0)
  })

  it('throws when serviceForId is missing', () => {
    expect(() => buildServiceNumberPayload({ ...valid, serviceForId: '' })).toThrow(
      'Service For is required.',
    )
  })

  it('throws for invalid numeric fields', () => {
    expect(() => buildServiceNumberPayload({ ...valid, parkingAmount: '-1' })).toThrow(
      'Parking amount must be a number greater than or equal to 0.',
    )
    expect(() => buildServiceNumberPayload({ ...valid, distance: 'abc' })).toThrow(
      'Distance must be a number greater than or equal to 0.',
    )
  })

  it('throws for required text validation', () => {
    expect(() => buildServiceNumberPayload({ ...valid, serviceNo: '' })).toThrow(
      'Service number is required.',
    )
    expect(() => buildServiceNumberPayload({ ...valid, remarks: 'a'.repeat(501) })).toThrow(
      'Remarks must be 500 characters or fewer.',
    )
  })
})

describe('defaultServiceNumberFormValues', () => {
  it('has empty defaults', () => {
    expect(defaultServiceNumberFormValues.serviceNo).toBe('')
  })
})
