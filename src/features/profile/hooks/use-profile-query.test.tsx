import { renderHook, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { profileService } from '@/features/profile/api/profile.service'
import { createWrapper } from '@/test/test-utils'
import { useProfileQuery } from './use-profile-query'

vi.mock('@/features/profile/api/profile.service', () => ({
  profileService: { getCurrentProfile: vi.fn() },
}))

describe('useProfileQuery', () => {
  it('fetches current profile', async () => {
    const profile = {
      id: 'u1',
      username: 'alex',
      displayName: 'Alex',
      email: null,
      isActive: true,
      role: { code: 'WORKER' as const, label: 'Worker' },
      createdAt: '',
      updatedAt: '',
    }
    vi.mocked(profileService.getCurrentProfile).mockResolvedValue(profile)

    const { result } = renderHook(() => useProfileQuery(), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual(profile)
  })
})
