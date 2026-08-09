import { beforeEach, describe, expect, it, vi } from 'vitest'

import { apiClient } from '@/lib/api/client'
import { driversService } from './drivers.service'

vi.mock('@/lib/api/client', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}))

const minimalDriver = {
  id: 'd1',
  driverIdNumber: 'DRV-001',
  aadharName: 'John',
  dlName: 'John D',
  mobileNumber: '9876543210',
  aadharNumber: '123456789012',
  dlNumber: 'DL123',
}

describe('driversService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('list', () => {
    it('normalizes drivers from array payload', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({ data: [minimalDriver] })
      const drivers = await driversService.list({ page: 1, limit: 50 })
      expect(apiClient.get).toHaveBeenCalledWith('/master/drivers', { params: { page: 1, limit: 50 } })
      expect(drivers[0]?.driverIdNumber).toBe('DRV-001')
    })

    it('filters invalid drivers', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({ data: [null, { id: '' }] })
      expect(await driversService.list()).toEqual([])
    })
  })

  describe('getById', () => {
    it('returns normalized driver', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({ data: { data: minimalDriver } })
      const driver = await driversService.getById('d1')
      expect(driver.id).toBe('d1')
    })

    it('throws when driver cannot be parsed', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({ data: { data: { id: '' } } })
      await expect(driversService.getById('d1')).rejects.toThrow('Unable to load driver details.')
    })
  })

  describe('create', () => {
    it('posts and normalizes created driver', async () => {
      vi.mocked(apiClient.post).mockResolvedValue({ data: { data: minimalDriver } })
      const driver = await driversService.create(minimalDriver as never)
      expect(apiClient.post).toHaveBeenCalledWith('/master/drivers', minimalDriver)
      expect(driver.driverIdNumber).toBe('DRV-001')
    })

    it('throws on unparseable response', async () => {
      vi.mocked(apiClient.post).mockResolvedValue({ data: { data: null } })
      await expect(driversService.create(minimalDriver as never)).rejects.toThrow(
        'Driver was created but the response could not be parsed.',
      )
    })
  })

  describe('update', () => {
    it('patches driver fields', async () => {
      vi.mocked(apiClient.patch).mockResolvedValue({ data: { data: minimalDriver } })
      await driversService.update({ driverId: 'd1', aadharName: 'Updated' })
      expect(apiClient.patch).toHaveBeenCalledWith('/master/drivers/d1', { aadharName: 'Updated' })
    })
  })

  describe('remove', () => {
    it('deletes driver', async () => {
      vi.mocked(apiClient.delete).mockResolvedValue({})
      await driversService.remove('d1')
      expect(apiClient.delete).toHaveBeenCalledWith('/master/drivers/d1')
    })
  })
})
