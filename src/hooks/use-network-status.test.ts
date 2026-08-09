import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { RECONNECTED_VISIBLE_MS, useNetworkStatus } from './use-network-status'

describe('useNetworkStatus', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    Object.defineProperty(navigator, 'onLine', { configurable: true, value: true })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('initializes from navigator.onLine', () => {
    Object.defineProperty(navigator, 'onLine', { configurable: true, value: false })
    const { result } = renderHook(() => useNetworkStatus())
    expect(result.current.isOnline).toBe(false)
    expect(result.current.showReconnected).toBe(false)
  })

  it('updates on offline and online events', () => {
    const { result } = renderHook(() => useNetworkStatus())

    act(() => {
      window.dispatchEvent(new Event('offline'))
    })
    expect(result.current.isOnline).toBe(false)
    expect(result.current.showReconnected).toBe(false)

    act(() => {
      window.dispatchEvent(new Event('online'))
    })
    expect(result.current.isOnline).toBe(true)
    expect(result.current.showReconnected).toBe(true)
  })

  it('hides reconnected banner after timeout', () => {
    const { result } = renderHook(() => useNetworkStatus())

    act(() => {
      window.dispatchEvent(new Event('online'))
    })
    expect(result.current.showReconnected).toBe(true)

    act(() => {
      vi.advanceTimersByTime(RECONNECTED_VISIBLE_MS + 250)
    })
    expect(result.current.showReconnected).toBe(false)
  })

  it('clears reconnected flag when going offline again', () => {
    const { result } = renderHook(() => useNetworkStatus())

    act(() => {
      window.dispatchEvent(new Event('online'))
    })
    expect(result.current.showReconnected).toBe(true)

    act(() => {
      window.dispatchEvent(new Event('offline'))
    })
    expect(result.current.showReconnected).toBe(false)
  })
})
