import { renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'

import { makeAuthSession } from '@/test/fixtures/auth'
import { useAuthStore } from '@/store/auth-store'

import { useCurrentUser } from './use-current-user'

describe('useCurrentUser', () => {
  beforeEach(() => {
    useAuthStore.getState().logout()
  })

  it('returns null when no user in store', () => {
    const { result } = renderHook(() => useCurrentUser())
    expect(result.current).toBeNull()
  })

  it('maps auth user to current user shape', () => {
    const session = makeAuthSession({
      user: {
        id: 'user-42',
        name: 'Jane Doe',
        role: 'SUPERVISOR',
        userType: 'application_user',
      },
    })
    useAuthStore.getState().setSession(session)

    const { result } = renderHook(() => useCurrentUser())

    expect(result.current).toEqual({
      id: 'user-42',
      role: 'SUPERVISOR',
      userType: 'application_user',
      name: 'Jane Doe',
      isAdmin: false,
    })
  })

  it.each([
    [{ role: 'ADMIN' as const }, true],
    [{ role: 'WORKER' as const, userType: 'admin' as const }, true],
    [{ role: 'WORKER' as const }, false],
  ])('resolves isAdmin for user %j as %s', (userOverrides, isAdmin) => {
    const session = makeAuthSession({
      user: {
        id: '1',
        name: 'User',
        ...userOverrides,
      },
    })
    useAuthStore.getState().setSession(session)

    const { result } = renderHook(() => useCurrentUser())
    expect(result.current?.isAdmin).toBe(isAdmin)
  })
})
