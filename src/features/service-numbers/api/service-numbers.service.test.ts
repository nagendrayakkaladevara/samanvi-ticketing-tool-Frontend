import { beforeEach, describe, expect, it, vi } from 'vitest'

import { apiClient } from '@/lib/api/client'
import { serviceNumbersService } from './service-numbers.service'

vi.mock('@/lib/api/client', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}))

const minimalServiceNumber = {
  id: 'sn1',
  serviceNo: '101',
  from: 'A',
  to: 'B',
  via: 'Highway',
  parkingAmount: 100,
  driverOneBeta: 50,
  driverTwoBeta: 40,
  helperBeta: 30,
  conductorBeta: 20,
  distance: 120,
  optDriver: 'D',
  optHelper: 'H',
  remarks: 'Notes',
  serviceFor: { id: 'sf1', serviceFor: 'Express' },
}

describe('serviceNumbersService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('list normalizes service numbers', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({ data: { items: [minimalServiceNumber] } })
    const items = await serviceNumbersService.list({ page: 1, limit: 10 })
    expect(apiClient.get).toHaveBeenCalledWith('/master/service-numbers', {
      params: { page: 1, limit: 10 },
    })
    expect(items[0]?.serviceNo).toBe('101')
  })

  it('create posts service number', async () => {
    vi.mocked(apiClient.post).mockResolvedValue({
      data: { data: { serviceNumber: minimalServiceNumber } },
    })
    const item = await serviceNumbersService.create(minimalServiceNumber as never)
    expect(item.serviceNo).toBe('101')
  })

  it('update patches service number', async () => {
    vi.mocked(apiClient.patch).mockResolvedValue({ data: { data: minimalServiceNumber } })
    await serviceNumbersService.update({ serviceNumberId: 'sn1', remarks: 'Updated' })
    expect(apiClient.patch).toHaveBeenCalledWith('/master/service-numbers/sn1', { remarks: 'Updated' })
  })

  it('remove deletes service number', async () => {
    vi.mocked(apiClient.delete).mockResolvedValue({})
    await serviceNumbersService.remove('sn1')
    expect(apiClient.delete).toHaveBeenCalledWith('/master/service-numbers/sn1')
  })

  describe('payload extraction and normalization', () => {
    it.each([
      [{ data: [minimalServiceNumber] }],
      [{ data: { items: [minimalServiceNumber] } }],
      [{ data: { serviceNumbers: [minimalServiceNumber] } }],
      [{ items: [minimalServiceNumber] }],
      [{ serviceNumbers: [minimalServiceNumber] }],
      [[minimalServiceNumber]],
    ] as const)('list from payload %#', async (payload) => {
      vi.mocked(apiClient.get).mockResolvedValue({ data: payload })
      expect((await serviceNumbersService.list())[0]?.serviceNo).toBe('101')
    })

    it('filters invalid service numbers and normalizes numeric fields', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        data: [
          null,
          { id: 'bad' },
          {
            serviceNumberId: 5,
            serviceNo: '202',
            from: 'A',
            to: 'B',
            via: 'V',
            parkingAmount: '10',
            driverOneBeta: 1,
            driverTwoBeta: 2,
            helperBeta: 3,
            conductorBeta: 4,
            distance: '50',
            optDriver: 'D',
            optHelper: 'H',
            remarks: 'R',
            serviceFor: { serviceForId: 9, serviceFor: 'Local' },
          },
        ],
      })
      const [item] = await serviceNumbersService.list()
      expect(item?.id).toBe('5')
      expect(item?.parkingAmount).toBe(10)
      expect(item?.distance).toBe(50)
      expect(item?.serviceFor.id).toBe('9')
    })

    it('create and update fall back when normalize fails', async () => {
      vi.mocked(apiClient.post).mockResolvedValue({ data: { data: { id: 'raw' } } })
      expect(await serviceNumbersService.create(minimalServiceNumber as never)).toEqual({ id: 'raw' })

      vi.mocked(apiClient.patch).mockResolvedValue({ data: { serviceNumber: { id: 'raw-2' } } })
      expect(await serviceNumbersService.update({ serviceNumberId: 'sn1', remarks: 'Z' })).toEqual({ id: 'raw-2' })
    })

    it('list uses default pagination', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({ data: [] })
      await serviceNumbersService.list()
      expect(apiClient.get).toHaveBeenCalledWith('/master/service-numbers', { params: { page: 1, limit: 50 } })
    })

    it('filters records with invalid numeric fields and serviceFor refs', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        data: [
          { ...minimalServiceNumber, parkingAmount: 'bad' },
          { ...minimalServiceNumber, id: 'sn-bad-sf', serviceFor: { serviceFor: 'Missing id' } },
          {
            ...minimalServiceNumber,
            id: 'sn-dates',
            createdAt: '2024-01-01',
            updatedAt: '2024-02-01',
          },
        ],
      })

      const items = await serviceNumbersService.list()
      expect(items).toHaveLength(1)
      expect(items[0]?.id).toBe('sn-dates')
      expect(items[0]?.createdAt).toBe('2024-01-01')
    })

    it('returns empty list for invalid payloads', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({ data: null })
      expect(await serviceNumbersService.list()).toEqual([])
    })

    it('extracts from top-level serviceNumbers and handles non-object payloads', async () => {
      vi.mocked(apiClient.get).mockResolvedValueOnce({
        data: { serviceNumbers: [minimalServiceNumber] },
      })
      expect((await serviceNumbersService.list())[0]?.serviceNo).toBe('101')

      vi.mocked(apiClient.post).mockResolvedValue({ data: null })
      expect(await serviceNumbersService.create(minimalServiceNumber as never)).toBeNull()
    })
  })
})
