import { describe, expect, it } from 'vitest'

import { queryClient } from './query-client'

describe('queryClient', () => {
  it('configures query defaults', () => {
    const defaults = queryClient.getDefaultOptions().queries
    expect(defaults?.staleTime).toBe(30_000)
    expect(defaults?.gcTime).toBe(5 * 60_000)
    expect(defaults?.retry).toBe(1)
    expect(defaults?.refetchOnWindowFocus).toBe(false)
  })

  it('configures mutation defaults', () => {
    const defaults = queryClient.getDefaultOptions().mutations
    expect(defaults?.retry).toBe(0)
  })
})
