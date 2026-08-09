import { beforeEach, describe, expect, it, vi } from 'vitest'

import { apiClient } from '@/lib/api/client'
import { helpersService } from './helpers.service'

vi.mock('@/lib/api/client', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}))

const minimalHelper = {
  id: 'h1',
  helperIdNumber: 'HLP-001',
  aadharName: 'Helper',
  nickName: 'Nick',
  mobileNumber: '9876543211',
  aadharNumber: '123456789013',
  reference: 'Ref',
}

describe('helpersService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('list normalizes helpers', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({ data: [minimalHelper] })
    const helpers = await helpersService.list()
    expect(apiClient.get).toHaveBeenCalledWith('/master/helpers', { params: { page: 1, limit: 100 } })
    expect(helpers[0]?.nickName).toBe('Nick')
  })

  it('getById throws when unparseable', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({ data: { data: null } })
    await expect(helpersService.getById('h1')).rejects.toThrow('Unable to load helper details.')
  })

  it('create posts helper input', async () => {
    vi.mocked(apiClient.post).mockResolvedValue({ data: { data: minimalHelper } })
    const helper = await helpersService.create(minimalHelper as never)
    expect(helper.helperIdNumber).toBe('HLP-001')
  })

  it('update patches helper', async () => {
    vi.mocked(apiClient.patch).mockResolvedValue({ data: { data: minimalHelper } })
    await helpersService.update({ helperId: 'h1', nickName: 'New' })
    expect(apiClient.patch).toHaveBeenCalledWith('/master/helpers/h1', { nickName: 'New' })
  })

  it('remove deletes helper', async () => {
    vi.mocked(apiClient.delete).mockResolvedValue({})
    await helpersService.remove('h1')
    expect(apiClient.delete).toHaveBeenCalledWith('/master/helpers/h1')
  })
})
