import { renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { useScrollToTop } from './use-scroll-to-top'

describe('useScrollToTop', () => {
  it('scrolls window and document to top on mount', () => {
    const scrollTo = vi.spyOn(window, 'scrollTo').mockImplementation(() => {})
    document.documentElement.scrollTop = 100
    document.body.scrollTop = 100

    renderHook(() => useScrollToTop())

    expect(scrollTo).toHaveBeenCalledWith({ top: 0, left: 0 })
    expect(document.documentElement.scrollTop).toBe(0)
    expect(document.body.scrollTop).toBe(0)
  })

  it('scrolls again when dependencies change', () => {
    const scrollTo = vi.spyOn(window, 'scrollTo').mockImplementation(() => {})
    const { rerender } = renderHook(({ dep }) => useScrollToTop([dep]), {
      initialProps: { dep: 1 },
    })

    expect(scrollTo).toHaveBeenCalledTimes(1)
    rerender({ dep: 2 })
    expect(scrollTo).toHaveBeenCalledTimes(2)
  })
})
