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

  it('list normalizes service for items', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({
      data: [{ id: 'sf1', serviceFor: 'Express' }],
    })
    const items = await serviceForService.list()
    expect(apiClient.get).toHaveBeenCalledWith('/master/service-for')
    expect(items[0]?.serviceFor).toBe('Express')
  })

  it('create trims serviceFor value', async () => {
    vi.mocked(apiClient.post).mockResolvedValue({
      data: { data: { id: 'sf1', serviceFor: 'Express' } },
    })
    await serviceForService.create({ serviceFor: '  Express  ' })
    expect(apiClient.post).toHaveBeenCalledWith('/master/service-for', { serviceFor: 'Express' })
  })

  it('update trims serviceFor value', async () => {
    vi.mocked(apiClient.patch).mockResolvedValue({
      data: { data: { id: 'sf1', serviceFor: 'Updated' } },
    })
    await serviceForService.update({ serviceForId: 'sf1', serviceFor: '  Updated  ' })
    expect(apiClient.patch).toHaveBeenCalledWith('/master/service-for/sf1', { serviceFor: 'Updated' })
  })

  it('remove deletes service for entry', async () => {
    vi.mocked(apiClient.delete).mockResolvedValue({})
    await serviceForService.remove('sf1')
    expect(apiClient.delete).toHaveBeenCalledWith('/master/service-for/sf1')
  })
})
