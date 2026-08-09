import { renderHook, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { masterBusesService } from '@/features/master-buses/api/master-buses.service'
import { createWrapper } from '@/test/test-utils'
import { useMasterBusNumbersQuery, useMasterBusesQuery } from './use-master-buses-query'

vi.mock('@/features/master-buses/api/master-buses.service', () => ({
  masterBusesService: { list: vi.fn(), listBusNumbers: vi.fn() },
}))

describe('useMasterBusesQuery', () => {
  it('fetches master buses', async () => {
    const buses = [{ id: 'b1', busNumber: 'BUS-1' }]
    vi.mocked(masterBusesService.list).mockResolvedValue(buses as never)

    const { result } = renderHook(() => useMasterBusesQuery(), { wrapper: createWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(masterBusesService.list).toHaveBeenCalledWith({ page: 1, limit: 50 })
  })
})

describe('useMasterBusNumbersQuery', () => {
  it('is disabled when enabled is false', () => {
    const { result } = renderHook(() => useMasterBusNumbersQuery(false), { wrapper: createWrapper() })
    expect(result.current.fetchStatus).toBe('idle')
  })

  it('fetches bus numbers when enabled', async () => {
    vi.mocked(masterBusesService.listBusNumbers).mockResolvedValue(['1', '2'])
    const { result } = renderHook(() => useMasterBusNumbersQuery(true), { wrapper: createWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual(['1', '2'])
  })
})
