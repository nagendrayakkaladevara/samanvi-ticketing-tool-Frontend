import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { playNotificationSound, unlockNotificationAudio } from '@/features/notifications/utils/play-notification-sound'
import { useNotificationSound } from './use-notification-sound'

vi.mock('@/features/notifications/utils/play-notification-sound', () => ({
  unlockNotificationAudio: vi.fn(),
  playNotificationSound: vi.fn().mockResolvedValue(undefined),
}))

describe('useNotificationSound', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('unlocks audio on pointer and keydown', () => {
    renderHook(() => useNotificationSound(0))

    act(() => {
      window.dispatchEvent(new Event('pointerdown'))
      window.dispatchEvent(new Event('keydown'))
    })

    expect(unlockNotificationAudio).toHaveBeenCalledTimes(2)
  })

  it('does not play sound on initial mount', () => {
    renderHook(() => useNotificationSound(3))
    expect(playNotificationSound).not.toHaveBeenCalled()
  })

  it('plays sound when unread count increases', () => {
    const { rerender } = renderHook(({ count }) => useNotificationSound(count), {
      initialProps: { count: 1 },
    })

    rerender({ count: 3 })
    expect(playNotificationSound).toHaveBeenCalledTimes(1)
  })

  it('does not play sound when unread count decreases or stays the same', () => {
    const { rerender } = renderHook(({ count }) => useNotificationSound(count), {
      initialProps: { count: 5 },
    })

    rerender({ count: 4 })
    rerender({ count: 4 })
    expect(playNotificationSound).not.toHaveBeenCalled()
  })
})
