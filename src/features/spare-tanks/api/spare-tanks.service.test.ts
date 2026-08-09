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

  it('list extracts nested payloads and filters invalid rows', async () => {
    vi.mocked(apiClient.get).mockResolvedValueOnce({ data: { data: [minimalTank] } })
    expect((await spareTanksService.list())[0]?.ownerName).toBe('Owner')

    vi.mocked(apiClient.get).mockResolvedValueOnce({ data: { data: { items: [minimalTank] } } })
    expect((await spareTanksService.list())[0]?.id).toBe('st1')

    vi.mocked(apiClient.get).mockResolvedValueOnce({ data: { items: [minimalTank] } })
    expect((await spareTanksService.list())[0]?.busNumber).toBe('BUS-01')

    vi.mocked(apiClient.get).mockResolvedValueOnce({ data: [null, { id: '' }] })
    expect(await spareTanksService.list()).toEqual([])

    vi.mocked(apiClient.get).mockResolvedValueOnce({ data: null })
    expect(await spareTanksService.list()).toEqual([])
  })

  it('normalizes numeric and alternate id keys', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({
      data: [{ spareTankId: 7, busNumber: 'B-7', ownerName: 'O' }],
    })
    const [tank] = await spareTanksService.list()
    expect(tank?.id).toBe('7')
  })

  it('create and update fall back when normalize fails', async () => {
    vi.mocked(apiClient.post).mockResolvedValue({ data: { data: { id: 'raw' } } })
    expect(await spareTanksService.create({ busNumber: 'B', ownerName: 'O' })).toEqual({ id: 'raw' })

    vi.mocked(apiClient.patch).mockResolvedValue({ data: { id: 'raw-2' } })
    expect(await spareTanksService.update({ spareTankId: 'st1', busNumber: 'B-2' })).toEqual({ id: 'raw-2' })
  })

  it('update trims both fields when provided', async () => {
    vi.mocked(apiClient.patch).mockResolvedValue({ data: { data: minimalTank } })
    await spareTanksService.update({
      spareTankId: 'st1',
      busNumber: '  BUS-02  ',
      ownerName: '  Owner 2  ',
    })
    expect(apiClient.patch).toHaveBeenCalledWith('/master/spare-tanks/st1', {
      busNumber: 'BUS-02',
      ownerName: 'Owner 2',
    })
  })

  it('returns empty list for unrecognized payload shapes and null entities', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({ data: { unknown: true } })
    expect(await spareTanksService.list()).toEqual([])

    vi.mocked(apiClient.post).mockResolvedValue({ data: null })
    expect(await spareTanksService.create({ busNumber: 'B', ownerName: 'O' })).toBeNull()
  })
})
