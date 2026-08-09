import '@testing-library/jest-dom/vitest'
import { afterEach, beforeEach, vi } from 'vitest'
import { cleanup } from '@testing-library/react'

import { useAuthStore } from '@/store/auth-store'
import { useUiStore } from '@/store/ui-store'

function mockMatchMedia() {
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
  window.scrollTo = vi.fn()
})

afterEach(() => {
  cleanup()
  localStorage.clear()
  sessionStorage.clear()
  useAuthStore.getState().logout()
  useUiStore.setState({ sidebarCollapsed: false })
  vi.clearAllMocks()
  vi.useRealTimers()
})
