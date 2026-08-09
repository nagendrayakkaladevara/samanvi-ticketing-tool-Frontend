// @vitest-environment node
import { describe, expect, it } from 'vitest'

import { readDarkMode } from './use-dark-mode'

describe('readDarkMode (node)', () => {
  it('returns false when document is unavailable', () => {
    expect(typeof document).toBe('undefined')
    expect(readDarkMode()).toBe(false)
  })
})
