import { describe, expect, it } from 'vitest'
import type { Location } from 'react-router-dom'

import { getPostLoginRedirect } from './get-post-login-redirect'

function makeLocation(overrides: Partial<Location> = {}): Location {
  return {
  pathname: '/login',
  search: '',
  hash: '',
  state: null,
  key: 'default',
  ...overrides,
  }
}

describe('getPostLoginRedirect', () => {
  it.each([
    ['/tickets', '/tickets'],
    ['/dashboard?days=7', '/dashboard?days=7'],
    ['/', '/'],
  ])('uses safe redirect query param %s', (redirect, expected) => {
    const location = makeLocation({ search: `?redirect=${encodeURIComponent(redirect)}` })
    expect(getPostLoginRedirect(location)).toBe(expected)
  })

  it.each([
    '//evil.com',
    'https://evil.com',
    'http://evil.com/path',
    'evil.com',
    '',
    '   ',
    null,
    undefined,
  ])('rejects unsafe redirect query param %s', (redirect) => {
    const location = makeLocation({
      search: redirect != null ? `?redirect=${encodeURIComponent(String(redirect))}` : '',
      state: { from: '/safe-from-state' },
    })
    expect(getPostLoginRedirect(location)).toBe('/safe-from-state')
  })

  it('uses safe state.from when query redirect is missing', () => {
    const location = makeLocation({ state: { from: '/application-access' } })
    expect(getPostLoginRedirect(location)).toBe('/application-access')
  })

  it.each([
    '//evil.com',
    'https://evil.com',
    'relative-without-slash',
    null,
    undefined,
    42,
  ])('rejects unsafe state.from %s', (from) => {
    const location = makeLocation({ state: { from } })
    expect(getPostLoginRedirect(location)).toBe('/')
  })

  it('returns default / when neither query nor state is safe', () => {
    const location = makeLocation({ search: '?redirect=https://evil.com', state: { from: '//evil.com' } })
    expect(getPostLoginRedirect(location)).toBe('/')
  })

  it('prefers query redirect over state.from when both are safe', () => {
    const location = makeLocation({
      search: '?redirect=/tickets',
      state: { from: '/dashboard' },
    })
    expect(getPostLoginRedirect(location)).toBe('/tickets')
  })
})
