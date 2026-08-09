import { renderHook, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { serviceNumbersService } from '@/features/service-numbers/api/service-numbers.service'
import { createWrapper } from '@/test/test-utils'
import { useServiceNumbersQuery } from './use-service-numbers-query'

vi.mock('@/features/service-numbers/api/service-numbers.service', () => ({
  serviceNumbersService: { list: vi.fn() },
}))

describe('useServiceNumbersQuery', () => {
  it('fetches service numbers', async () => {
    const items = [{ id: 'sn1', serviceNo: '101' }]
    vi.mocked(serviceNumbersService.list).mockResolvedValue(items as never)

    const { result } = renderHook(() => useServiceNumbersQuery(), { wrapper: createWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(serviceNumbersService.list).toHaveBeenCalledWith({ page: 1, limit: 50 })
    expect(result.current.data).toEqual(items)
  })
})
