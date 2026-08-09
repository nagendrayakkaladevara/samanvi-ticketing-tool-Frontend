import { QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { describe, expect, it, vi } from 'vitest'

import { createTestQueryClient } from '@/test/test-utils'

import { useApplicationUserQuery } from './use-application-user-query'

vi.mock('@/features/application-users/api/application-users.service', () => ({
  applicationUsersService: {
    getById: vi.fn(),
  },
}))

import { applicationUsersService } from '@/features/application-users/api/application-users.service'

function createWrapper() {
  const queryClient = createTestQueryClient()
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  }
}

describe('useApplicationUserQuery', () => {
  it('does not fetch when userId is undefined', () => {
    const { result } = renderHook(() => useApplicationUserQuery(undefined), { wrapper: createWrapper() })

    expect(result.current.fetchStatus).toBe('idle')
    expect(applicationUsersService.getById).not.toHaveBeenCalled()
  })

  it('fetches user by id when enabled', async () => {
    vi.mocked(applicationUsersService.getById).mockResolvedValue({
      id: 'u1',
      displayName: 'User',
      mobileNumber: '1',
      username: 'user',
      userType: 'worker',
      isActive: true,
      permissionIds: [],
    })

    const { result } = renderHook(() => useApplicationUserQuery('u1'), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(applicationUsersService.getById).toHaveBeenCalledWith('u1')
    expect(result.current.data?.id).toBe('u1')
  })
})
