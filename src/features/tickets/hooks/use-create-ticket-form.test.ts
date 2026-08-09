import { act, renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { getCreateTicketFieldError, useCreateTicketForm } from './use-create-ticket-form'

describe('getCreateTicketFieldError', () => {
  const baseValues = {
    title: '',
    description: '',
    severity: 'medium' as const,
    priority: 'p2' as const,
    categoryId: '',
    busNumber: '',
    slaDueAtLocal: '',
    assignedToId: '',
  }

  it.each([
    ['title', 'Title is required.'],
    ['description', 'Description is required.'],
    ['categoryId', 'Category is required.'],
    ['busNumber', 'Bus number is required.'],
    ['slaDueAtLocal', 'SLA due date is required.'],
  ] as const)('validates required field %s', (field, message) => {
    expect(getCreateTicketFieldError(field, baseValues)).toBe(message)
  })

  it('rejects invalid sla date', () => {
    expect(
      getCreateTicketFieldError('slaDueAtLocal', {
        ...baseValues,
        slaDueAtLocal: 'not-a-date',
      }),
    ).toBe('Enter a valid SLA due date and time.')
  })

  it('returns undefined for valid values', () => {
    expect(
      getCreateTicketFieldError('title', {
        ...baseValues,
        title: 'Valid',
        description: 'Desc',
        categoryId: 'c1',
        busNumber: 'BUS',
        slaDueAtLocal: '2024-06-15T10:00',
      }),
    ).toBeUndefined()
  })

  it('returns undefined when optional validated fields are non-empty', () => {
    expect(getCreateTicketFieldError('description', { ...baseValues, description: 'Ok' })).toBeUndefined()
    expect(getCreateTicketFieldError('categoryId', { ...baseValues, categoryId: 'c1' })).toBeUndefined()
    expect(getCreateTicketFieldError('busNumber', { ...baseValues, busNumber: 'BUS-1' })).toBeUndefined()
  })
})

describe('useCreateTicketForm', () => {
  it('validate returns errors for empty required fields', () => {
    const { result } = renderHook(() => useCreateTicketForm())

    let errors: ReturnType<typeof result.current.validate>
    act(() => {
      errors = result.current.validate()
    })

    expect(errors!.title).toBe('Title is required.')
    expect(errors!.description).toBe('Description is required.')
  })

  it('setField clears field error and updates value', () => {
    const { result } = renderHook(() => useCreateTicketForm())

    act(() => {
      result.current.setField('title', 'New title')
    })

    expect(result.current.values.title).toBe('New title')
    expect(result.current.errors.title).toBeUndefined()
  })

  it('blurField sets field-level validation error', () => {
    const { result } = renderHook(() => useCreateTicketForm())

    act(() => {
      result.current.blurField('title')
    })

    expect(result.current.errors.title).toBe('Title is required.')
  })

  it('blurField returns undefined for non-validated fields', () => {
    const { result } = renderHook(() => useCreateTicketForm())

    act(() => {
      result.current.blurField('severity')
    })

    expect(result.current.errors.severity).toBeUndefined()
  })

  it('applySuggestedSla updates sla based on priority', () => {
    const { result } = renderHook(() => useCreateTicketForm())
    const before = result.current.values.slaDueAtLocal

    act(() => {
      result.current.applySuggestedSla('p1')
    })

    expect(result.current.values.slaDueAtLocal).not.toBe(before)
    expect(result.current.values.slaDueAtLocal).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/)

    act(() => {
      result.current.applySuggestedSla('p3')
    })
    expect(result.current.values.slaDueAtLocal).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/)
  })

  it('returns undefined for non-validated fields', () => {
    expect(
      getCreateTicketFieldError('severity', {
        title: '',
        description: '',
        severity: 'medium',
        priority: 'p2',
        categoryId: '',
        busNumber: '',
        slaDueAtLocal: '',
        assignedToId: '',
      }),
    ).toBeUndefined()
  })

  it('resetForm clears values and errors', () => {
    const { result } = renderHook(() => useCreateTicketForm())

    act(() => {
      result.current.setField('title', 'X')
      result.current.blurField('description')
      result.current.resetForm()
    })

    expect(result.current.values.title).toBe('')
    expect(result.current.errors).toEqual({})
  })

  it('payload trims strings and converts sla to ISO', () => {
    const { result } = renderHook(() => useCreateTicketForm())

    act(() => {
      result.current.setField('title', '  Title  ')
      result.current.setField('description', '  Desc  ')
      result.current.setField('categoryId', 'c1')
      result.current.setField('busNumber', '  BUS-1  ')
      result.current.setField('slaDueAtLocal', '2024-06-15T10:00')
    })

    expect(result.current.payload).toMatchObject({
      title: 'Title',
      description: 'Desc',
      busNumber: 'BUS-1',
      categoryId: 'c1',
    })
    expect(result.current.payload.slaDueAt).toContain('2024-06-15')
  })
})
