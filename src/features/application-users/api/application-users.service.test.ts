import { beforeEach, describe, expect, it, vi } from 'vitest'

import { apiClient } from '@/lib/api/client'

import { applicationUsersService } from './application-users.service'

vi.mock('@/lib/api/client', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}))

describe('applicationUsersService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  const sampleUser = {
    id: 'u1',
    displayName: 'Test User',
    mobileNumber: '9999999999',
    username: 'testuser',
    userType: 'worker',
    isActive: true,
    permissionIds: ['p1'],
  }

  it('list normalizes array and nested payloads', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({
      data: {
        data: {
          users: [
            { id: 'u1', username: 'testuser', name: 'Test User', mobile: '9999999999', permissions: ['p1'] },
          ],
        },
      },
    })

    const users = await applicationUsersService.list()

    expect(apiClient.get).toHaveBeenCalledWith('/application-users')
    expect(users).toHaveLength(1)
    expect(users[0]).toMatchObject({
      id: 'u1',
      username: 'testuser',
      displayName: 'Test User',
      mobileNumber: '9999999999',
      permissionIds: ['p1'],
      userType: 'worker',
    })
  })

  it('getById throws when user cannot be normalized', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({ data: { data: { user: { username: 'no-id' } } } })

    await expect(applicationUsersService.getById('missing')).rejects.toThrow('Application user not found.')
  })

  it('getById returns normalized user', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({
      data: { data: { user: { userId: 'u2', username: 'u2', fullName: 'User Two', roleCode: 'supervisor' } } },
    })

    const user = await applicationUsersService.getById('u2')

    expect(user.id).toBe('u2')
    expect(user.userType).toBe('supervisor')
  })

  it('checkUsernameExists trims username param and normalizes response', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({
      data: { username: ' taken ', exists: true },
    })

    const result = await applicationUsersService.checkUsernameExists('  taken  ')

    expect(apiClient.get).toHaveBeenCalledWith('/application-users/username-exists', {
      params: { username: 'taken' },
    })
    expect(result).toEqual({ username: 'taken', exists: true })
  })

  it('checkUsernameExists throws on malformed response', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({ data: { exists: true } })

    await expect(applicationUsersService.checkUsernameExists('x')).rejects.toThrow(
      'Unable to verify username availability.',
    )
  })

  it('create posts input and returns user', async () => {
    vi.mocked(apiClient.post).mockResolvedValue({ data: { data: { user: sampleUser } } })

    const created = await applicationUsersService.create({
      username: 'testuser',
      fullName: 'Test User',
      password: 'password12',
      mobileNumber: '9999999999',
      userType: 'worker',
    })

    expect(apiClient.post).toHaveBeenCalledWith('/application-users', expect.objectContaining({ username: 'testuser' }))
    expect(created.id).toBe('u1')
  })

  it('update patches user by id', async () => {
    vi.mocked(apiClient.patch).mockResolvedValue({ data: { data: { user: { ...sampleUser, displayName: 'Updated' } } } })

    const updated = await applicationUsersService.update({
      userId: 'u1',
      fullName: 'Updated',
    })

    expect(apiClient.patch).toHaveBeenCalledWith('/application-users/u1', { fullName: 'Updated' })
    expect(updated.displayName).toBe('Updated')
  })

  it('remove deletes user', async () => {
    vi.mocked(apiClient.delete).mockResolvedValue({})

    await applicationUsersService.remove('u1')

    expect(apiClient.delete).toHaveBeenCalledWith('/application-users/u1')
  })

  it('assignPermissions puts permission ids', async () => {
    vi.mocked(apiClient.put).mockResolvedValue({})

    await applicationUsersService.assignPermissions('u1', ['p1', 'p2'])

    expect(apiClient.put).toHaveBeenCalledWith('/application-users/u1/permissions', {
      permissionIds: ['p1', 'p2'],
    })
  })

  it('normalizes nested userType object and defaults unknown to worker', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({
      data: [{ id: 'u3', username: 'u3', userType: { code: 'collection_agent' } }],
    })

    const [user] = await applicationUsersService.list()
    expect(user?.userType).toBe('collection_agent')

    vi.mocked(apiClient.get).mockResolvedValue({
      data: [{ id: 'u4', username: 'u4', role: 'unknown_role' }],
    })

    const [unknown] = await applicationUsersService.list()
    expect(unknown?.userType).toBe('worker')
  })

  it('extracts users from alternate list payloads', async () => {
    vi.mocked(apiClient.get).mockResolvedValueOnce({
      data: { data: [{ id: 'u5', username: 'u5' }] },
    })
    expect((await applicationUsersService.list())[0]?.id).toBe('u5')

    vi.mocked(apiClient.get).mockResolvedValueOnce({
      data: { items: [{ id: 'u6', username: 'u6' }] },
    })
    expect((await applicationUsersService.list())[0]?.id).toBe('u6')

    vi.mocked(apiClient.get).mockResolvedValueOnce({
      data: { users: [{ id: 'u7', username: 'u7' }] },
    })
    expect((await applicationUsersService.list())[0]?.id).toBe('u7')
  })

  it('normalizes permission ids from permission objects', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({
      data: [{ id: 'u8', username: 'u8', permissions: [{ permissionId: 'p1' }, { id: 2 }] }],
    })
    const [user] = await applicationUsersService.list()
    expect(user?.permissionIds).toEqual(['p1', '2'])
  })

  it('normalizes user type labels with spaces', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({
      data: [{ id: 'u9', username: 'u9', userType: { label: 'Collection Agent' } }],
    })
    expect((await applicationUsersService.list())[0]?.userType).toBe('collection_agent')
  })

  it('checkUsernameExists throws when response is invalid', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({ data: { username: 'x' } })
    await expect(applicationUsersService.checkUsernameExists('x')).rejects.toThrow(
      'Unable to verify username availability.',
    )
  })

  it('create falls back when normalize fails', async () => {
    vi.mocked(apiClient.post).mockResolvedValue({ data: { data: { displayName: 'Only Name' } } })
    expect(
      await applicationUsersService.create({
        username: 'new',
        password: 'password12',
        mobileNumber: '9999999999',
        userType: 'worker',
        permissionIds: [],
      }),
    ).toEqual({ displayName: 'Only Name' })
  })

  it('normalizes displayName from mobile and numeric id', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({
      data: [{ _id: 12, mobile: '8888888888', userType: 'accountant', isActive: false }],
    })
    const [user] = await applicationUsersService.list()
    expect(user).toMatchObject({
      id: '12',
      displayName: '8888888888',
      mobileNumber: '8888888888',
      userType: 'accountant',
      isActive: false,
    })
  })

  it('normalizes userType from nested role name', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({
      data: [{ id: 'u10', username: 'u10', role: { name: 'chairman' } }],
    })
    expect((await applicationUsersService.list())[0]?.userType).toBe('chairman')
  })

  it('prefers permissionIds over permissions array when both present', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({
      data: [{ id: 'u11', username: 'u11', permissionIds: ['p1'], permissions: ['p2'] }],
    })
    expect((await applicationUsersService.list())[0]?.permissionIds).toEqual(['p1'])
  })

  it('normalizes admin user type and email from alternate keys', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({
      data: [{ id: 'u12', username: 'admin1', userType: 'admin', email: '  admin@test.com  ' }],
    })
    const [user] = await applicationUsersService.list()
    expect(user?.userType).toBe('admin')
    expect(user?.email).toBe('admin@test.com')
  })

  it('checkUsernameExists normalizes nested data payload', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({
      data: { data: { user: { username: 'nested', exists: false } } },
    })
    expect(await applicationUsersService.checkUsernameExists('nested')).toEqual({
      username: 'nested',
      exists: false,
    })
  })

  it('list returns empty array for invalid payloads and update falls back', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({ data: null })
    expect(await applicationUsersService.list()).toEqual([])

    vi.mocked(apiClient.patch).mockResolvedValue({ data: { data: { displayName: 'Only' } } })
    expect(await applicationUsersService.update({ userId: 'u1', fullName: 'X' })).toEqual({
      displayName: 'Only',
    })
  })

  it('normalizes displayName fallback to username then id', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({
      data: [{ id: 'u13', username: 'fallback-name' }],
    })
    expect((await applicationUsersService.list())[0]?.displayName).toBe('fallback-name')
  })
})
