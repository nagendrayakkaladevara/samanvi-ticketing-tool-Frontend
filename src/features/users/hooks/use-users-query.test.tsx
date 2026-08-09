import { renderHook, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { usersService } from '@/features/users/api/users.service'
import { createWrapper } from '@/test/test-utils'
import { useUsersQuery } from './use-users-query'

vi.mock('@/features/users/api/users.service', () => ({
  usersService: { list: vi.fn() },
}))

describe('useUsersQuery', () => {
  it('fetches users list', async () => {
    const users = [{ id: 'u1', username: 'alex', displayName: 'Alex', role: 'WORKER' as const, isActive: true }]
    vi.mocked(usersService.list).mockResolvedValue(users)

    const { result } = renderHook(() => useUsersQuery(), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual(users)
  })
})
