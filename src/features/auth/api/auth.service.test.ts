import { beforeEach, describe, expect, it, vi } from 'vitest'

import { ApiError } from '@/lib/api/api-error'
import { apiClient } from '@/lib/api/client'
import { makePermission } from '@/test/fixtures/auth'

import { login } from './auth.service'

vi.mock('@/lib/api/client', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}))

vi.mock('@/features/auth/api/permissions-me.service', () => ({
  fetchMyPermissions: vi.fn(),
}))

import { fetchMyPermissions } from '@/features/auth/api/permissions-me.service'

describe('auth.service login', () => {
  beforeEach(() => {
    vi.mocked(apiClient.get).mockReset()
    vi.mocked(apiClient.post).mockReset()
    vi.mocked(apiClient.patch).mockReset()
    vi.mocked(apiClient.put).mockReset()
    vi.mocked(apiClient.delete).mockReset()
    vi.mocked(fetchMyPermissions).mockReset()
  })

  it('throws ApiError for short username', async () => {
    await expect(login({ username: 'ab', password: 'password1' })).rejects.toThrow(ApiError)
    await expect(login({ username: 'ab', password: 'password1' })).rejects.toThrow(
      'Username must be at least 3 characters',
    )
  })

  it('throws ApiError for short password', async () => {
    await expect(login({ username: 'validuser', password: 'short' })).rejects.toThrow(
      'Password must be at least 8 characters',
    )
  })

  it('throws ApiError when login response has success:false', async () => {
    vi.mocked(apiClient.post).mockResolvedValue({
      data: { success: false, message: 'Invalid credentials' },
    })

    await expect(login({ username: 'validuser', password: 'password12' })).rejects.toThrow('Invalid credentials')
  })

  it('throws ApiError when access token is missing', async () => {
    vi.mocked(apiClient.post).mockResolvedValue({
      data: { user: { id: '1', username: 'validuser' } },
    })

    await expect(login({ username: 'validuser', password: 'password12' })).rejects.toThrow(
      'Login succeeded but access token is missing',
    )
  })

  it('parses session from flat login response with token alias', async () => {
    vi.mocked(apiClient.post).mockResolvedValue({
      data: {
        token: 'access-token',
        user: { id: '1', username: 'validuser', displayName: 'Valid User' },
        permissions: {
          items: [makePermission()],
        },
      },
    })
    vi.mocked(fetchMyPermissions).mockResolvedValue({ items: [makePermission()], tree: [] })

    const session = await login({ username: 'validuser', password: 'password12' })

    expect(session.accessToken).toBe('access-token')
    expect(session.user.name).toBe('Valid User')
    expect(session.permissions?.items).toHaveLength(1)
    expect(apiClient.post).toHaveBeenCalledWith('/auth/login', {
      username: 'validuser',
      password: 'password12',
    })
  })

  it('fetches /auth/me when user is not in login envelope', async () => {
    vi.mocked(apiClient.post).mockResolvedValue({
      data: { accessToken: 'access-token' },
    })
    vi.mocked(apiClient.get).mockResolvedValue({
      data: {
        id: '2',
        username: 'meuser',
        userType: 'worker',
      },
    })
    vi.mocked(fetchMyPermissions).mockResolvedValue({
      items: [makePermission({ module: 'users', action: 'view' })],
      tree: [],
    })

    const session = await login({ username: 'validuser', password: 'password12' })

    expect(apiClient.get).toHaveBeenCalledWith('/auth/me', {
      headers: { Authorization: 'Bearer access-token' },
    })
    expect(session.user.id).toBe('2')
    expect(session.user.role).toBe('WORKER')
  })

  it('normalizes nested data envelope and userId alias', async () => {
    vi.mocked(apiClient.post).mockResolvedValue({
      data: {
        data: {
          jwt: 'nested-jwt',
          user: { userId: 99, fullName: 'Nested User', roleCode: 'supervisor' },
        },
      },
    })
    vi.mocked(fetchMyPermissions).mockResolvedValue({ items: [], tree: [] })

    const session = await login({ username: 'validuser', password: 'password12' })

    expect(session.accessToken).toBe('nested-jwt')
    expect(session.user.id).toBe('99')
    expect(session.user.userType).toBe('supervisor')
  })

  it('fetches permissions when login envelope has none', async () => {
    vi.mocked(apiClient.post).mockResolvedValue({
      data: {
        accessToken: 'token',
        user: { id: '1', username: 'u' },
      },
    })
    vi.mocked(fetchMyPermissions).mockResolvedValue({
      items: [makePermission({ id: 'fetched' })],
      tree: [],
    })

    const session = await login({ username: 'validuser', password: 'password12' })

    expect(fetchMyPermissions).toHaveBeenCalled()
    expect(session.permissions?.items[0]?.id).toBe('fetched')
  })

  it('wraps unknown errors as ApiError', async () => {
    vi.mocked(apiClient.post).mockRejectedValue(new Error('network down'))

    await expect(login({ username: 'validuser', password: 'password12' })).rejects.toThrow(
      'Unable to sign in right now. Please try again.',
    )
  })

  it('throws when login envelope format is invalid', async () => {
    vi.mocked(apiClient.post).mockResolvedValue({ data: null })

    await expect(login({ username: 'validuser', password: 'password12' })).rejects.toThrow(
      'Login response format is invalid',
    )
  })

  it('throws when user payload is malformed', async () => {
    vi.mocked(apiClient.post).mockResolvedValue({
      data: { accessToken: 'token', user: { notAnId: true } },
    })

    await expect(login({ username: 'validuser', password: 'password12' })).rejects.toThrow(
      'Login succeeded but user information is malformed',
    )
  })

  it('parses jwt token and chairman user type from nested envelope', async () => {
    vi.mocked(apiClient.post).mockResolvedValue({
      data: {
        data: {
          jwt: 'jwt-token',
          user: { id: '1', username: 'u', userType: 'chairman' },
          permissions: { items: [makePermission()] },
        },
        refreshToken: 'refresh',
      },
    })
    vi.mocked(fetchMyPermissions).mockResolvedValue({ items: [], tree: [] })

    const session = await login({ username: 'validuser', password: 'password12' })

    expect(session.accessToken).toBe('jwt-token')
    expect(session.refreshToken).toBe('refresh')
    expect(session.user.userType).toBe('chairman')
  })

  it('rethrows ApiError from /auth/me', async () => {
    vi.mocked(apiClient.post).mockResolvedValue({ data: { accessToken: 'token' } })
    vi.mocked(apiClient.get).mockRejectedValue(new ApiError('Forbidden', 403))

    await expect(login({ username: 'validuser', password: 'password12' })).rejects.toThrow('Forbidden')
  })

  it('wraps non-ApiError failures from /auth/me', async () => {
    vi.mocked(apiClient.post).mockResolvedValue({ data: { accessToken: 'token' } })
    vi.mocked(apiClient.get).mockRejectedValue(new Error('timeout'))

    await expect(login({ username: 'validuser', password: 'password12' })).rejects.toThrow(
      'Logged in but failed to load user profile',
    )
  })

  it('uses default failure message when success:false has no message', async () => {
    vi.mocked(apiClient.post).mockResolvedValue({ data: { success: false } })

    await expect(login({ username: 'validuser', password: 'password12' })).rejects.toThrow(
      'Unable to sign in right now. Please try again.',
    )
  })

  it('parses permissions from nested data envelope and object catalog', async () => {
    vi.mocked(apiClient.post).mockResolvedValue({
      data: {
        accessToken: 'token',
        data: {
          permissions: { items: [makePermission({ id: 'nested' })], tree: [] },
          user: { id: '1', username: 'u', name: 'Named User' },
        },
      },
    })
    vi.mocked(fetchMyPermissions).mockResolvedValue({ items: [], tree: [] })

    const session = await login({ username: 'validuser', password: 'password12' })
    expect(session.user.name).toBe('Named User')
    expect(session.permissions?.items[0]?.id).toBe('nested')
  })

  it('parses permissions array from nested data.permissions', async () => {
    vi.mocked(apiClient.post).mockResolvedValue({
      data: {
        accessToken: 'token',
        data: {
          permissions: [makePermission({ id: 'arr-perm' })],
          user: { id: '1', username: 'u' },
        },
      },
    })
    vi.mocked(fetchMyPermissions).mockResolvedValue({ items: [], tree: [] })

    const session = await login({ username: 'validuser', password: 'password12' })
    expect(session.permissions?.items[0]?.id).toBe('arr-perm')
  })

  it('reads access token from nested source token alias', async () => {
    vi.mocked(apiClient.post).mockResolvedValue({
      data: {
        data: {
          token: 'nested-token',
          user: { id: '1', username: 'u', role: 'accountant' },
        },
      },
    })
    vi.mocked(fetchMyPermissions).mockResolvedValue({ items: [], tree: [] })

    const session = await login({ username: 'validuser', password: 'password12' })
    expect(session.accessToken).toBe('nested-token')
    expect(session.user.userType).toBe('accountant')
  })

  it('throws ApiError for username that is too long', async () => {
    await expect(
      login({ username: 'a'.repeat(65), password: 'password12' }),
    ).rejects.toThrow('Username is too long')
  })
})
