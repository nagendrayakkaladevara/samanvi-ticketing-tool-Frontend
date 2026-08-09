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
})
