import { describe, expect, it } from 'vitest'

import { makeOfficeStaff } from '@/test/fixtures/employees'
import {
  buildOfficeStaffPayload,
  defaultOfficeStaffFormValues,
  officeStaffToFormValues,
} from './office-staff-model'

const validStaffValues = {
  aadharName: 'Staff Member',
  nickName: 'Staff',
  designation: 'Clerk',
  dateOfBirth: '1990-01-01',
  mobileNumber: '9876543212',
  alternativeMobile: '',
  emergencyContact: '',
  aadharNumber: '123456789014',
  accountHolderName: 'Staff Member',
  accountNumber: '1234567892',
  bankName: 'Test Bank',
  branchName: 'Main Branch',
  ifscCode: 'SBIN0001234',
  upiId: '',
  dateOfJoining: '2020-06-01',
  dateOfLeaving: '',
  referenceName: 'Ref Person',
  remarks: '',
  aadharCardFront: 'front.jpg',
  aadharCardBack: 'back.jpg',
  upiScanner: '',
}

describe('officeStaffToFormValues', () => {
  it('maps office staff to form values', () => {
    const values = officeStaffToFormValues(makeOfficeStaff())
    expect(values.designation).toBe('Clerk')
    expect(values.dateOfJoining).toBe('2020-06-01')
  })
})

describe('buildOfficeStaffPayload', () => {
  it('builds create payload', () => {
    const payload = buildOfficeStaffPayload(validStaffValues, 'create')
    expect(payload.designation).toBe('Clerk')
    expect(payload.aadharCardFront).toBe('front.jpg')
    expect(payload.alternativeMobile).toBeNull()
  })

  it('includes optional fields when provided', () => {
    const payload = buildOfficeStaffPayload(
      {
        ...validStaffValues,
        alternativeMobile: '9876543219',
        emergencyContact: '9876543218',
        upiId: 'staff@upi',
        remarks: 'Note',
        upiScanner: 'scan.jpg',
      },
      'create',
    )
    expect(payload.alternativeMobile).toBe('9876543219')
    expect(payload.emergencyContact).toBe('9876543218')
    expect(payload.upiScanner).toBe('scan.jpg')
  })

  it('edit mode includes trimmed documents only when present', () => {
    const payload = buildOfficeStaffPayload(
      { ...validStaffValues, aadharCardBack: 'new-back.jpg' },
      'edit',
    )
    expect(payload.aadharCardBack).toBe('new-back.jpg')
  })

  it('edit mode omits blank optional fields and documents', () => {
    const payload = buildOfficeStaffPayload(
      {
        ...validStaffValues,
        alternativeMobile: '',
        emergencyContact: '',
        upiId: '',
        remarks: '',
        dateOfLeaving: '',
        aadharCardFront: '',
        aadharCardBack: '',
        upiScanner: '',
      },
      'edit',
    )
    expect(payload.alternativeMobile).toBeNull()
    expect(payload.aadharCardFront).toBeUndefined()
    expect(payload.upiScanner).toBeNull()
  })

  it('edit mode includes all document fields when provided', () => {
    const payload = buildOfficeStaffPayload(
      {
        ...validStaffValues,
        aadharCardFront: 'front-new.jpg',
        aadharCardBack: 'back-new.jpg',
        upiScanner: 'scan-new.jpg',
      },
      'edit',
    )
    expect(payload.aadharCardFront).toBe('front-new.jpg')
    expect(payload.aadharCardBack).toBe('back-new.jpg')
    expect(payload.upiScanner).toBe('scan-new.jpg')
  })
})

describe('defaultOfficeStaffFormValues', () => {
  it('starts with empty strings', () => {
    expect(defaultOfficeStaffFormValues.designation).toBe('')
  })
})
