import { beforeEach, describe, expect, it, vi } from 'vitest'

import { apiClient } from '@/lib/api/client'
import { profileService } from './profile.service'

vi.mock('@/lib/api/client', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}))

describe('profileService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('normalizes profile from nested data payload', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({
      data: {
        data: {
          id: 'u1',
          username: ' alex ',
          displayName: 'Alex User',
          email: 'alex@example.com',
          isActive: false,
          role: { code: 'admin', label: 'Administrator' },
          createdAt: '2024-01-01',
          updatedAt: '2024-02-01',
        },
      },
    })

    const profile = await profileService.getCurrentProfile()

    expect(apiClient.get).toHaveBeenCalledWith('/profile')
    expect(profile).toEqual({
      id: 'u1',
      username: 'alex',
      displayName: 'Alex User',
      email: 'alex@example.com',
      isActive: false,
      role: { code: 'ADMIN', label: 'Administrator' },
      createdAt: '2024-01-01',
      updatedAt: '2024-02-01',
    })
  })

  it('defaults unknown role to WORKER and missing strings to fallbacks', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({
      data: {
        userId: 'u2',
        roleCode: 'bogus',
        name: '   ',
      },
    })

    const profile = await profileService.getCurrentProfile()

    expect(profile).toMatchObject({
      id: 'u2',
      username: '-',
      displayName: 'User',
      email: null,
      isActive: true,
      role: { code: 'WORKER', label: 'WORKER' },
    })
  })

  it('accepts string role codes at top level', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({ data: { id: 'u3', role: 'supervisor' } })

    const profile = await profileService.getCurrentProfile()
    expect(profile.role.code).toBe('SUPERVISOR')
  })
})
