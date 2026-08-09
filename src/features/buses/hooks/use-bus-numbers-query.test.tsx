import { renderHook, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { busesService } from '@/features/buses/api/buses.service'
import { createWrapper } from '@/test/test-utils'
import { useBusNumbersQuery } from './use-bus-numbers-query'

vi.mock('@/features/buses/api/buses.service', () => ({
  busesService: { listBusNumbers: vi.fn() },
}))

describe('useBusNumbersQuery', () => {
  it('fetches bus numbers when enabled', async () => {
    vi.mocked(busesService.listBusNumbers).mockResolvedValue(['1', '2'])

    const { result } = renderHook(() => useBusNumbersQuery(true), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual(['1', '2'])
  })

  it('does not fetch when disabled', () => {
    const { result } = renderHook(() => useBusNumbersQuery(false), { wrapper: createWrapper() })

    expect(result.current.fetchStatus).toBe('idle')
    expect(busesService.listBusNumbers).not.toHaveBeenCalled()
  })
})
