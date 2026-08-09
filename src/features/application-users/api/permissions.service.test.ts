import { beforeEach, describe, expect, it, vi } from 'vitest'

import { apiClient } from '@/lib/api/client'
import { makePermission } from '@/test/fixtures/auth'

import { permissionsService } from './permissions.service'

vi.mock('@/lib/api/client', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}))

describe('permissionsService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('list fetches /permissions and normalizes catalog', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({
      data: {
        items: [makePermission({ id: 'catalog-1', module: 'users', action: 'view' })],
      },
    })

    const catalog = await permissionsService.list()

    expect(apiClient.get).toHaveBeenCalledWith('/permissions')
    expect(catalog.items[0]?.id).toBe('catalog-1')
    expect(catalog.tree.length).toBeGreaterThan(0)
  })
})
