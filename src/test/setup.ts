import { cleanup } from '@testing-library/react'
import { afterEach, vi } from 'vitest'
import { notifyManager } from '@tanstack/react-query'

// Keep query notifications inside async act() without advancing debounce clocks.
notifyManager.setScheduler(queueMicrotask)

afterEach(() => {
  cleanup()
  localStorage.clear()
  sessionStorage.clear()
  vi.clearAllMocks()
  vi.useRealTimers()
  vi.unstubAllGlobals()
})
