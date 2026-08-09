import { beforeEach, describe, expect, it, vi } from 'vitest'

import { apiClient } from '@/lib/api/client'
import { usersService } from './users.service'

vi.mock('@/lib/api/client', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}))

describe('usersService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('list', () => {
    it('normalizes users from nested data.users payload', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        data: {
          data: {
            users: [
              {
                userId: 'u1',
                username: ' alex ',
                fullName: 'Alex User',
                role: { code: 'admin' },
                isActive: false,
              },
              { id: 'u2', roleCode: 'bogus' },
            ],
          },
        },
      })

      const users = await usersService.list()

      expect(apiClient.get).toHaveBeenCalledWith('/users')
      expect(users).toEqual([
        {
          id: 'u1',
          username: 'alex',
          displayName: 'Alex User',
          email: undefined,
          role: 'ADMIN',
          isActive: false,
        },
        {
          id: 'u2',
          username: 'u2',
          displayName: 'u2',
          email: undefined,
          role: 'WORKER',
          isActive: true,
        },
      ])
    })

    it('filters invalid users without id', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({ data: [{ username: 'orphan' }] })
      expect(await usersService.list()).toEqual([])
    })
  })

  describe('create', () => {
    it('posts input and normalizes response', async () => {
      const input = {
        username: 'new',
        displayName: 'New User',
        password: 'secret',
        role: 'WORKER' as const,
      }
      vi.mocked(apiClient.post).mockResolvedValue({
        data: { data: { id: 'u-new', ...input } },
      })

      const user = await usersService.create(input)

      expect(apiClient.post).toHaveBeenCalledWith('/users', input)
      expect(user.id).toBe('u-new')
    })
  })

  describe('update', () => {
    it('patches user by id', async () => {
      vi.mocked(apiClient.patch).mockResolvedValue({
        data: { user: { id: 'u1', username: 'alex', displayName: 'Alex', role: 'SUPERVISOR' } },
      })

      const user = await usersService.update({ userId: 'u1', displayName: 'Alex Updated' })

      expect(apiClient.patch).toHaveBeenCalledWith('/users/u1', { displayName: 'Alex Updated' })
      expect(user.role).toBe('SUPERVISOR')
    })
  })

  describe('remove', () => {
    it('deletes user by id', async () => {
      vi.mocked(apiClient.delete).mockResolvedValue({ data: undefined })

      await usersService.remove('u1')

      expect(apiClient.delete).toHaveBeenCalledWith('/users/u1')
    })
  })

  describe('payload extraction and role normalization', () => {
    it.each([
      [{ data: [{ id: 'u1', username: 'a' }] }],
      [{ data: { users: [{ id: 'u2', username: 'b' }] } }],
      [{ data: { items: [{ id: 'u3', username: 'c' }] } }],
      [{ users: [{ id: 'u4', username: 'd' }] }],
      [{ items: [{ id: 'u5', username: 'e' }] }],
    ] as const)('list from %#', async (payload) => {
      vi.mocked(apiClient.get).mockResolvedValue({ data: payload })
      expect((await usersService.list())[0]?.id).toMatch(/^u/)
    })

    it('normalizes nested role label and supervisor role', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        data: [
          { _id: 'u6', role: { label: 'supervisor' }, name: 'Sam', email: '  sam@test.com  ' },
        ],
      })
      const [user] = await usersService.list()
      expect(user).toMatchObject({
        id: 'u6',
        displayName: 'Sam',
        email: 'sam@test.com',
        role: 'SUPERVISOR',
      })
    })

    it('create falls back when normalize fails', async () => {
      vi.mocked(apiClient.post).mockResolvedValue({ data: { data: { username: 'only-name' } } })
      expect(
        await usersService.create({
          username: 'x',
          displayName: 'X',
          password: 'p',
          role: 'WORKER',
        }),
      ).toEqual({ username: 'only-name' })
    })

    it('update extracts nested user from data payload', async () => {
      vi.mocked(apiClient.patch).mockResolvedValue({
        data: { data: { user: { id: 'u7', username: 'z', displayName: 'Z', role: 'ADMIN' } } },
      })
      const user = await usersService.update({ userId: 'u7', displayName: 'Z2' })
      expect(user.role).toBe('ADMIN')
    })

    it('normalizes role from nested name and list from raw array', async () => {
      vi.mocked(apiClient.get).mockResolvedValueOnce({
        data: [{ id: 'u8', username: 'raw', role: { name: 'admin' } }],
      })
      expect((await usersService.list())[0]?.role).toBe('ADMIN')

      vi.mocked(apiClient.get).mockResolvedValueOnce({
        data: [{ id: 'u9', username: 'worker', role: { label: 'not-valid' } }],
      })
      expect((await usersService.list())[0]?.role).toBe('WORKER')
    })

    it('returns empty list for invalid payloads', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({ data: null })
      expect(await usersService.list()).toEqual([])
    })

    it('create handles non-object entity payloads', async () => {
      vi.mocked(apiClient.post).mockResolvedValue({ data: null })
      expect(
        await usersService.create({
          username: 'x',
          displayName: 'X',
          password: 'p',
          role: 'WORKER',
        }),
      ).toBeNull()
    })
  })
})
