import { renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { notificationsService } from '@/features/notifications/api/notifications.service'
import { createWrapper } from '@/test/test-utils'
import { useNotificationsUnreadCountQuery } from './use-notifications-unread-count-query'

vi.mock('@/features/notifications/api/notifications.service', () => ({
  notificationsService: { getUnreadCount: vi.fn() },
}))

describe('useNotificationsUnreadCountQuery', () => {
  it('starts disabled with polling configuration', () => {
    const { result } = renderHook(() => useNotificationsUnreadCountQuery(), { wrapper: createWrapper() })

    expect(result.current.fetchStatus).toBe('idle')
    expect(notificationsService.getUnreadCount).not.toHaveBeenCalled()
  })
})
