import { renderHook, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { dashboardService } from '@/features/dashboard/api/dashboard.service'
import { createWrapper } from '@/test/test-utils'
import { useDashboardSummaryQuery } from './use-dashboard-summary-query'

vi.mock('@/features/dashboard/api/dashboard.service', () => ({
  dashboardService: { getAdminSummary: vi.fn() },
}))

describe('useDashboardSummaryQuery', () => {
  it('fetches dashboard summary for the given window days', async () => {
    const summary = {
      totalTickets: 1,
      openTickets: 1,
      inProgressTickets: 0,
      closedResolvedTickets: 0,
      overdueTickets: 0,
      priority: { high: 0, medium: 0, low: 0 },
      meta: { scope: 'admin' },
      snapshot: {
        newTicketsInWindow: 0,
        resolvedTicketsInWindow: 0,
        unassignedOpenTickets: 0,
        oldestOpenTicketAgeHours: 0,
      },
      queue: { openByStatus: {}, openBySeverity: {} },
      sla: {
        overdueOpenCount: 0,
        atRiskOpenCount: 0,
        resolvedWithinSlaCount: 0,
        resolvedInWindowCount: 0,
        slaCompliancePercent: 0,
      },
      speed: { averageResolutionTimeHours: 0 },
      leaderboard: [],
    }
    vi.mocked(dashboardService.getAdminSummary).mockResolvedValue(summary)

    const { result } = renderHook(() => useDashboardSummaryQuery(7), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(dashboardService.getAdminSummary).toHaveBeenCalledWith(7)
    expect(result.current.data).toEqual(summary)
  })
})
