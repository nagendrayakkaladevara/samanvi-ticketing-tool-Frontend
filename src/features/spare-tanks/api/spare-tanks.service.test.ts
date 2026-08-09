import { beforeEach, describe, expect, it, vi } from 'vitest'

import { apiClient } from '@/lib/api/client'
import { spareTanksService } from './spare-tanks.service'

vi.mock('@/lib/api/client', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}))

const minimalTank = {
  id: 'st1',
  busNumber: 'BUS-01',
  ownerName: 'Owner',
}

describe('spareTanksService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('list normalizes spare tanks', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({ data: [minimalTank] })
    const tanks = await spareTanksService.list()
    expect(apiClient.get).toHaveBeenCalledWith('/master/spare-tanks', { params: { page: 1, limit: 50 } })
    expect(tanks[0]?.busNumber).toBe('BUS-01')
  })

  it('create trims input fields', async () => {
    vi.mocked(apiClient.post).mockResolvedValue({ data: { data: minimalTank } })
    await spareTanksService.create({ busNumber: '  BUS-01  ', ownerName: '  Owner  ' })
    expect(apiClient.post).toHaveBeenCalledWith('/master/spare-tanks', {
      busNumber: 'BUS-01',
      ownerName: 'Owner',
    })
  })

  it('update trims provided fields', async () => {
    vi.mocked(apiClient.patch).mockResolvedValue({ data: { data: minimalTank } })
    await spareTanksService.update({ spareTankId: 'st1', ownerName: '  New Owner  ' })
    expect(apiClient.patch).toHaveBeenCalledWith('/master/spare-tanks/st1', { ownerName: 'New Owner' })
  })

  it('remove deletes spare tank', async () => {
    vi.mocked(apiClient.delete).mockResolvedValue({})
    await spareTanksService.remove('st1')
    expect(apiClient.delete).toHaveBeenCalledWith('/master/spare-tanks/st1')
  })
})
