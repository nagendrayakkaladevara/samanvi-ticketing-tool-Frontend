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
})
