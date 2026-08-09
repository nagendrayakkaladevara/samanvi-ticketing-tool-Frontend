import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach, vi } from 'vitest'

import { useAuthStore } from '@/store/auth-store'
import { useUiStore } from '@/store/ui-store'

afterEach(() => {
  cleanup()
  localStorage.clear()
  sessionStorage.clear()
  useAuthStore.getState().logout()
  useUiStore.setState({ sidebarCollapsed: false })
  vi.clearAllMocks()
  vi.useRealTimers()
})
