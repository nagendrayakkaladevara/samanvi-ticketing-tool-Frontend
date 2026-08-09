import { beforeEach, describe, expect, it, vi } from 'vitest'

import { apiClient } from '@/lib/api/client'
import { busesService } from './buses.service'

vi.mock('@/lib/api/client', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}))

describe('busesService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('list', () => {
    it('normalizes buses from a top-level array', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        data: [{ id: '1', busNumber: ' BUS-01 ' }],
      })

      const result = await busesService.list()

      expect(apiClient.get).toHaveBeenCalledWith('/buses')
      expect(result).toEqual([{ id: '1', busNumber: 'BUS-01' }])
    })

    it('extracts buses from nested data.items payload', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        data: {
          data: {
            items: [
              { busId: 42, bus_no: 'B-42', last_maintenance_date: '2024-01-01' },
              { id: '', busNumber: 'skip' },
              null,
            ],
          },
        },
      })

      const result = await busesService.list()

      expect(result).toEqual([
        { id: '42', busNumber: 'B-42', lastMaintenanceDate: '2024-01-01' },
      ])
    })

    it('returns empty array for invalid payloads', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({ data: null })
      expect(await busesService.list()).toEqual([])
    })
  })

  describe('listBusNumbers', () => {
    it('deduplicates and sorts bus numbers numerically', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        data: { busNumbers: ['10', '2', '10', '  ', { busNo: '1' }] },
      })

      const result = await busesService.listBusNumbers()

      expect(apiClient.get).toHaveBeenCalledWith('/buses/bus-numbers')
      expect(result).toEqual(['1', '2', '10'])
    })

    it('extracts numbers from nested data.busNumbers', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        data: { data: { busNumbers: ['A-1', 'B-2'] } },
      })

      expect(await busesService.listBusNumbers()).toEqual(['A-1', 'B-2'])
    })
  })

  describe('create', () => {
    it('trims bus number and omits empty maintenance date', async () => {
      vi.mocked(apiClient.post).mockResolvedValue({
        data: { data: { id: 'new', busNumber: 'X-1' } },
      })

      const result = await busesService.create({ busNumber: '  X-1  ' })

      expect(apiClient.post).toHaveBeenCalledWith('/buses', { busNumber: 'X-1' })
      expect(result).toEqual({ id: 'new', busNumber: 'X-1' })
    })

    it('includes lastMaintenanceDate when provided', async () => {
      vi.mocked(apiClient.post).mockResolvedValue({
        data: { bus: { id: '1', busNumber: 'X-1', maintenanceDate: '01-02-2024' } },
      })

      await busesService.create({ busNumber: 'X-1', lastMaintenanceDate: '01-02-2024' })

      expect(apiClient.post).toHaveBeenCalledWith('/buses', {
        busNumber: 'X-1',
        lastMaintenanceDate: '01-02-2024',
      })
    })
  })

  describe('listTicketHistory', () => {
    it('normalizes ticket history with alternate keys and defaults', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        data: [
          {
            ticketId: 't1',
            title: ' Brake issue ',
            status: 'in_progress',
            severity: 'bogus',
            priority: 'p2',
            assignedTo: { displayName: 'Alex' },
            created_at: '2024-01-01T00:00:00Z',
          },
          { id: 't2' },
        ],
      })

      const result = await busesService.listTicketHistory('bus-1')

      expect(apiClient.get).toHaveBeenCalledWith('/buses/bus-1/tickets')
      expect(result).toEqual([
        {
          id: 't1',
          title: 'Brake issue',
          status: 'IN_PROGRESS',
          severity: 'LOW',
          priority: 'P2',
          assignedToName: 'Alex',
          createdAt: '2024-01-01T00:00:00Z',
        },
      ])
    })
  })

  describe('payload extraction and normalization', () => {
    it.each([
      [{ data: [{ id: '1', busNumber: 'B-1' }] }],
      [{ data: { buses: [{ id: '2', bus_no: 'B-2' }] } }],
      [{ buses: [{ id: '3', busNo: 'B-3' }] }],
      [{ items: [{ id: '4', number: 'B-4' }] }],
    ] as const)('list from %#', async (payload) => {
      vi.mocked(apiClient.get).mockResolvedValue({ data: payload })
      expect((await busesService.list())[0]?.busNumber).toMatch(/^B-/)
    })

    it('listBusNumbers uses nested data array and bus number aliases', async () => {
      vi.mocked(apiClient.get).mockResolvedValueOnce({ data: { data: ['A-1', 'B-2'] } })
      expect(await busesService.listBusNumbers()).toEqual(['A-1', 'B-2'])

      vi.mocked(apiClient.get).mockResolvedValueOnce({
        data: { busNumbers: [{ bus_no: 'C-3' }, { number: 'D-4' }] },
      })
      expect(await busesService.listBusNumbers()).toEqual(['C-3', 'D-4'])

      vi.mocked(apiClient.get).mockResolvedValueOnce({ data: null })
      expect(await busesService.listBusNumbers()).toEqual([])
    })

    it('create extracts bus from top-level bus wrapper', async () => {
      vi.mocked(apiClient.post).mockResolvedValue({
        data: { bus: { id: 'new', busNumber: 'X-1', last_maintenance_date: '01-01-2024' } },
      })
      const bus = await busesService.create({ busNumber: 'X-1' })
      expect(bus.busNumber).toBe('X-1')
      expect(bus.lastMaintenanceDate).toBe('01-01-2024')
    })

    it('create falls back when normalize fails', async () => {
      vi.mocked(apiClient.post).mockResolvedValue({ data: { bus: { busNumber: 'only' } } })
      expect(await busesService.create({ busNumber: 'X' })).toEqual({ busNumber: 'only' })
    })

    it('listBusNumbers maps array items directly when extractArrayPayload is non-empty', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        data: [{ busNumber: 'ARR-1' }, { number: 'ARR-2' }],
      })
      expect(await busesService.listBusNumbers()).toEqual(['ARR-1', 'ARR-2'])
    })

    it('listTicketHistory normalizes all status severity priority branches', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        data: [
          {
            id: 't1',
            title: 'Blocked',
            status: 'blocked',
            severity: 'critical',
            priority: 'p1',
            assigneeName: 'Worker',
            created_at: '2024-01-01',
          },
          {
            ticketId: 't2',
            title: 'Reopened',
            status: 'REOPENED',
            severity: 'HIGH',
            priority: 'P2',
            assignedTo: { name: 'Alex' },
          },
          { id: 't3', title: 'Defaults', status: 'bogus', severity: 'bogus', priority: 'bogus' },
          {
            id: 't4',
            title: 'Resolved',
            status: 'resolved',
            severity: 'medium',
            priority: 'p3',
            assignedToName: 'Direct Assignee',
          },
          { id: 't5', title: 'Closed', status: 'CLOSED', severity: 'HIGH', priority: 'P1' },
          { id: 't6', title: 'Assigned', status: 'assigned', severity: 'critical', priority: 'p2' },
        ],
      })

      const tickets = await busesService.listTicketHistory('bus-1')
      expect(tickets).toEqual([
        {
          id: 't1',
          title: 'Blocked',
          status: 'BLOCKED',
          severity: 'CRITICAL',
          priority: 'P1',
          assignedToName: 'Worker',
          createdAt: '2024-01-01',
        },
        {
          id: 't2',
          title: 'Reopened',
          status: 'REOPENED',
          severity: 'HIGH',
          priority: 'P2',
          assignedToName: 'Alex',
          createdAt: undefined,
        },
        {
          id: 't3',
          title: 'Defaults',
          status: 'CREATED',
          severity: 'LOW',
          priority: 'P3',
          assignedToName: undefined,
          createdAt: undefined,
        },
        {
          id: 't4',
          title: 'Resolved',
          status: 'RESOLVED',
          severity: 'MEDIUM',
          priority: 'P3',
          assignedToName: 'Direct Assignee',
          createdAt: undefined,
        },
        {
          id: 't5',
          title: 'Closed',
          status: 'CLOSED',
          severity: 'HIGH',
          priority: 'P1',
          assignedToName: undefined,
          createdAt: undefined,
        },
        {
          id: 't6',
          title: 'Assigned',
          status: 'ASSIGNED',
          severity: 'CRITICAL',
          priority: 'P2',
          assignedToName: undefined,
          createdAt: undefined,
        },
      ])
    })
  })
})
