import { QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { describe, expect, it, vi } from 'vitest'

import { useAuthStore } from '@/store/auth-store'
import { makeAuthSession, makePermission } from '@/test/fixtures/auth'
import { createTestQueryClient } from '@/test/render-with-providers'

import { usePermissionsMeQuery } from './use-permissions-me-query'

vi.mock('@/features/auth/api/permissions-me.service', () => ({
  fetchMyPermissions: vi.fn(),
}))

import { fetchMyPermissions } from '@/features/auth/api/permissions-me.service'

function createWrapper(queryClient = createTestQueryClient()) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  }
}

describe('usePermissionsMeQuery', () => {
  it('does not fetch when unauthenticated', () => {
    const { result } = renderHook(() => usePermissionsMeQuery(), {
      wrapper: createWrapper(),
    })

    expect(result.current.fetchStatus).toBe('idle')
    expect(fetchMyPermissions).not.toHaveBeenCalled()
  })

  it('fetches permissions and updates auth store when authenticated', async () => {
    const catalog = {
      items: [makePermission({ id: 'hook-perm' })],
      tree: [],
    }
    vi.mocked(fetchMyPermissions).mockResolvedValue(catalog)

    useAuthStore.getState().setSession(makeAuthSession(), true)

    const { result } = renderHook(() => usePermissionsMeQuery(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(fetchMyPermissions).toHaveBeenCalled()
    expect(useAuthStore.getState().permissions?.items[0]?.id).toBe('hook-perm')
  })

  it('does not update store when fetched catalog has no items', async () => {
    vi.mocked(fetchMyPermissions).mockResolvedValue({ items: [], tree: [] })
    useAuthStore.getState().setSession(makeAuthSession({ permissions: { items: [], tree: [] } }), true)

    const { result } = renderHook(() => usePermissionsMeQuery(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(useAuthStore.getState().permissions?.items).toEqual([])
  })
})
