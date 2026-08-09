import { describe, expect, it } from 'vitest'

import { useUiStore } from './ui-store'

describe('useUiStore', () => {
  it('defaults sidebarCollapsed to false', () => {
    expect(useUiStore.getState().sidebarCollapsed).toBe(false)
  })

  it('setSidebarCollapsed updates state', () => {
    useUiStore.getState().setSidebarCollapsed(true)
    expect(useUiStore.getState().sidebarCollapsed).toBe(true)

    useUiStore.getState().setSidebarCollapsed(false)
    expect(useUiStore.getState().sidebarCollapsed).toBe(false)
  })
})
