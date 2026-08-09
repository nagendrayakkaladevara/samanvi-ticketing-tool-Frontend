import { renderHook, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { notificationsService } from '@/features/notifications/api/notifications.service'
import { createWrapper } from '@/test/test-utils'
import { useNotificationsQuery } from './use-notifications-query'

vi.mock('@/features/notifications/api/notifications.service', () => ({
  notificationsService: { list: vi.fn() },
}))

describe('useNotificationsQuery', () => {
  it('fetches notifications with default pagination', async () => {
    vi.mocked(notificationsService.list).mockResolvedValue({ items: [], meta: { page: 1, limit: 20, total: 0, totalPages: 0 } })

    const { result } = renderHook(() => useNotificationsQuery(), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(notificationsService.list).toHaveBeenCalledWith({ page: 1, limit: 20, unreadOnly: false })
  })

  it('respects enabled=false', () => {
    const { result } = renderHook(() => useNotificationsQuery({ enabled: false }), { wrapper: createWrapper() })

    expect(result.current.fetchStatus).toBe('idle')
    expect(notificationsService.list).not.toHaveBeenCalled()
  })

  it('passes unreadOnly and custom page size', async () => {
    vi.mocked(notificationsService.list).mockResolvedValue({ items: [], meta: { page: 3, limit: 5, total: 0, totalPages: 0 } })

    const { result } = renderHook(() => useNotificationsQuery({ page: 3, limit: 5, unreadOnly: true }), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(notificationsService.list).toHaveBeenCalledWith({ page: 3, limit: 5, unreadOnly: true })
  })
})
