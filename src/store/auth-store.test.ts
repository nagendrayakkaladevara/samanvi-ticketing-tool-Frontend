import { beforeEach, describe, expect, it } from 'vitest'

import { makeAuthSession } from '@/test/fixtures/auth'
import { getAccessToken, useAuthStore } from './auth-store'

const STORAGE_KEY = 'samanvi.auth.session'

describe('useAuthStore', () => {
  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
    useAuthStore.getState().logout()
  })

  it('persists session to localStorage by default', () => {
    const session = makeAuthSession()
    useAuthStore.getState().setSession(session)

    expect(useAuthStore.getState().isAuthenticated).toBe(true)
    expect(useAuthStore.getState().accessToken).toBe(session.accessToken)
    expect(useAuthStore.getState().user).toEqual(session.user)
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!)).toMatchObject({
      accessToken: session.accessToken,
    })
    expect(sessionStorage.getItem(STORAGE_KEY)).toBeNull()
  })

  it('persists session to sessionStorage when persist is false', () => {
    const session = makeAuthSession()
    useAuthStore.getState().setSession(session, false)

    expect(sessionStorage.getItem(STORAGE_KEY)).not.toBeNull()
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull()
  })

  it('clears opposite storage when switching persistence mode', () => {
    const session = makeAuthSession()
    useAuthStore.getState().setSession(session, true)
    useAuthStore.getState().setSession(session, false)

    expect(localStorage.getItem(STORAGE_KEY)).toBeNull()
    expect(sessionStorage.getItem(STORAGE_KEY)).not.toBeNull()
  })

  it('logout clears session state and both storages', () => {
    const session = makeAuthSession()
    useAuthStore.getState().setSession(session)
    useAuthStore.getState().logout()

    expect(useAuthStore.getState().session).toBeNull()
    expect(useAuthStore.getState().isAuthenticated).toBe(false)
    expect(useAuthStore.getState().permissionSet.size).toBe(0)
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull()
    expect(sessionStorage.getItem(STORAGE_KEY)).toBeNull()
  })

  it('updatePermissions no-ops when no session', () => {
    const permissions = makeAuthSession().permissions!
    useAuthStore.getState().updatePermissions(permissions)

    expect(useAuthStore.getState().permissions).toBeNull()
  })

  it('updatePermissions updates session and storage when session exists', () => {
    const session = makeAuthSession({ permissions: undefined })
    useAuthStore.getState().setSession(session)

    const nextPermissions = makeAuthSession().permissions!
    useAuthStore.getState().updatePermissions(nextPermissions)

    expect(useAuthStore.getState().permissions).toEqual(nextPermissions)
    expect(useAuthStore.getState().permissionSet.has('tickets::view')).toBe(true)
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!).permissions).toEqual(nextPermissions)
  })

  it('builds empty permission set when permissions items missing', () => {
    const session = makeAuthSession({ permissions: { items: [], tree: [] } })
    useAuthStore.getState().setSession(session)

    expect(useAuthStore.getState().permissionSet.size).toBe(0)
  })

  it('getAccessToken returns in-memory token', () => {
    const session = makeAuthSession({ accessToken: 'memory-token' })
    useAuthStore.getState().setSession(session)

    expect(getAccessToken()).toBe('memory-token')
  })

  it('getAccessToken falls back to stored session when memory token missing', () => {
    const session = makeAuthSession({ accessToken: 'stored-token' })
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session))
    useAuthStore.setState({
      session: null,
      accessToken: null,
      isAuthenticated: false,
      user: null,
      permissions: null,
      permissionSet: new Set(),
    })

    expect(getAccessToken()).toBe('stored-token')
  })

  it('clears invalid JSON from storage on read', () => {
    localStorage.setItem(STORAGE_KEY, '{not-json')
    sessionStorage.setItem(STORAGE_KEY, 'also-bad')

    expect(getAccessToken()).toBeNull()
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull()
    expect(sessionStorage.getItem(STORAGE_KEY)).toBeNull()
  })
})
