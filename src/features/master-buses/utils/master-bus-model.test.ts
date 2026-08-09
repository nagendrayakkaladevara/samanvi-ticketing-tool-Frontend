import { describe, expect, it } from 'vitest'

import { makeMasterBus } from '@/test/fixtures/masters'
import {
  compareMasterBusesByNumber,
  defaultMasterBusFormValues,
  masterBusToFormValues,
  toMasterBusGridRow,
} from './master-bus-model'

describe('masterBusToFormValues', () => {
  it('maps bus entity to form values', () => {
    const bus = makeMasterBus({ odometer: 75000 })
    const values = masterBusToFormValues(bus)
    expect(values.busNumber).toBe('BUS-01')
    expect(values.odometer).toBe('75000')
    expect(values.purchaseDate).toBe('2020-01-01')
    expect(values.remarks).toBe('Test bus')
  })
})

describe('toMasterBusGridRow', () => {
  it('maps bus to grid row with formatted labels', () => {
    const row = toMasterBusGridRow(makeMasterBus())
    expect(row.busNumber).toBe('BUS-01')
    expect(row.purchaseDateLabel).toMatch(/2020/)
    expect(row.insuranceValidityLabel).toMatch(/2025/)
    expect(row.remarks).toBe('Test bus')
  })
})

describe('compareMasterBusesByNumber', () => {
  it('sorts bus numbers numerically', () => {
    const a = makeMasterBus({ busNumber: 'BUS-10' })
    const b = makeMasterBus({ busNumber: 'BUS-2' })
    expect(compareMasterBusesByNumber(a, b)).toBeGreaterThan(0)
  })
})

describe('defaultMasterBusFormValues', () => {
  it('has empty defaults', () => {
    expect(defaultMasterBusFormValues.busNumber).toBe('')
    expect(defaultMasterBusFormValues.odometer).toBe('')
  })
})
