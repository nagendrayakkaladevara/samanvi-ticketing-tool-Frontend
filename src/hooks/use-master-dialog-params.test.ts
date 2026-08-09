import { act, renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { renderHookWithProviders } from '@/test/render-with-providers'

import { useMasterDialogParams } from './use-master-dialog-params'

describe('useMasterDialogParams', () => {
  it('parses action, id, and tab from search params', () => {
    const { result } = renderHookWithProviders(() => useMasterDialogParams(), {
      route: '/masters/employees?action=edit&id=emp-1&tab=driver',
    })

    expect(result.current.action).toBe('edit')
    expect(result.current.id).toBe('emp-1')
    expect(result.current.tab).toBe('driver')
  })

  it.each(['invalid', '', null])('returns null action for invalid value %j', (action) => {
    const route = action ? `/masters/employees?action=${action}` : '/masters/employees'
    const { result } = renderHookWithProviders(() => useMasterDialogParams(), { route })
    expect(result.current.action).toBeNull()
  })

  it('openDialog sets action and optional id/tab', () => {
    const { result } = renderHookWithProviders(() => useMasterDialogParams(), {
      route: '/masters/employees',
    })

    act(() => {
      result.current.openDialog({ action: 'create', tab: 'helper' })
    })

    expect(result.current.action).toBe('create')
    expect(result.current.id).toBeNull()
    expect(result.current.tab).toBe('helper')
  })

  it('openDialog removes id when not provided', () => {
    const { result } = renderHookWithProviders(() => useMasterDialogParams(), {
      route: '/masters/employees?action=edit&id=emp-1',
    })

    act(() => {
      result.current.openDialog({ action: 'create' })
    })

    expect(result.current.id).toBeNull()
  })

  it('closeDialog clears action and id', () => {
    const { result } = renderHookWithProviders(() => useMasterDialogParams(), {
      route: '/masters/employees?action=view&id=emp-1&tab=driver',
    })

    act(() => {
      result.current.closeDialog()
    })

    expect(result.current.action).toBeNull()
    expect(result.current.id).toBeNull()
    expect(result.current.tab).toBe('driver')
  })

  it('setTabParam sets tab and clears dialog params', () => {
    const { result } = renderHookWithProviders(() => useMasterDialogParams(), {
      route: '/masters/employees?action=edit&id=emp-1',
    })

    act(() => {
      result.current.setTabParam('office_staff')
    })

    expect(result.current.tab).toBe('office_staff')
    expect(result.current.action).toBeNull()
    expect(result.current.id).toBeNull()
  })
})
