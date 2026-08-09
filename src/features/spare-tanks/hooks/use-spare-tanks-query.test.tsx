import { renderHook, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { spareTanksService } from '@/features/spare-tanks/api/spare-tanks.service'
import { createWrapper } from '@/test/test-utils'
import { useSpareTanksQuery } from './use-spare-tanks-query'

vi.mock('@/features/spare-tanks/api/spare-tanks.service', () => ({
  spareTanksService: { list: vi.fn() },
}))

describe('useSpareTanksQuery', () => {
  it('fetches spare tanks', async () => {
    const tanks = [{ id: 'st1', busNumber: 'BUS-1' }]
    vi.mocked(spareTanksService.list).mockResolvedValue(tanks as never)

    const { result } = renderHook(() => useSpareTanksQuery(), { wrapper: createWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(spareTanksService.list).toHaveBeenCalledWith({ page: 1, limit: 100 })
    expect(result.current.data).toEqual(tanks)
  })
})
