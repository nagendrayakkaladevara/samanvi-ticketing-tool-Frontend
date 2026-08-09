// @vitest-environment node
import { describe, expect, it } from 'vitest'

import { readIsMobile } from './use-mobile'

describe('readIsMobile (node)', () => {
  it('returns false when window is unavailable during initial read', () => {
    expect(typeof window).toBe('undefined')
    expect(readIsMobile()).toBe(false)
  })
})
