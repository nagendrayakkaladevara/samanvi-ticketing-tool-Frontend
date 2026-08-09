import { renderHook, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { dashboardService } from '@/features/dashboard/api/dashboard.service'
import { createWrapper } from '@/test/test-utils'
import { useDashboardMasterCountsQuery } from './use-dashboard-master-counts-query'

vi.mock('@/features/dashboard/api/dashboard.service', () => ({
  dashboardService: {
    getAdminSummary: vi.fn(),
    getMasterCounts: vi.fn(),
  },
}))

describe('useDashboardMasterCountsQuery', () => {
  it('fetches master counts when enabled', async () => {
    const counts = {
      serviceFor: 1,
      busNo: 2,
      serviceNo: 3,
      employees: { driver: 1, helper: 0, staff: 0, total: 1 },
    }
    vi.mocked(dashboardService.getMasterCounts).mockResolvedValue(counts)

    const { result } = renderHook(() => useDashboardMasterCountsQuery(true), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(dashboardService.getMasterCounts).toHaveBeenCalledTimes(1)
    expect(result.current.data).toEqual(counts)
  })

  it('does not fetch when disabled', async () => {
    vi.mocked(dashboardService.getMasterCounts).mockClear()

    const { result } = renderHook(() => useDashboardMasterCountsQuery(false), {
      wrapper: createWrapper(),
    })

    expect(result.current.fetchStatus).toBe('idle')
    expect(dashboardService.getMasterCounts).not.toHaveBeenCalled()
  })
})
