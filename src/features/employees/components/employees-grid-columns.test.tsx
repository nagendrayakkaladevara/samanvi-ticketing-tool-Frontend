import { describe, expect, it } from 'vitest'

import { makeDriver, makeHelper, makeOfficeStaff } from '@/test/fixtures/employees'

import {
  driverDataColumnDefs,
  driverMobileBadge,
  driverMobileFields,
  helperMobileBadge,
  officeStaffMobileBadge,
} from './employees-grid-columns'

describe('employees-grid-columns', () => {
  it('exports driver column definitions', () => {
    expect(driverDataColumnDefs.length).toBeGreaterThan(0)
    expect(driverMobileFields.length).toBeGreaterThan(0)
    expect(driverMobileBadge(makeDriver())).toBeTruthy()
  })

  it('exports helper and office staff badges', () => {
    expect(helperMobileBadge(makeHelper())).toBeTruthy()
    expect(officeStaffMobileBadge(makeOfficeStaff())).toBeTruthy()
  })
})
