import { renderHook, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { userHistoryService } from '@/features/user-history/api/user-history.service'
import { createWrapper } from '@/test/test-utils'
import { useUserTicketsQuery } from './use-user-tickets-query'

vi.mock('@/features/user-history/api/user-history.service', () => ({
  userHistoryService: { listTickets: vi.fn() },
}))

describe('useUserTicketsQuery', () => {
  it('does not fetch without userId', () => {
    const { result } = renderHook(() => useUserTicketsQuery('', { relation: 'assigned' }), {
      wrapper: createWrapper(),
    })

    expect(result.current.fetchStatus).toBe('idle')
    expect(userHistoryService.listTickets).not.toHaveBeenCalled()
  })

  it('fetches tickets for user with query params', async () => {
    const payload = {
      userId: 'u1',
      relation: 'assigned' as const,
      items: [],
      meta: { page: 1, limit: 20, total: 0, totalPages: 0 },
    }
    vi.mocked(userHistoryService.listTickets).mockResolvedValue(payload)

    const query = { relation: 'assigned' as const, page: 1, limit: 20 }
    const { result } = renderHook(() => useUserTicketsQuery('u1', query), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(userHistoryService.listTickets).toHaveBeenCalledWith('u1', query)
    expect(result.current.data).toEqual(payload)
  })
})
