import { renderHook, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { collectLeafRepairCategories, garageService } from '@/features/garage/api/garage.service'
import { createWrapper } from '@/test/test-utils'
import { useRepairCategoriesQuery } from './use-repair-categories-query'

vi.mock('@/features/garage/api/garage.service', () => ({
  garageService: { listRepairCategories: vi.fn() },
  collectLeafRepairCategories: vi.fn(),
}))

describe('useRepairCategoriesQuery', () => {
  it('selects leaf options from category tree', async () => {
    const response = {
      items: [{ id: 'c1', name: 'Cat', level: 1, parentId: null, createdAt: '', updatedAt: '' }],
      tree: [],
    }
    const leafOptions = [{ id: 'leaf', label: 'Root › Leaf', level: 2 }]

    vi.mocked(garageService.listRepairCategories).mockResolvedValue(response)
    vi.mocked(collectLeafRepairCategories).mockReturnValue(leafOptions)

    const { result } = renderHook(() => useRepairCategoriesQuery(), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.leafOptions).toEqual(leafOptions)
    expect(collectLeafRepairCategories).toHaveBeenCalledWith(response.tree)
  })
})
