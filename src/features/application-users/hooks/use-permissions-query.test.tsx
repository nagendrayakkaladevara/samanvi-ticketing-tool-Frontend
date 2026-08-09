import { QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { describe, expect, it, vi } from 'vitest'

import { createTestQueryClient } from '@/test/render-with-providers'

import { usePermissionsQuery } from './use-permissions-query'

vi.mock('@/features/application-users/api/permissions.service', () => ({
  permissionsService: {
    list: vi.fn(),
  },
}))

import { permissionsService } from '@/features/application-users/api/permissions.service'

function createWrapper() {
  const queryClient = createTestQueryClient()
  return {
    queryClient,
    wrapper: function Wrapper({ children }: { children: ReactNode }) {
      return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    },
  }
}

describe('usePermissionsQuery', () => {
  it('uses permissions query key and fetches catalog', async () => {
    vi.mocked(permissionsService.list).mockResolvedValue({ items: [], tree: [] })
    const { wrapper } = createWrapper()

    const { result } = renderHook(() => usePermissionsQuery(), { wrapper })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(permissionsService.list).toHaveBeenCalled()
    expect(result.current.data).toEqual({ items: [], tree: [] })
  })
})
