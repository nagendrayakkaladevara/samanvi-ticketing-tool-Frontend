import { renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'

import { makeAuthSession } from '@/test/fixtures/auth'
import { useAuthStore } from '@/store/auth-store'

import { usePermissions, useSubmoduleActions } from './use-permissions'

describe('usePermissions', () => {
  beforeEach(() => {
    useAuthStore.getState().logout()
  })

  it('exposes permission helpers for non-admin user', () => {
    const session = makeAuthSession({
      user: { id: '1', name: 'Worker', role: 'WORKER' },
    })
    useAuthStore.getState().setSession(session)

    const { result } = renderHook(() => usePermissions())

    expect(result.current.isAdmin).toBe(false)
    expect(result.current.has('tickets', '', 'view')).toBe(true)
    expect(result.current.has('tickets', '', 'create')).toBe(false)
    expect(result.current.can('tickets', '', 'view')).toBe(true)
    expect(result.current.canAccess({ module: 'tickets', submodule: '', action: 'view' })).toBe(true)
  })

  it('treats admin role as admin', () => {
    const session = makeAuthSession({
      user: { id: '1', name: 'Admin', role: 'ADMIN' },
    })
    useAuthStore.getState().setSession(session)

    const { result } = renderHook(() => usePermissions())

    expect(result.current.isAdmin).toBe(true)
    expect(result.current.has('anything', 'sub', 'action')).toBe(true)
    expect(result.current.canManage('garage', 'repair_job')).toBe(true)
  })

  it('treats userType admin as admin', () => {
    const session = makeAuthSession({
      user: { id: '1', name: 'Admin', role: 'WORKER', userType: 'admin' },
    })
    useAuthStore.getState().setSession(session)

    const { result } = renderHook(() => usePermissions())
    expect(result.current.isAdmin).toBe(true)
  })

  it('returns false admin state when user is null', () => {
    const { result } = renderHook(() => usePermissions())
    expect(result.current.isAdmin).toBe(false)
    expect(result.current.has('tickets', '', 'view')).toBe(false)
  })
})

describe('useSubmoduleActions', () => {
  beforeEach(() => {
    useAuthStore.getState().logout()
  })

  it('derives create/edit/delete/manage flags from permissions', () => {
    const session = makeAuthSession({
      permissions: {
        items: [
          {
            id: '1',
            module: 'masters',
            submodule: 'driver',
            action: 'create',
            key: 'masters:driver:create',
          },
          {
            id: '2',
            module: 'masters',
            submodule: 'driver',
            action: 'edit',
            key: 'masters:driver:edit',
          },
        ],
        tree: [],
      },
    })
    useAuthStore.getState().setSession(session)

    const { result } = renderHook(() => useSubmoduleActions('masters', 'driver'))

    expect(result.current.canCreate).toBe(true)
    expect(result.current.canEdit).toBe(true)
    expect(result.current.canDelete).toBe(false)
    expect(result.current.canManage).toBe(true)
  })

  it('canManage is true when only delete permission is granted', () => {
    const session = makeAuthSession({
      permissions: {
        items: [
          {
            id: '1',
            module: 'masters',
            submodule: 'driver',
            action: 'delete',
            key: 'masters:driver:delete',
          },
        ],
        tree: [],
      },
    })
    useAuthStore.getState().setSession(session)

    const { result } = renderHook(() => useSubmoduleActions('masters', 'driver'))

    expect(result.current.canDelete).toBe(true)
    expect(result.current.canManage).toBe(true)
  })

  it('canManage is true when only delete permission is granted', () => {
    const session = makeAuthSession({
      permissions: {
        items: [
          {
            id: '1',
            module: 'masters',
            submodule: 'driver',
            action: 'delete',
            key: 'masters:driver:delete',
          },
        ],
        tree: [],
      },
    })
    useAuthStore.getState().setSession(session)

    const { result } = renderHook(() => useSubmoduleActions('masters', 'driver'))

    expect(result.current.canDelete).toBe(true)
    expect(result.current.canManage).toBe(true)
  })
})
