import { renderHook, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { busesService } from '@/features/buses/api/buses.service'
import { createWrapper } from '@/test/test-utils'
import { useBusesQuery } from './use-buses-query'

vi.mock('@/features/buses/api/buses.service', () => ({
  busesService: { list: vi.fn() },
}))

describe('useBusesQuery', () => {
  it('fetches buses with the expected query key', async () => {
    const buses = [{ id: '1', busNumber: 'B-1' }]
    vi.mocked(busesService.list).mockResolvedValue(buses)

    const { result } = renderHook(() => useBusesQuery(), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual(buses)
  })
})
