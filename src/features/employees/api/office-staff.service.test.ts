import { beforeEach, describe, expect, it, vi } from 'vitest'

import { apiClient } from '@/lib/api/client'
import { officeStaffService } from './office-staff.service'

vi.mock('@/lib/api/client', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}))

const minimalStaff = {
  id: 's1',
  staffIdNumber: 'STF-001',
  aadharName: 'Staff',
  nickName: 'Nick',
  designation: 'Clerk',
  mobileNumber: '9876543212',
  aadharNumber: '123456789014',
  referenceName: 'Ref',
}

describe('officeStaffService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('list normalizes office staff', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({ data: [minimalStaff] })
    const staff = await officeStaffService.list()
    expect(apiClient.get).toHaveBeenCalledWith('/master/office-staff', { params: { page: 1, limit: 100 } })
    expect(staff[0]?.designation).toBe('Clerk')
  })

  it('getById throws when unparseable', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({ data: { data: null } })
    await expect(officeStaffService.getById('s1')).rejects.toThrow(
      'Unable to load office staff details.',
    )
  })

  it('create posts staff input', async () => {
    vi.mocked(apiClient.post).mockResolvedValue({ data: { data: minimalStaff } })
    const result = await officeStaffService.create(minimalStaff as never)
    expect(result.staffIdNumber).toBe('STF-001')
  })

  it('update patches staff', async () => {
    vi.mocked(apiClient.patch).mockResolvedValue({ data: { data: minimalStaff } })
    await officeStaffService.update({ staffId: 's1', designation: 'Manager' })
    expect(apiClient.patch).toHaveBeenCalledWith('/master/office-staff/s1', {
      designation: 'Manager',
    })
  })

  it('remove deletes staff member', async () => {
    vi.mocked(apiClient.delete).mockResolvedValue({})
    await officeStaffService.remove('s1')
    expect(apiClient.delete).toHaveBeenCalledWith('/master/office-staff/s1')
  })
})
