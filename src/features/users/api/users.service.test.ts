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
})
