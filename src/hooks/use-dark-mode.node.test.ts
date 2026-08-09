// @vitest-environment node
import { describe, expect, it } from 'vitest'

describe('useDarkMode (node)', () => {
  it('returns false when document is unavailable', () => {
    expect(typeof document).toBe('undefined')

    const initialDarkMode =
      typeof document === 'undefined'
        ? false
        : document.documentElement.classList.contains('dark')

    expect(initialDarkMode).toBe(false)
  })
})
