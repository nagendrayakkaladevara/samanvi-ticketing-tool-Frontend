import { beforeEach, describe, expect, it, vi } from 'vitest'

import { apiClient } from '@/lib/api/client'
import { dashboardService } from './dashboard.service'

vi.mock('@/lib/api/client', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}))

describe('dashboardService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('requests admin summary with days param', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({ data: { totalTickets: 5 } })

    await dashboardService.getAdminSummary(30)

    expect(apiClient.get).toHaveBeenCalledWith('/dashboard/admin-summary', { params: { days: 30 } })
  })

  it('normalizes nested snapshot and queue metrics', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({
      data: {
        data: {
          scope: 'admin',
          generatedAt: '2024-06-01T00:00:00Z',
          snapshot: {
            totalTickets: 100,
            openTickets: 40,
            inProgressTickets: 10,
            closedTickets: 50,
            overdueTickets: 3,
            newTicketsInWindow: 12,
            resolvedTicketsInWindow: 8,
            unassignedOpenTickets: 5,
            oldestOpenTicketAgeHours: 72,
            oldestOpenTicket: {
              id: 't-1',
              ticketNumber: 42,
              priority: 'p1',
              status: 'assigned',
            },
          },
          queue: {
            openByStatus: { created: 2, in_progress: 10, unassigned: 5 },
            openBySeverity: { high: 1, medium: 2 },
          },
          sla: {
            overdueOpenCount: 3,
            atRiskOpenCount: 1,
            resolvedWithinSlaCount: 20,
            resolvedInWindowCount: 8,
            slaCompliancePercent: 95.5,
          },
          speed: { averageResolutionTimeHours: 4.2 },
          window: { days: 14, fromInclusive: '2024-05-18', toInclusive: '2024-06-01' },
          agentLeaderboard: [
            { userId: 'u1', username: 'alex', displayName: 'Alex', openAssignedCount: 2, resolvedInWindow: 5 },
            { userId: '', username: 'skip' },
          ],
        },
      },
    })

    const summary = await dashboardService.getAdminSummary(14)

    expect(summary.totalTickets).toBe(100)
    expect(summary.openTickets).toBe(40)
    expect(summary.inProgressTickets).toBe(10)
    expect(summary.closedResolvedTickets).toBe(50)
    expect(summary.overdueTickets).toBe(3)
    expect(summary.priority).toEqual({ high: 0, medium: 0, low: 0 })
    expect(summary.meta.scope).toBe('admin')
    expect(summary.meta.windowDays).toBe(14)
    expect(summary.snapshot.oldestOpenTicket).toEqual({
      id: 't-1',
      ticketNumber: '42',
      priority: 'p1',
      status: 'assigned',
    })
    expect(summary.queue.openByStatus).toEqual({ created: 2, in_progress: 10, unassigned: 5 })
    expect(summary.sla.slaCompliancePercent).toBe(95.5)
    expect(summary.speed.averageResolutionTimeHours).toBe(4.2)
    expect(summary.leaderboard).toEqual([
      {
        userId: 'u1',
        username: 'alex',
        displayName: 'Alex',
        openAssignedCount: 2,
        resolvedInWindow: 5,
      },
    ])
  })

  it('falls back to zero counts for empty payloads', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({ data: null })

    const summary = await dashboardService.getAdminSummary()

    expect(summary.totalTickets).toBe(0)
    expect(summary.openTickets).toBe(0)
    expect(summary.meta.scope).toBe('unknown')
    expect(summary.leaderboard).toEqual([])
  })

  it('clamps negative numbers to zero', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({
      data: { totalTickets: -5, priority: { high: -1 } },
    })

    const summary = await dashboardService.getAdminSummary()

    expect(summary.totalTickets).toBe(0)
    expect(summary.priority.high).toBe(0)
  })

  it('extracts trend percentages from nested change objects', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({
      data: {
        snapshot: {
          totalTicketsChangePercent: { deltaPercent: 12.5 },
          openTicketsChangePercent: { changePct: -3 },
        },
      },
    })

    const summary = await dashboardService.getAdminSummary()

    expect(summary.trends?.totalTicketsPct).toBe(12.5)
    expect(summary.trends?.openTicketsPct).toBe(-3)
  })
})
