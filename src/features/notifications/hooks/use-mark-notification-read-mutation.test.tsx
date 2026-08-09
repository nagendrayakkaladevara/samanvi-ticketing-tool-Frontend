import { act, renderHook, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { notificationsService } from '@/features/notifications/api/notifications.service'
import { createTestQueryClient, createWrapper } from '@/test/test-utils'
import { useMarkNotificationReadMutation } from './use-mark-notification-read-mutation'

vi.mock('@/features/notifications/api/notifications.service', () => ({
  notificationsService: { markRead: vi.fn() },
}))

describe('useMarkNotificationReadMutation', () => {
  it('marks a notification read and invalidates notification queries', async () => {
    const notification = {
      id: 'n1',
      type: 'ticket_created' as const,
      title: 'T',
      message: '',
      ticketId: null,
      ticketNumber: null,
      activityLogId: null,
      readAt: '2024-01-01T00:00:00.000Z',
      createdAt: '2024-01-01T00:00:00.000Z',
    }
    vi.mocked(notificationsService.markRead).mockResolvedValue(notification)

    const queryClient = createTestQueryClient()
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

    const { result } = renderHook(() => useMarkNotificationReadMutation(), {
      wrapper: createWrapper({ queryClient }),
    })

    act(() => {
      result.current.mutate('n1')
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(notificationsService.markRead).toHaveBeenCalledWith('n1')
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['notifications'] })
  })
})
