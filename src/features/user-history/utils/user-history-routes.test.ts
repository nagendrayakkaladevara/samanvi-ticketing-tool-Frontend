import { describe, expect, it } from 'vitest'

import { getUserHistoryPath } from './user-history-routes'

describe('getUserHistoryPath', () => {
  it('builds encoded user history path', () => {
    expect(getUserHistoryPath('user/1')).toBe('/users/user%2F1/history')
  })

  it('encodes special characters in user id', () => {
    expect(getUserHistoryPath('a b')).toBe('/users/a%20b/history')
  })
})
