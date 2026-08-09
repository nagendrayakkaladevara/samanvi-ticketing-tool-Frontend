import { QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { describe, expect, it, vi } from 'vitest'

import { createTestQueryClient } from '@/test/test-utils'

import { useApplicationUsersQuery } from './use-application-users-query'

vi.mock('@/features/application-users/api/application-users.service', () => ({
  applicationUsersService: {
    list: vi.fn(),
  },
}))

import { applicationUsersService } from '@/features/application-users/api/application-users.service'

function createWrapper() {
  const queryClient = createTestQueryClient()
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  }
}

describe('useApplicationUsersQuery', () => {
  it('fetches application users list', async () => {
    vi.mocked(applicationUsersService.list).mockResolvedValue([
      {
        id: 'u1',
        displayName: 'User',
        mobileNumber: '1',
        username: 'user',
        userType: 'worker',
        isActive: true,
        permissionIds: [],
      },
    ])

    const { result } = renderHook(() => useApplicationUsersQuery(), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(applicationUsersService.list).toHaveBeenCalled()
    expect(result.current.data).toHaveLength(1)
  })
})
