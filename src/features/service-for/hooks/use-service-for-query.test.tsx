import { renderHook, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { serviceForService } from '@/features/service-for/api/service-for.service'
import { createWrapper } from '@/test/test-utils'
import { useServiceForQuery } from './use-service-for-query'

vi.mock('@/features/service-for/api/service-for.service', () => ({
  serviceForService: { list: vi.fn() },
}))

describe('useServiceForQuery', () => {
  it('fetches service for list', async () => {
    const items = [{ id: 'sf1', serviceFor: 'Express' }]
    vi.mocked(serviceForService.list).mockResolvedValue(items as never)

    const { result } = renderHook(() => useServiceForQuery(), { wrapper: createWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(serviceForService.list).toHaveBeenCalled()
    expect(result.current.data).toEqual(items)
  })
})
