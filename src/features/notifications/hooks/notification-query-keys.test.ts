import { describe, expect, it } from 'vitest'

import { notificationQueryKeys } from './notification-query-keys'

describe('notificationQueryKeys', () => {
  it('builds stable unread count key', () => {
    expect(notificationQueryKeys.unreadCount()).toEqual(['notifications', 'unread-count'])
  })

  it('builds list key with pagination and unread flag', () => {
    expect(notificationQueryKeys.list(2, 50, true)).toEqual(['notifications', 'list', 2, 50, true])
  })
})
