import { renderHook, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { helpersService } from '@/features/employees/api/helpers.service'
import { createWrapper } from '@/test/test-utils'
import { useHelperDetailQuery, useHelpersQuery } from './use-helpers-query'

vi.mock('@/features/employees/api/helpers.service', () => ({
  helpersService: { list: vi.fn(), getById: vi.fn() },
}))

describe('useHelpersQuery', () => {
  it('fetches helpers list', async () => {
    const helpers = [{ id: 'h1', helperIdNumber: 'HLP-1' }]
    vi.mocked(helpersService.list).mockResolvedValue(helpers as never)

    const { result } = renderHook(() => useHelpersQuery(), { wrapper: createWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual(helpers)
  })
})

describe('useHelperDetailQuery', () => {
  it('is disabled without helperId', () => {
    const { result } = renderHook(() => useHelperDetailQuery(null, true), { wrapper: createWrapper() })
    expect(result.current.fetchStatus).toBe('idle')
  })

  it('fetches helper when enabled', async () => {
    vi.mocked(helpersService.getById).mockResolvedValue({ id: 'h1' } as never)
    const { result } = renderHook(() => useHelperDetailQuery('h1', true), { wrapper: createWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
  })
})
