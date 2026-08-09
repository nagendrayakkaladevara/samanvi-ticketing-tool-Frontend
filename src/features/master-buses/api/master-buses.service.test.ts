import { beforeEach, describe, expect, it, vi } from 'vitest'

import { apiClient } from '@/lib/api/client'
import { masterBusesService } from './master-buses.service'

vi.mock('@/lib/api/client', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}))

const minimalBus = {
  id: 'b1',
  busNumber: 'BUS-01',
  engineNumber: 'ENG-1',
  chassisNumber: 'CHS-1',
  odometer: 1000,
  insuranceValidity: '01-01-2025',
}

describe('masterBusesService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('list', () => {
    it('normalizes buses from nested payloads', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        data: { data: { buses: [minimalBus] } },
      })

      const buses = await masterBusesService.list({ page: 1, limit: 25 })
      expect(apiClient.get).toHaveBeenCalledWith('/master/buses', { params: { page: 1, limit: 25 } })
      expect(buses[0]?.busNumber).toBe('BUS-01')
    })

    it('filters invalid buses', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({ data: [null, { id: '' }] })
      expect(await masterBusesService.list()).toEqual([])
    })
  })

  describe('listBusNumbers', () => {
    it('deduplicates and sorts bus numbers', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        data: { busNumbers: ['10', '2', '10', { busNumber: '1' }] },
      })

      const numbers = await masterBusesService.listBusNumbers()
      expect(apiClient.get).toHaveBeenCalledWith('/master/buses/bus-numbers')
      expect(numbers).toEqual(['1', '2', '10'])
    })
  })

  describe('create', () => {
    it('posts bus input', async () => {
      vi.mocked(apiClient.post).mockResolvedValue({
        data: { data: { bus: minimalBus } },
      })

      const bus = await masterBusesService.create(minimalBus as never)
      expect(apiClient.post).toHaveBeenCalledWith('/master/buses', minimalBus)
      expect(bus.busNumber).toBe('BUS-01')
    })
  })

  describe('update', () => {
    it('patches bus fields', async () => {
      vi.mocked(apiClient.patch).mockResolvedValue({ data: { data: minimalBus } })
      await masterBusesService.update({ busId: 'b1', odometer: 2000 })
      expect(apiClient.patch).toHaveBeenCalledWith('/master/buses/b1', { odometer: 2000 })
    })
  })

  describe('remove', () => {
    it('deletes bus', async () => {
      vi.mocked(apiClient.delete).mockResolvedValue({})
      await masterBusesService.remove('b1')
      expect(apiClient.delete).toHaveBeenCalledWith('/master/buses/b1')
    })
  })

  describe('payload extraction and normalization', () => {
    it.each([
      [{ data: [minimalBus] }, 'data array'],
      [{ data: { items: [minimalBus] } }, 'nested items'],
      [{ items: [minimalBus] }, 'top-level items'],
      [[minimalBus], 'raw array'],
    ] as const)('list from %s', async (payload) => {
      vi.mocked(apiClient.get).mockResolvedValue({ data: payload })
      const buses = await masterBusesService.list()
      expect(buses[0]?.busNumber).toBe('BUS-01')
    })

    it('normalizes alternate id keys and nullable date fields', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        data: [
          {
            busId: 99,
            busNumber: 'B-99',
            engineNumber: 'E',
            chassisNumber: 'C',
            odometer: '5000',
            insuranceValidity: '01-01-2025',
            purchaseDate: '  ',
            pollutionValidity: null,
            remarks: '  note  ',
            fcValidity: '01-02-2025',
            basePermitValidity: '01-03-2025',
            homeTaxValidity: '01-04-2025',
            aitpValidity: '01-05-2025',
            aitpAuthorizationValidity: '01-06-2025',
            serviceOutDate: '01-07-2025',
            lastMaintenanceDate: '01-08-2025',
            createdAt: '2024-01-01',
            updatedAt: '2024-02-01',
          },
        ],
      })
      const [bus] = await masterBusesService.list()
      expect(bus?.id).toBe('99')
      expect(bus?.odometer).toBe(5000)
      expect(bus?.purchaseDate).toBeNull()
      expect(bus?.remarks).toBe('note')
      expect(bus?.fcValidity).toBe('01-02-2025')
      expect(bus?.createdAt).toBe('2024-01-01')
    })

    it('returns empty list for invalid payloads', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({ data: null })
      expect(await masterBusesService.list()).toEqual([])
    })

    it.each([
      [{ data: ['10', '2'] }, ['2', '10']],
      [{ data: { busNumbers: ['A-1', { busNumber: 'B-2' }] } }, ['A-1', 'B-2']],
      [[{ busNumber: 'C-3' }], ['C-3']],
      [{ busNumbers: ['  ', 'D-4'] }, ['D-4']],
      [{ data: [{ busNumber: 'E-5' }] }, ['E-5']],
    ] as const)('listBusNumbers extracts %#', async (payload, expected) => {
      vi.mocked(apiClient.get).mockResolvedValue({ data: payload })
      expect(await masterBusesService.listBusNumbers()).toEqual(expected)
    })

    it('create falls back when normalize fails', async () => {
      vi.mocked(apiClient.post).mockResolvedValue({ data: { data: { bus: { id: 'raw' } } } })
      const bus = await masterBusesService.create(minimalBus as never)
      expect(bus).toEqual({ id: 'raw' })
    })

    it('update falls back when normalize fails', async () => {
      vi.mocked(apiClient.patch).mockResolvedValue({ data: { bus: { id: 'raw-2' } } })
      const bus = await masterBusesService.update({ busId: 'b1', odometer: 1 })
      expect(bus).toEqual({ id: 'raw-2' })
    })
  })
})
