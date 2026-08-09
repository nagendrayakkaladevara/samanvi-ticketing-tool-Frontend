import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { useIsMobile } from './use-mobile'

describe('useIsMobile', () => {
  const listeners = new Map<string, (event: MediaQueryListEvent) => void>()

  beforeEach(() => {
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 1024 })
    vi.spyOn(window, 'matchMedia').mockImplementation((query: string) => ({
      matches: window.innerWidth < 768,
      media: query,
      onchange: null,
      addEventListener: (_event: string, listener: (event: MediaQueryListEvent) => void) => {
        listeners.set(query, listener)
      },
      removeEventListener: (_event: string, listener: (event: MediaQueryListEvent) => void) => {
        if (listeners.get(query) === listener) {
          listeners.delete(query)
        }
      },
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => true,
    }))
  })

  afterEach(() => {
    listeners.clear()
    vi.restoreAllMocks()
  })

  it('returns false for desktop width', () => {
    const { result } = renderHook(() => useIsMobile())
    expect(result.current).toBe(false)
  })

  it('returns true for mobile width', () => {
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 500 })
    const { result } = renderHook(() => useIsMobile())
    expect(result.current).toBe(true)
  })

  it('updates when media query changes', () => {
    const { result } = renderHook(() => useIsMobile())
    const listener = listeners.get('(max-width: 767px)')
    expect(listener).toBeDefined()

    act(() => {
      listener?.({ matches: true } as MediaQueryListEvent)
    })
    expect(result.current).toBe(true)

    act(() => {
      listener?.({ matches: false } as MediaQueryListEvent)
    })
    expect(result.current).toBe(false)
  })
})
