import { describe, expect, it } from 'vitest'

import { SAMANVI_LOGO_URL } from './branding'

describe('branding', () => {
  it('exports SAMANVI_LOGO_URL as a non-empty string', () => {
    expect(typeof SAMANVI_LOGO_URL).toBe('string')
    expect(SAMANVI_LOGO_URL.length).toBeGreaterThan(0)
  })
})
