import { renderHook, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { garageService } from '@/features/garage/api/garage.service'
import { createWrapper } from '@/test/test-utils'
import { useRepairPartsQuery } from './use-repair-parts-query'

vi.mock('@/features/garage/api/garage.service', () => ({
  garageService: { listRepairParts: vi.fn() },
  collectLeafRepairCategories: vi.fn(),
}))

describe('useRepairPartsQuery', () => {
  it('fetches repair parts with expected query key', async () => {
    const parts = [{ id: 'p1', partName: 'Filter', price: '10', description: null, createdAt: '', updatedAt: '' }]
    vi.mocked(garageService.listRepairParts).mockResolvedValue(parts as never)

    const { result } = renderHook(() => useRepairPartsQuery(), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(garageService.listRepairParts).toHaveBeenCalledWith({ page: 1, limit: 100 })
    expect(result.current.data).toEqual(parts)
  })
})
