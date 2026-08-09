import { renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'

import { makeAuthSession } from '@/test/fixtures/auth'
import { useAuthStore } from '@/store/auth-store'

import { useAppNavigation, useFirstAllowedRoute } from './use-app-navigation'

describe('useAppNavigation', () => {
  beforeEach(() => {
    useAuthStore.getState().logout()
  })

  it('returns empty masters/garage groups without permissions', () => {
    const session = makeAuthSession({
      permissions: { items: [], tree: [] },
    })
    useAuthStore.getState().setSession(session)

    const { result } = renderHook(() => useAppNavigation())

    expect(result.current.mastersItems).toEqual([])
    expect(result.current.garageItems).toEqual([])
    expect(result.current.groups).toEqual([])
    expect(result.current.mainItems.some((item) => item.id === 'welcome')).toBe(true)
  })

  it('includes masters items when user has permission', () => {
    const session = makeAuthSession({
      permissions: {
        items: [
          {
            id: '1',
            module: 'masters',
            submodule: 'service_for',
            action: 'view',
            key: 'masters:service_for:view',
          },
        ],
        tree: [
          {
            module: 'masters',
            label: 'Masters',
            submodules: [
              {
                submodule: 'service_for',
                label: 'Service For Label',
                permissions: [],
              },
            ],
          },
        ],
      },
    })
    useAuthStore.getState().setSession(session)

    const { result } = renderHook(() => useAppNavigation())

    expect(result.current.mastersItems).toHaveLength(1)
    expect(result.current.mastersItems[0]?.label).toBe('Service For Label')
    expect(result.current.groups.some((group) => group.id === 'masters')).toBe(true)
  })

  it('includes all nav groups for admin', () => {
    const session = makeAuthSession({
      user: { id: '1', name: 'Admin', role: 'ADMIN' },
    })
    useAuthStore.getState().setSession(session)

    const { result } = renderHook(() => useAppNavigation())

    expect(result.current.mastersItems.length).toBeGreaterThan(0)
    expect(result.current.garageItems.length).toBeGreaterThan(0)
    expect(result.current.groups).toHaveLength(2)
  })
})

describe('useFirstAllowedRoute', () => {
  beforeEach(() => {
    useAuthStore.getState().logout()
  })

  it('returns /login when unauthenticated', () => {
    const { result } = renderHook(() => useFirstAllowedRoute())
    expect(result.current).toBe('/login')
  })

  it('returns first allowed visible route for authenticated user', () => {
    const session = makeAuthSession()
    useAuthStore.getState().setSession(session)

    const { result } = renderHook(() => useFirstAllowedRoute())
    expect(result.current).toBe('/')
  })

  it('returns welcome route for authenticated users without higher-priority home access', () => {
    const session = makeAuthSession({
      permissions: {
        items: [
          {
            id: '1',
            module: 'garage',
            submodule: 'repair_category',
            action: 'view',
            key: 'garage:repair_category:view',
          },
        ],
        tree: [],
      },
    })
    useAuthStore.getState().setSession(session)

    const { result } = renderHook(() => useFirstAllowedRoute())
    expect(result.current).toBe('/')
  })
})
