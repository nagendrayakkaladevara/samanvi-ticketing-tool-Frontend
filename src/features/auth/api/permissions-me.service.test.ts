import { beforeEach, describe, expect, it, vi } from 'vitest'

import { apiClient } from '@/lib/api/client'
import { makePermission } from '@/test/fixtures/auth'

import { fetchMyPermissions } from './permissions-me.service'

vi.mock('@/lib/api/client', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}))

describe('permissions-me.service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('calls GET /permissions/me and normalizes catalog', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({
      data: {
        items: [
          {
            id: 'p1',
            module: 'tickets',
            action: 'view',
          },
        ],
      },
    })

    const result = await fetchMyPermissions()

    expect(apiClient.get).toHaveBeenCalledWith('/permissions/me')
    expect(result.items).toHaveLength(1)
    expect(result.items[0]).toMatchObject({
      id: 'p1',
      module: 'tickets',
      submodule: '',
      action: 'view',
    })
    expect(result.tree.length).toBeGreaterThan(0)
  })

  it('handles nested data payload', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({
      data: {
        data: {
          permissions: [makePermission({ id: 'nested' })],
        },
      },
    })

    const result = await fetchMyPermissions()

    expect(result.items[0]?.id).toBe('nested')
  })

  it('returns empty catalog for garbage payload', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({ data: null })

    const result = await fetchMyPermissions()

    expect(result.items).toEqual([])
    expect(result.tree).toEqual([])
  })
})
