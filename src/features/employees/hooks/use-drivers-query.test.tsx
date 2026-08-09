import { renderHook, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { driversService } from '@/features/employees/api/drivers.service'
import { createWrapper } from '@/test/test-utils'
import { useDriverDetailQuery, useDriversQuery } from './use-drivers-query'

vi.mock('@/features/employees/api/drivers.service', () => ({
  driversService: { list: vi.fn(), getById: vi.fn() },
}))

describe('useDriversQuery', () => {
  it('fetches drivers list', async () => {
    const drivers = [{ id: 'd1', driverIdNumber: 'DRV-1' }]
    vi.mocked(driversService.list).mockResolvedValue(drivers as never)

    const { result } = renderHook(() => useDriversQuery(), { wrapper: createWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual(drivers)
  })
})

describe('useDriverDetailQuery', () => {
  it('is disabled without driverId or enabled flag', () => {
    const { result } = renderHook(() => useDriverDetailQuery(null, true), { wrapper: createWrapper() })
    expect(result.current.fetchStatus).toBe('idle')
  })

  it('fetches driver when enabled with id', async () => {
    const driver = { id: 'd1', driverIdNumber: 'DRV-1' }
    vi.mocked(driversService.getById).mockResolvedValue(driver as never)

    const { result } = renderHook(() => useDriverDetailQuery('d1', true), { wrapper: createWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(driversService.getById).toHaveBeenCalledWith('d1')
  })
})
