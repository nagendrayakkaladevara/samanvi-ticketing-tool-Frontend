import { renderHook, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { officeStaffService } from '@/features/employees/api/office-staff.service'
import { createWrapper } from '@/test/test-utils'
import { useOfficeStaffDetailQuery, useOfficeStaffQuery } from './use-office-staff-query'

vi.mock('@/features/employees/api/office-staff.service', () => ({
  officeStaffService: { list: vi.fn(), getById: vi.fn() },
}))

describe('useOfficeStaffQuery', () => {
  it('fetches office staff list', async () => {
    const staff = [{ id: 's1', staffIdNumber: 'STF-1' }]
    vi.mocked(officeStaffService.list).mockResolvedValue(staff as never)

    const { result } = renderHook(() => useOfficeStaffQuery(), { wrapper: createWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual(staff)
  })
})

describe('useOfficeStaffDetailQuery', () => {
  it('is disabled without staffId', () => {
    const { result } = renderHook(() => useOfficeStaffDetailQuery(null, true), { wrapper: createWrapper() })
    expect(result.current.fetchStatus).toBe('idle')
  })

  it('fetches staff when enabled', async () => {
    vi.mocked(officeStaffService.getById).mockResolvedValue({ id: 's1' } as never)
    const { result } = renderHook(() => useOfficeStaffDetailQuery('s1', true), { wrapper: createWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
  })
})
