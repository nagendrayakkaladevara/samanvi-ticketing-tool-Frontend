import { beforeEach, describe, expect, it, vi } from 'vitest'

import { apiClient } from '@/lib/api/client'
import { userHistoryService } from './user-history.service'

vi.mock('@/lib/api/client', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}))

describe('userHistoryService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getHistory', () => {
    it('requests history with encoded user id and normalizes snapshot', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        data: {
          data: {
            user: { id: 'u1', username: 'alex', displayName: 'Alex', role: { code: 'admin' } },
            generatedAt: '2024-06-01T00:00:00Z',
            ticketCounts: { assigned: 2, created: 1, actedOn: 3 },
            ticketsByStatus: {
              assigned: { in_progress: 1, closed: 1 },
              created: { created: 1 },
            },
            metrics: {
              window: { days: 14, fromInclusive: '2024-05-18', toInclusive: '2024-06-01' },
              assigned: {
                totalCount: 2,
                openCount: 1,
                resolvedPerDay: [{ date: '2024-06-01', count: 1 }],
              },
              created: { totalCount: 1 },
              actedOn: { distinctTicketCount: 2, activityCount: 5 },
            },
            recent: {
              assignedTickets: [
                {
                  id: 't1',
                  ticketNumber: '100',
                  title: 'Issue',
                  status: 'in_progress',
                  severity: 'high',
                  priority: 'p1',
                  bus: { busNumber: 'B-1' },
                  category: { name: 'Mechanical' },
                  createdBy: { id: 'u2', username: 'sam', displayName: 'Sam' },
                },
              ],
              createdTickets: [],
              activity: [
                {
                  id: 'a1',
                  actionType: 'status_changed',
                  fromStatus: 'assigned',
                  toStatus: 'in_progress',
                  createdAt: '2024-06-01T10:00:00Z',
                  ticket: { id: 't1', ticketNumber: '100', title: 'Issue', status: 'in_progress', bus: { busNumber: 'B-1' } },
                },
              ],
            },
          },
        },
      })

      const snapshot = await userHistoryService.getHistory('user/1', 14, 5)

      expect(apiClient.get).toHaveBeenCalledWith('/users/user%2F1/history', {
        params: { days: 14, recentLimit: 5 },
      })
      expect(snapshot.user).toMatchObject({ id: 'u1', role: { code: 'admin', label: 'Admin' } })
      expect(snapshot.ticketCounts).toEqual({ assigned: 2, created: 1, actedOn: 3 })
      expect(snapshot.recent.assignedTickets[0]?.title).toBe('Issue')
      expect(snapshot.recent.activity[0]?.actionType).toBe('status_changed')
    })

    it('falls back to unknown user when payload is empty', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({ data: null })

      const snapshot = await userHistoryService.getHistory('missing')

      expect(snapshot.user.displayName).toBe('Unknown user')
      expect(snapshot.recent.assignedTickets).toEqual([])
    })
  })

  describe('getMetrics', () => {
    it('returns metrics with user fallback', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({ data: { metrics: { window: { days: 7 } } } })

      const result = await userHistoryService.getMetrics('u1', 7)

      expect(apiClient.get).toHaveBeenCalledWith('/users/u1/metrics', { params: { days: 7 } })
      expect(result.user.id).toBe('u1')
      expect(result.metrics.window.days).toBe(7)
    })
  })

  describe('listTickets', () => {
    it('passes filters and normalizes pagination meta', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        data: {
          data: {
            userId: 'u1',
            relation: 'assigned',
            items: [{ id: 't1', title: 'Issue', status: 'bogus', severity: 'bogus', priority: 'bogus' }],
          },
          meta: { page: 2, limit: 10, total: 1, totalPages: 1 },
        },
      })

      const result = await userHistoryService.listTickets('u1', {
        relation: 'created',
        page: 2,
        limit: 10,
        status: 'closed',
        severity: 'high',
        priority: 'p1',
        categoryId: 'c1',
        busId: 'b1',
      })

      expect(apiClient.get).toHaveBeenCalledWith('/users/u1/tickets', {
        params: {
          relation: 'created',
          page: 2,
          limit: 10,
          status: 'closed',
          severity: 'high',
          priority: 'p1',
          categoryId: 'c1',
          busId: 'b1',
        },
      })
      expect(result.items[0]).toMatchObject({
        status: 'created',
        severity: 'medium',
        priority: 'p2',
      })
      expect(result.meta.page).toBe(2)
    })
  })

  describe('listActivity', () => {
    it('filters activity notes that mirror internal ids', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        data: {
          data: {
            items: [
              {
                id: 'a1',
                actionType: 'commented',
                note: 'tkt_internal',
                createdAt: '2024-06-01',
                ticket: { id: 't1', ticketNumber: 'tkt_internal', title: 'Issue', status: 'created' },
              },
            ],
          },
        },
      })

      const result = await userHistoryService.listActivity('u1', 1, 20)

      expect(result.items[0]?.note).toBeNull()
      expect(result.items[0]?.ticket.ticketNumber).toBe('')
    })
  })
})
