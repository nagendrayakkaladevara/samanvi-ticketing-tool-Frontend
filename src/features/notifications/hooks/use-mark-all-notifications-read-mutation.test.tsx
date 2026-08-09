import { act, renderHook, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { notificationsService } from '@/features/notifications/api/notifications.service'
import { createTestQueryClient, createWrapper } from '@/test/test-utils'
import { useMarkAllNotificationsReadMutation } from './use-mark-all-notifications-read-mutation'

vi.mock('@/features/notifications/api/notifications.service', () => ({
  notificationsService: { markAllRead: vi.fn() },
}))

describe('useMarkAllNotificationsReadMutation', () => {
  it('marks all notifications read and invalidates notification queries', async () => {
    vi.mocked(notificationsService.markAllRead).mockResolvedValue(4)

    const queryClient = createTestQueryClient()
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

    const { result } = renderHook(() => useMarkAllNotificationsReadMutation(), {
      wrapper: createWrapper({ queryClient }),
    })

    act(() => {
      result.current.mutate()
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(notificationsService.markAllRead).toHaveBeenCalled()
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['notifications'] })
    expect(result.current.data).toBe(4)
  })
})
