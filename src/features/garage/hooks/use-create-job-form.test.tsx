import { act, renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import {
  getCreateJobFieldError,
  useCreateJobForm,
} from './use-create-job-form'

describe('getCreateJobFieldError', () => {
  const valid = {
    busNumber: 'BUS-01',
    odometerReading: '1000',
    repairCategoryId: 'cat-1',
    priority: 'medium' as const,
    description: 'Issue',
    reportedDriverId: '',
    assignedToOfficeStaffId: '',
  }

  it('validates required fields', () => {
    expect(getCreateJobFieldError('busNumber', { ...valid, busNumber: '' })).toBe(
      'Bus number is required.',
    )
    expect(getCreateJobFieldError('repairCategoryId', { ...valid, repairCategoryId: '' })).toBe(
      'Repair category is required.',
    )
    expect(getCreateJobFieldError('description', { ...valid, description: '  ' })).toBe(
      'Description is required.',
    )
  })

  it('validates odometer as non-negative integer', () => {
    expect(getCreateJobFieldError('odometerReading', { ...valid, odometerReading: '' })).toBe(
      'Odometer reading is required.',
    )
    expect(getCreateJobFieldError('odometerReading', { ...valid, odometerReading: '-1' })).toBe(
      'Enter a valid non-negative whole number.',
    )
    expect(getCreateJobFieldError('odometerReading', { ...valid, odometerReading: '10.5' })).toBe(
      'Enter a valid non-negative whole number.',
    )
    expect(getCreateJobFieldError('odometerReading', valid)).toBeUndefined()
  })

  it('returns undefined for optional fields', () => {
    expect(getCreateJobFieldError('priority', valid)).toBeUndefined()
    expect(getCreateJobFieldError('reportedDriverId', valid)).toBeUndefined()
  })
})

describe('useCreateJobForm', () => {
  it('manages field values, validation, and payload', () => {
    const { result } = renderHook(() => useCreateJobForm())

    act(() => {
      result.current.setField('busNumber', 'BUS-01')
      result.current.setField('odometerReading', '5000')
      result.current.setField('repairCategoryId', 'cat-1')
      result.current.setField('description', 'Brake issue')
      result.current.setField('reportedDriverId', '  d1  ')
      result.current.setField('assignedToOfficeStaffId', '  s1  ')
    })

    expect(result.current.payload).toEqual({
      busNumber: 'BUS-01',
      odometerReading: 5000,
      repairCategoryId: 'cat-1',
      priority: 'medium',
      description: 'Brake issue',
      reportedDriverId: 'd1',
      assignedToOfficeStaffId: 's1',
    })

    act(() => {
      result.current.blurField('busNumber')
    })
    expect(result.current.errors.busNumber).toBeUndefined()

    const errors = result.current.validate()
    expect(errors).toEqual({})

    act(() => result.current.resetForm())
    expect(result.current.values.busNumber).toBe('')
    expect(result.current.errors).toEqual({})
  })

  it('validate returns errors for invalid state', () => {
    const { result } = renderHook(() => useCreateJobForm())
    const errors = result.current.validate()
    expect(errors.busNumber).toBeDefined()
    expect(errors.odometerReading).toBeDefined()
    expect(errors.repairCategoryId).toBeDefined()
    expect(errors.description).toBeDefined()
  })
})
