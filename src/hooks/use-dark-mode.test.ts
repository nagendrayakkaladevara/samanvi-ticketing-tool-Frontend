import { act, renderHook, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { useDarkMode } from './use-dark-mode'

describe('useDarkMode', () => {
  beforeEach(() => {
    document.documentElement.classList.remove('dark')
  })

  afterEach(() => {
    document.documentElement.classList.remove('dark')
  })

  it('returns false when dark class is absent', () => {
    const { result } = renderHook(() => useDarkMode())
    expect(result.current).toBe(false)
  })

  it('returns true when dark class is present', () => {
    document.documentElement.classList.add('dark')
    const { result } = renderHook(() => useDarkMode())
    expect(result.current).toBe(true)
  })

  it('updates when dark class toggles via mutation observer', async () => {
    const { result } = renderHook(() => useDarkMode())
    expect(result.current).toBe(false)

    act(() => {
      document.documentElement.classList.add('dark')
    })
    await waitFor(() => expect(result.current).toBe(true))

    act(() => {
      document.documentElement.classList.remove('dark')
    })
    await waitFor(() => expect(result.current).toBe(false))
  })
})
