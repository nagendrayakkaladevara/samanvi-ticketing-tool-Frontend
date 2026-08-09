import { beforeEach, describe, expect, it, vi } from 'vitest'

import { apiClient } from '@/lib/api/client'
import { notificationsService } from './notifications.service'

vi.mock('@/lib/api/client', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}))

describe('notificationsService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('list', () => {
    it('requests paginated notifications with unreadOnly flag', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        data: {
          data: [
            {
              id: 'n1',
              type: 'ticket_created',
              title: ' New ticket ',
              message: '',
              createdAt: '2024-01-01T00:00:00.000Z',
              ticketNumber: '42',
            },
            { id: '', title: 'skip' },
          ],
          meta: { page: 2, limit: 10, total: 1, totalPages: 1 },
        },
      })

      const result = await notificationsService.list({ page: 2, limit: 10, unreadOnly: true })

      expect(apiClient.get).toHaveBeenCalledWith('/notifications', {
        params: { page: 2, limit: 10, unreadOnly: 'true' },
      })
      expect(result.items).toHaveLength(1)
      expect(result.items[0]).toMatchObject({
        id: 'n1',
        type: 'ticket_created',
        title: 'New ticket',
        message: '',
        ticketNumber: 42,
      })
      expect(result.meta).toEqual({ page: 2, limit: 10, total: 1, totalPages: 1 })
    })

    it('defaults unknown notification type to ticket_created', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        data: [{ id: 'n1', type: 'unknown', title: 'T', createdAt: '2024-01-01T00:00:00.000Z' }],
      })

      const result = await notificationsService.list()
      expect(result.items[0]?.type).toBe('ticket_created')
    })

    it('filters out notifications with invalid createdAt', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        data: [{ id: 'n1', title: 'T', createdAt: 'not-a-date' }],
      })

      expect((await notificationsService.list()).items).toEqual([])
    })
  })

  describe('getUnreadCount', () => {
    it('returns count from nested payload', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({ data: { data: { count: 7 } } })
      expect(await notificationsService.getUnreadCount()).toBe(7)
    })

    it('returns zero when count is missing', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({ data: {} })
      expect(await notificationsService.getUnreadCount()).toBe(0)
    })
  })

  describe('markRead', () => {
    it('patches notification and allows createdAt fallback', async () => {
      vi.mocked(apiClient.patch).mockResolvedValue({
        data: { data: { id: 'n1', title: 'Read', readAt: '2024-01-02T00:00:00.000Z' } },
      })

      const result = await notificationsService.markRead('n1')

      expect(apiClient.patch).toHaveBeenCalledWith('/notifications/n1/read')
      expect(result.id).toBe('n1')
      expect(result.readAt).toBe('2024-01-02T00:00:00.000Z')
      expect(result.createdAt).toBeTruthy()
    })

    it('throws when response cannot be normalized', async () => {
      vi.mocked(apiClient.patch).mockResolvedValue({ data: { data: { title: 'no id' } } })

      await expect(notificationsService.markRead('n1')).rejects.toThrow('Invalid notification response.')
    })
  })

  describe('markAllRead', () => {
    it('returns updatedCount from payload', async () => {
      vi.mocked(apiClient.patch).mockResolvedValue({ data: { updatedCount: 3 } })
      expect(await notificationsService.markAllRead()).toBe(3)
    })

    it('returns zero when updatedCount is absent', async () => {
      vi.mocked(apiClient.patch).mockResolvedValue({ data: {} })
      expect(await notificationsService.markAllRead()).toBe(0)
    })
  })
})
