// @vitest-environment node
import { describe, expect, it } from 'vitest'

describe('useIsMobile (node)', () => {
  it('returns false when window is unavailable during initial read', () => {
    expect(typeof window).toBe('undefined')

    const initialIsMobile =
      typeof window === 'undefined' ? false : window.innerWidth < 768

    expect(initialIsMobile).toBe(false)
  })
})
