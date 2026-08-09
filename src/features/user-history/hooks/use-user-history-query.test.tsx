import { renderHook, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { userHistoryService } from '@/features/user-history/api/user-history.service'
import { createWrapper } from '@/test/test-utils'
import { useUserHistoryQuery } from './use-user-history-query'

vi.mock('@/features/user-history/api/user-history.service', () => ({
  userHistoryService: { getHistory: vi.fn() },
}))

describe('useUserHistoryQuery', () => {
  it('does not fetch without userId', () => {
    const { result } = renderHook(() => useUserHistoryQuery('', 14), { wrapper: createWrapper() })

    expect(result.current.fetchStatus).toBe('idle')
    expect(userHistoryService.getHistory).not.toHaveBeenCalled()
  })

  it('fetches user history snapshot', async () => {
    const snapshot = {
      user: { id: 'u1', username: 'alex', displayName: 'Alex', role: { code: 'worker' as const, label: 'Worker' } },
      generatedAt: '2024-01-01',
      ticketCounts: { assigned: 0, created: 0, actedOn: 0 },
      ticketsByStatus: { assigned: {}, created: {} },
      metrics: {
        window: { days: 14, fromInclusive: '', toInclusive: '' },
        assigned: {
          totalCount: 0,
          openCount: 0,
          overdueOpenCount: 0,
          resolvedAllTimeCount: 0,
          resolvedInWindowCount: 0,
          resolvedPerDay: [],
          averageResolutionTimeMs: null,
          slaCompliancePercent: null,
        },
        created: { totalCount: 0 },
        actedOn: { distinctTicketCount: 0, activityCount: 0 },
      },
      recent: { assignedTickets: [], createdTickets: [], activity: [] },
    }
    vi.mocked(userHistoryService.getHistory).mockResolvedValue(snapshot)

    const { result } = renderHook(() => useUserHistoryQuery('u1', 14, 5), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(userHistoryService.getHistory).toHaveBeenCalledWith('u1', 14, 5)
    expect(result.current.data).toEqual(snapshot)
  })
})
