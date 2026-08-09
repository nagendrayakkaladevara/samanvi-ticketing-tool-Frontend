import { beforeEach, describe, expect, it, vi } from 'vitest'

import { apiClient } from '@/lib/api/client'
import { serviceForService } from './service-for.service'

vi.mock('@/lib/api/client', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}))

describe('serviceForService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('list', () => {
    it('normalizes service for items from a raw array', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        data: [{ id: 'sf1', serviceFor: 'Express' }],
      })
      const items = await serviceForService.list()
      expect(apiClient.get).toHaveBeenCalledWith('/master/service-for')
      expect(items[0]?.serviceFor).toBe('Express')
    })

    it('extracts nested data arrays and items arrays', async () => {
      vi.mocked(apiClient.get).mockResolvedValueOnce({
        data: { data: [{ id: 2, serviceFor: ' Nested ' }] },
      })
      expect((await serviceForService.list())[0]).toMatchObject({
        id: '2',
        serviceFor: 'Nested',
      })

      vi.mocked(apiClient.get).mockResolvedValueOnce({
        data: { data: { items: [{ _id: 'sf3', serviceFor: 'Items' }] } },
      })
      expect((await serviceForService.list())[0]).toMatchObject({
        id: 'sf3',
        serviceFor: 'Items',
      })

      vi.mocked(apiClient.get).mockResolvedValueOnce({
        data: { items: [{ serviceForId: 'sf4', serviceFor: 'TopItems' }] },
      })
      expect((await serviceForService.list())[0]).toMatchObject({
        id: 'sf4',
        serviceFor: 'TopItems',
      })
    })

    it('filters invalid payloads and handles empty shapes', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        data: {
          data: {
            items: [
              null,
              'bad',
              { id: 'x' },
              { serviceFor: '   ' },
              { id: 'ok', serviceFor: 'Valid', createdAt: '  ', updatedAt: 1 },
            ],
          },
        },
      })
      const items = await serviceForService.list()
      expect(items).toEqual([{ id: 'ok', serviceFor: 'Valid', createdAt: undefined, updatedAt: undefined }])

      vi.mocked(apiClient.get).mockResolvedValueOnce({ data: null })
      expect(await serviceForService.list()).toEqual([])

      vi.mocked(apiClient.get).mockResolvedValueOnce({ data: { data: {} } })
      expect(await serviceForService.list()).toEqual([])
    })
  })

  it('create trims serviceFor value and falls back when normalize fails', async () => {
    vi.mocked(apiClient.post).mockResolvedValue({
      data: { data: { id: 'sf1', serviceFor: 'Express' } },
    })
    await serviceForService.create({ serviceFor: '  Express  ' })
    expect(apiClient.post).toHaveBeenCalledWith('/master/service-for', { serviceFor: 'Express' })

    vi.mocked(apiClient.post).mockResolvedValueOnce({
      data: { data: { id: 'sf2' } },
    })
    const fallback = await serviceForService.create({ serviceFor: 'X' })
    expect(fallback).toEqual({ id: 'sf2' })
  })

  it('update trims serviceFor value and supports non-nested payloads', async () => {
    vi.mocked(apiClient.patch).mockResolvedValue({
      data: { id: 'sf1', serviceFor: 'Updated' },
    })
    const updated = await serviceForService.update({ serviceForId: 'sf1', serviceFor: '  Updated  ' })
    expect(apiClient.patch).toHaveBeenCalledWith('/master/service-for/sf1', { serviceFor: 'Updated' })
    expect(updated.serviceFor).toBe('Updated')

    vi.mocked(apiClient.patch).mockResolvedValueOnce({ data: null })
    expect(await serviceForService.update({ serviceForId: 'sf1', serviceFor: 'Z' })).toBeNull()
  })

  it('remove deletes service for entry', async () => {
    vi.mocked(apiClient.delete).mockResolvedValue({})
    await serviceForService.remove('sf1')
    expect(apiClient.delete).toHaveBeenCalledWith('/master/service-for/sf1')
  })
})
