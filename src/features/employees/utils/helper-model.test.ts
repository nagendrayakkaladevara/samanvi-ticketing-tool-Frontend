import { describe, expect, it } from 'vitest'

import { makeHelper } from '@/test/fixtures/employees'
import { buildHelperPayload, defaultHelperFormValues, helperToFormValues } from './helper-model'

const validHelperValues = {
  aadharName: 'Helper One',
  nickName: 'Helper',
  dateOfBirth: '1990-01-01',
  mobileNumber: '9876543211',
  alternateNumber: '',
  emergencyMobile: '',
  aadharNumber: '123456789013',
  accountHolderName: 'Helper One',
  accountNumber: '1234567891',
  bankName: 'Test Bank',
  branchName: 'Main Branch',
  ifscCode: 'SBIN0001234',
  upiId: '',
  dateOfJoining: '2020-06-01',
  dateOfLeaving: '',
  reference: 'Ref Person',
  remarks: '',
  aadharCardFront: 'front.jpg',
  aadharCardBack: 'back.jpg',
  upiScanner: '',
}

describe('helperToFormValues', () => {
  it('maps helper to form values', () => {
    const values = helperToFormValues(makeHelper())
    expect(values.nickName).toBe('Helper')
    expect(values.dateOfBirth).toBe('1990-01-01')
  })
})

describe('buildHelperPayload', () => {
  it('builds create payload with required documents', () => {
    const payload = buildHelperPayload(validHelperValues, 'create')
    expect(payload.nickName).toBe('Helper')
    expect(payload.aadharCardFront).toBe('front.jpg')
    expect(payload.alternateNumber).toBeNull()
  })

  it('includes optional fields in create mode', () => {
    const payload = buildHelperPayload(
      {
        ...validHelperValues,
        alternateNumber: '9876543219',
        emergencyMobile: '9876543218',
        upiId: 'helper@upi',
        remarks: 'Note',
        upiScanner: 'scan.jpg',
      },
      'create',
    )
    expect(payload.alternateNumber).toBe('9876543219')
    expect(payload.upiScanner).toBe('scan.jpg')
  })

  it('edit mode conditionally includes documents', () => {
    const payload = buildHelperPayload(
      { ...validHelperValues, aadharCardFront: 'updated.jpg', upiScanner: 'new-scan.jpg' },
      'edit',
    )
    expect(payload.aadharCardFront).toBe('updated.jpg')
    expect(payload.upiScanner).toBe('new-scan.jpg')
  })

  it('edit mode omits blank optional fields and documents', () => {
    const payload = buildHelperPayload(
      {
        ...validHelperValues,
        alternateNumber: '',
        emergencyMobile: '',
        upiId: '',
        remarks: '',
        dateOfLeaving: '',
        aadharCardFront: '',
        aadharCardBack: '',
        upiScanner: '',
      },
      'edit',
    )
    expect(payload.alternateNumber).toBeNull()
    expect(payload.aadharCardFront).toBeUndefined()
    expect(payload.upiScanner).toBeNull()
  })

  it('edit mode includes aadharCardBack when provided', () => {
    const payload = buildHelperPayload(
      { ...validHelperValues, aadharCardBack: 'back-updated.jpg' },
      'edit',
    )
    expect(payload.aadharCardBack).toBe('back-updated.jpg')
  })
})

describe('defaultHelperFormValues', () => {
  it('starts with empty strings', () => {
    expect(defaultHelperFormValues.aadharName).toBe('')
  })
})
