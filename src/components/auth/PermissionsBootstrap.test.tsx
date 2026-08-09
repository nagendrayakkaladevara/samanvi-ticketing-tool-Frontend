import { QueryClientProvider } from '@tanstack/react-query'
import { render, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { makeAuthSession, makePermission } from '@/test/fixtures/auth'
import { createTestQueryClient } from '@/test/test-utils'
import { useAuthStore } from '@/store/auth-store'

import { PermissionsBootstrap } from './PermissionsBootstrap'

vi.mock('@/features/auth/api/permissions-me.service', () => ({
  fetchMyPermissions: vi.fn(),
}))

import { fetchMyPermissions } from '@/features/auth/api/permissions-me.service'

describe('PermissionsBootstrap', () => {
  it('renders nothing', () => {
    const { container } = render(
      <QueryClientProvider client={createTestQueryClient()}>
        <PermissionsBootstrap />
      </QueryClientProvider>,
    )

    expect(container).toBeEmptyDOMElement()
  })

  it('fetches permissions when authenticated session has no items', async () => {
    const catalog = {
      items: [makePermission({ id: 'boot-perm' })],
      tree: [],
    }
    vi.mocked(fetchMyPermissions).mockResolvedValue(catalog)

    useAuthStore.getState().setSession(makeAuthSession({ permissions: { items: [], tree: [] } }), true)

    render(
      <QueryClientProvider client={createTestQueryClient()}>
        <PermissionsBootstrap />
      </QueryClientProvider>,
    )

    await waitFor(() => expect(fetchMyPermissions).toHaveBeenCalled())
    await waitFor(() => expect(useAuthStore.getState().permissions?.items[0]?.id).toBe('boot-perm'))
  })

  it('does not fetch when permissions already loaded', async () => {
    useAuthStore.getState().setSession(
      makeAuthSession({
        permissions: { items: [makePermission({ id: 'existing' })], tree: [] },
      }),
      true,
    )

    render(
      <QueryClientProvider client={createTestQueryClient()}>
        <PermissionsBootstrap />
      </QueryClientProvider>,
    )

    await waitFor(() => expect(fetchMyPermissions).not.toHaveBeenCalled())
  })
})
