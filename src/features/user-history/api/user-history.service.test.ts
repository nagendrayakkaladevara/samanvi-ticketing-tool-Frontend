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

    it('normalizes all activity action types and status transitions', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        data: {
          data: {
            userId: 'u1',
            items: [
              {
                id: 'a1',
                action: 'created',
                fromStatus: 'created',
                toStatus: 'assigned',
                note: 'Started',
                createdAt: '2024-06-01',
                ticket: { ticketId: 't1', title: 'Issue', status: 'assigned', bus: { number: 'B-1' } },
              },
              {
                id: 'a2',
                actionType: 'bogus',
                createdAt: '2024-06-02',
                ticket: { id: 't2', title: 'Other', status: 'bogus' },
              },
              {
                id: 'a3',
                actionType: 'reopened',
                createdAt: '2024-06-03',
                ticket: { id: 't3', title: 'Reopened', status: 'reopened' },
              },
            ],
          },
          meta: { page: 1, limit: 20, total: 3, totalPages: 1 },
        },
      })

      const result = await userHistoryService.listActivity('u1', 1, 20)

      expect(result.items[0]).toMatchObject({
        actionType: 'created',
        fromStatus: 'created',
        toStatus: 'assigned',
        note: 'Started',
      })
      expect(result.items[1]?.actionType).toBe('commented')
      expect(result.items[2]?.actionType).toBe('reopened')
      expect(result.meta.total).toBe(3)
    })
  })

  describe('normalization branches', () => {
    it.each([
      ['supervisor', 'Supervisor'],
      ['admin', 'Admin'],
      ['bogus', 'Worker'],
    ] as const)('maps role code %s to label %s', async (code, label) => {
      vi.mocked(apiClient.get).mockResolvedValue({
        data: { data: { user: { id: 'u1', username: 'u1', roleCode: code } } },
      })
      const metrics = await userHistoryService.getMetrics('u1')
      expect(metrics.user.role).toEqual({ code: code === 'bogus' ? 'worker' : code, label })
    })

    it.each([
      ['critical', 'critical'],
      ['high', 'high'],
      ['medium', 'medium'],
      ['low', 'low'],
      ['bogus', 'medium'],
    ] as const)('normalizes severity %s', async (raw, expected) => {
      vi.mocked(apiClient.get).mockResolvedValue({
        data: {
          data: {
            userId: 'u1',
            items: [{ id: 't1', title: 'T', severity: raw }],
          },
        },
      })
      const result = await userHistoryService.listTickets('u1')
      expect(result.items[0]?.severity).toBe(expected)
    })

    it.each([
      ['p1', 'p1'],
      ['p2', 'p2'],
      ['p3', 'p3'],
      ['bogus', 'p2'],
    ] as const)('normalizes priority %s', async (raw, expected) => {
      vi.mocked(apiClient.get).mockResolvedValue({
        data: {
          data: {
            userId: 'u1',
            items: [{ id: 't1', title: 'T', priority: raw }],
          },
        },
      })
      const result = await userHistoryService.listTickets('u1')
      expect(result.items[0]?.priority).toBe(expected)
    })

    it.each([
      'created',
      'assigned',
      'in_progress',
      'blocked',
      'resolved',
      'closed',
      'reopened',
    ] as const)('normalizes ticket status %s', async (status) => {
      vi.mocked(apiClient.get).mockResolvedValue({
        data: {
          data: {
            userId: 'u1',
            items: [{ id: 't1', title: 'T', status }],
          },
        },
      })
      const result = await userHistoryService.listTickets('u1')
      expect(result.items[0]?.status).toBe(status)
    })

    it('normalizes full ticket item with assigned user and overdue fields', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        data: {
          data: {
            userId: 'u1',
            items: [
              {
                ticketId: 't1',
                number: '100',
                title: 'Full ticket',
                status: 'resolved',
                severity: 'high',
                priority: 'p1',
                slaDueAt: '2024-06-01',
                assignedAt: '2024-06-02',
                resolvedAt: '2024-06-03',
                closedAt: '2024-06-04',
                reopenedCount: 2,
                createdAt: '2024-05-01',
                updatedAt: '2024-06-04',
                isOverdue: true,
                overdueDurationMs: 5000,
                bus: { busId: 'b1', busNumber: 'B-9' },
                category: { categoryId: 'c1', name: 'Fuel' },
                createdByUser: { userId: 'u2', username: 'sam', displayName: 'Sam' },
                assignedToUser: { id: 'u3', username: 'worker', name: 'Worker' },
              },
            ],
          },
        },
      })

      const [ticket] = (await userHistoryService.listTickets('u1')).items

      expect(ticket).toMatchObject({
        id: 't1',
        ticketNumber: '100',
        title: 'Full ticket',
        assignedAt: '2024-06-02',
        resolvedAt: '2024-06-03',
        closedAt: '2024-06-04',
        reopenedCount: 2,
        isOverdue: true,
        overdueDurationMs: 5000,
        bus: { id: 'b1', busNumber: 'B-9' },
        category: { id: 'c1', name: 'Fuel' },
        createdBy: { id: 'u2', username: 'sam', displayName: 'Sam' },
        assignedTo: { id: 'u3', username: 'worker', displayName: 'Worker' },
      })
    })

    it('getHistory includes created tickets and status breakdown', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        data: {
          data: {
            user: { userId: 'u1', username: 'alex', role: { label: 'Custom' } },
            generatedAt: '2024-06-01',
            ticketCounts: { assigned: 1, created: 2, actedOn: 3 },
            ticketsByStatus: {
              assigned: { in_progress: 1 },
              created: { created: 2, resolved: 1 },
            },
            metrics: {
              window: { days: 7, from: '2024-05-25', to: '2024-06-01' },
              assigned: {
                totalCount: 1,
                openCount: 1,
                overdueOpenCount: 0,
                resolvedAllTimeCount: 5,
                resolvedInWindowCount: 1,
                resolvedPerDay: [{ date: '2024-06-01', count: 1 }, { count: 2 }],
                averageResolutionTimeMs: null,
                slaCompliancePercent: 90,
              },
              created: { totalCount: 2 },
              actedOn: { distinctTicketCount: 2, activityCount: 4 },
            },
            recent: {
              assignedTickets: [],
              createdTickets: [{ id: 't-new', title: 'Created ticket', status: 'created' }],
              activity: [],
            },
          },
        },
      })

      const snapshot = await userHistoryService.getHistory('u1', 7, 3)

      expect(snapshot.user.role.label).toBe('Custom')
      expect(snapshot.ticketsByStatus.created).toEqual({ created: 2, resolved: 1 })
      expect(snapshot.metrics.assigned.resolvedPerDay).toEqual([{ date: '2024-06-01', count: 1 }])
      expect(snapshot.metrics.assigned.averageResolutionTimeMs).toBeNull()
      expect(snapshot.recent.createdTickets[0]?.title).toBe('Created ticket')
    })

    it('listTickets uses defaults when query options omitted', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        data: { data: { items: [] }, meta: { total: 0 } },
      })

      await userHistoryService.listTickets('u1')

      expect(apiClient.get).toHaveBeenCalledWith('/users/u1/tickets', {
        params: { relation: 'assigned', page: 1, limit: 20 },
      })
    })

    it('listTickets computes totalPages fallback from total', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        data: { data: { items: [] } },
      })

      const result = await userHistoryService.listTickets('u1', { page: 1, limit: 10 })
      expect(result.meta.totalPages).toBe(1)
    })

    it('listActivity skips items without ticket id and uses meta from data', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        data: {
          data: {
            userId: 'u1',
            items: [
              { id: 'a-bad', actionType: 'commented', createdAt: '2024-01-01' },
              {
                id: 'a-good',
                action: 'assigned',
                createdAt: '2024-01-02',
                ticket: { ticketId: 't1', title: 'T', status: 'assigned' },
              },
            ],
            meta: { page: 2, limit: 5, total: 10, totalPages: 2 },
          },
        },
      })

      const result = await userHistoryService.listActivity('u1', 2, 5)
      expect(result.items).toHaveLength(1)
      expect(result.meta.page).toBe(2)
      expect(result.userId).toBe('u1')
    })

    it('normalizes ticket without assigned user and with userId alias', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        data: {
          data: {
            userId: 'u1',
            items: [
              {
                id: 't-alias',
                title: 'Alias id',
                status: 'resolved',
                severity: 'low',
                priority: 'p3',
                assignedTo: null,
              },
            ],
          },
        },
      })

      const [ticket] = (await userHistoryService.listTickets('u1')).items
      expect(ticket?.id).toBe('t-alias')
      expect(ticket?.assignedTo).toBeNull()
    })
  })
})
