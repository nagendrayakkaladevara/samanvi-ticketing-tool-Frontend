import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  persistTicketsAutoRefreshPreference,
  readTicketsAutoRefreshPreference,
  TICKETS_AUTO_REFRESH_KEY,
  useTicketsAutoRefresh,
} from './use-tickets-auto-refresh'

describe('readTicketsAutoRefreshPreference', () => {
  beforeEach(() => {
    localStorage.removeItem(TICKETS_AUTO_REFRESH_KEY)
  })

  it('returns false when unset', () => {
    expect(readTicketsAutoRefreshPreference()).toBe(false)
  })

  it('returns true when localStorage is true', () => {
    localStorage.setItem(TICKETS_AUTO_REFRESH_KEY, 'true')
    expect(readTicketsAutoRefreshPreference()).toBe(true)
  })

  it('returns false when localStorage read throws', () => {
    const getItem = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked')
    })
    expect(readTicketsAutoRefreshPreference()).toBe(false)
    getItem.mockRestore()
  })
})

describe('persistTicketsAutoRefreshPreference', () => {
  it('writes boolean to localStorage', () => {
    persistTicketsAutoRefreshPreference(true)
    expect(localStorage.getItem(TICKETS_AUTO_REFRESH_KEY)).toBe('true')
  })

  it('ignores storage write errors', () => {
    const setItem = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('quota')
    })
    expect(() => persistTicketsAutoRefreshPreference(false)).not.toThrow()
    setItem.mockRestore()
  })
})

describe('useTicketsAutoRefresh', () => {
  beforeEach(() => {
    localStorage.removeItem(TICKETS_AUTO_REFRESH_KEY)
  })

  it('initializes from stored preference', () => {
    localStorage.setItem(TICKETS_AUTO_REFRESH_KEY, 'true')
    const { result } = renderHook(() => useTicketsAutoRefresh())
    expect(result.current.autoRefresh).toBe(true)
  })

  it('setAutoRefresh updates state and storage', () => {
    const { result } = renderHook(() => useTicketsAutoRefresh())

    act(() => result.current.setAutoRefresh(true))

    expect(result.current.autoRefresh).toBe(true)
    expect(localStorage.getItem(TICKETS_AUTO_REFRESH_KEY)).toBe('true')
  })

  it('toggleAutoRefresh flips value', () => {
    const { result } = renderHook(() => useTicketsAutoRefresh())

    act(() => result.current.toggleAutoRefresh())

    expect(result.current.autoRefresh).toBe(true)

    act(() => result.current.toggleAutoRefresh())

    expect(result.current.autoRefresh).toBe(false)
  })
})
