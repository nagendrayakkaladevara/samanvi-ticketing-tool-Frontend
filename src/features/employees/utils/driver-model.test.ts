import { describe, expect, it } from 'vitest'

import { makeDriver, validDriverFormValues } from '@/test/fixtures/employees'
import {
  buildDriverPayload,
  defaultDriverFormValues,
  driverToFormValues,
} from './driver-model'

describe('defaultDriverFormValues', () => {
  it('has empty required fields', () => {
    expect(defaultDriverFormValues.aadharName).toBe('')
    expect(defaultDriverFormValues.dlNumber).toBe('')
  })
})

describe('driverToFormValues', () => {
  it('maps driver entity to form values with date conversions', () => {
    const driver = makeDriver()
    const values = driverToFormValues(driver)

    expect(values.aadharName).toBe(driver.aadharName)
    expect(values.dateOfBirth).toBe('1990-01-01')
    expect(values.alternateMobile).toBe('')
    expect(values.remarks).toBe('')
  })
})

describe('buildDriverPayload', () => {
  it('builds create payload with required documents', () => {
    const payload = buildDriverPayload(validDriverFormValues, 'create')

    expect(payload.aadharName).toBe('John Driver')
    expect(payload.mobileNumber).toBe('9876543210')
    expect(payload.ifscCode).toBe('SBIN0001234')
    expect(payload.aadharCardFront).toBe('front.jpg')
    expect(payload.dlFront).toBe('dl-front.jpg')
    expect(payload.alternateMobile).toBeNull()
  })

  it('includes optional fields when provided', () => {
    const payload = buildDriverPayload(
      {
        ...validDriverFormValues,
        alternateMobile: '9876543219',
        emergencyNumber: '9876543218',
        upiId: 'john@upi',
        remarks: 'Note',
        dateOfLeaving: '2024-01-01',
        upiScanner: 'scan.jpg',
      },
      'create',
    )

    expect(payload.alternateMobile).toBe('9876543219')
    expect(payload.emergencyNumber).toBe('9876543218')
    expect(payload.upiId).toBe('john@upi')
    expect(payload.remarks).toBe('Note')
    expect(payload.dateOfLeaving).toBe('01-01-2024')
    expect(payload.upiScanner).toBe('scan.jpg')
  })

  it('edit mode only includes documents when trimmed non-empty', () => {
    const payload = buildDriverPayload(
      { ...validDriverFormValues, aadharCardFront: '', dlFront: 'new-front.jpg' },
      'edit',
    )

    expect(payload.aadharCardFront).toBeUndefined()
    expect(payload.dlFront).toBe('new-front.jpg')
  })

  it('throws for invalid required fields', () => {
    expect(() =>
      buildDriverPayload({ ...validDriverFormValues, mobileNumber: '123' }, 'create'),
    ).toThrow('Mobile number must be exactly 10 digits.')
  })
})
