import '@testing-library/jest-dom/vitest'
import { afterEach, beforeEach, vi } from 'vitest'
import { cleanup } from '@testing-library/react'

import { useAuthStore } from '@/store/auth-store'
import { useUiStore } from '@/store/ui-store'

function mockMatchMedia() {
  if (typeof window === 'undefined') {
    return
  }

  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    configurable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  })
}

beforeEach(() => {
  mockMatchMedia()
  if (typeof window !== 'undefined') {
    window.scrollTo = vi.fn()
  }
})

afterEach(() => {
  if (typeof document !== 'undefined') {
    cleanup()
  }
  if (typeof localStorage !== 'undefined') {
    localStorage.clear()
  }
  if (typeof sessionStorage !== 'undefined') {
    sessionStorage.clear()
  }
  useAuthStore.getState().logout()
  useUiStore.setState({ sidebarCollapsed: false })
  vi.resetAllMocks()
  vi.useRealTimers()
})
