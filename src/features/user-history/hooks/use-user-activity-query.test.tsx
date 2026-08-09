import { renderHook, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { userHistoryService } from '@/features/user-history/api/user-history.service'
import { createWrapper } from '@/test/test-utils'
import { useUserActivityQuery } from './use-user-activity-query'

vi.mock('@/features/user-history/api/user-history.service', () => ({
  userHistoryService: { listActivity: vi.fn() },
}))

describe('useUserActivityQuery', () => {
  it('does not fetch without userId', () => {
    const { result } = renderHook(() => useUserActivityQuery('', 1), { wrapper: createWrapper() })

    expect(result.current.fetchStatus).toBe('idle')
    expect(userHistoryService.listActivity).not.toHaveBeenCalled()
  })

  it('fetches paginated activity', async () => {
    const payload = {
      userId: 'u1',
      items: [],
      meta: { page: 2, limit: 10, total: 0, totalPages: 0 },
    }
    vi.mocked(userHistoryService.listActivity).mockResolvedValue(payload)

    const { result } = renderHook(() => useUserActivityQuery('u1', 2, 10), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(userHistoryService.listActivity).toHaveBeenCalledWith('u1', 2, 10)
    expect(result.current.data).toEqual(payload)
  })
})
