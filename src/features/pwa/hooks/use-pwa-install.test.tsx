import { act, renderHook, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { BeforeInstallPromptEvent } from '@/features/pwa/types/before-install-prompt-event'
import { isIosSafari, usePwaInstall } from './use-pwa-install'

function mockMatchMedia(matches: boolean) {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    configurable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: query.includes('standalone') || query.includes('fullscreen') ? matches : false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  })
}

function createBeforeInstallPromptEvent(): BeforeInstallPromptEvent {
  return {
    preventDefault: vi.fn(),
    platforms: ['web'],
    prompt: vi.fn().mockResolvedValue(undefined),
    userChoice: Promise.resolve({ outcome: 'accepted', platform: 'web' }),
  } as unknown as BeforeInstallPromptEvent
}

describe('isIosSafari', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('detects iOS Safari user agents', () => {
    vi.stubGlobal('navigator', {
      userAgent:
        'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
    })

    expect(isIosSafari()).toBe(true)
  })

  it('returns false for Chrome on iOS', () => {
    vi.stubGlobal('navigator', {
      userAgent:
        'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/120.0.0.0 Mobile/15E148 Safari/604.1',
    })

    expect(isIosSafari()).toBe(false)
  })
})

describe('usePwaInstall', () => {
  beforeEach(() => {
    localStorage.clear()
    mockMatchMedia(false)
    vi.stubGlobal('navigator', {
      userAgent: 'Mozilla/5.0',
      standalone: false,
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it('shows banner after beforeinstallprompt and installs on accept', async () => {
    const { result } = renderHook(() => usePwaInstall())

    const event = createBeforeInstallPromptEvent()

    act(() => {
      window.dispatchEvent(event)
    })

    await waitFor(() => expect(result.current.canInstall).toBe(true))
    expect(result.current.canShow).toBe(true)

    await act(async () => {
      await result.current.install()
    })

    expect(event.prompt).toHaveBeenCalled()
    expect(result.current.isInstalled).toBe(true)
    expect(result.current.canInstall).toBe(false)
  })

  it('dismisses banner and stores dismiss timestamp', () => {
    const { result } = renderHook(() => usePwaInstall())

    act(() => {
      result.current.dismiss()
    })

    expect(result.current.canShow).toBe(false)
    expect(localStorage.getItem('samanvi.pwa.installDismissedUntil')).toBeTruthy()
  })

  it('does not dismiss when respectDismiss is false', () => {
    const { result } = renderHook(() => usePwaInstall({ respectDismiss: false }))

    act(() => {
      result.current.dismiss()
    })

    expect(localStorage.getItem('samanvi.pwa.installDismissedUntil')).toBeNull()
  })

  it('marks installed on appinstalled event', () => {
    const { result } = renderHook(() => usePwaInstall())

    act(() => {
      window.dispatchEvent(new Event('appinstalled'))
    })

    expect(result.current.isInstalled).toBe(true)
    expect(result.current.canShow).toBe(false)
  })

  it('treats standalone display mode as installed', () => {
    mockMatchMedia(true)

    const { result } = renderHook(() => usePwaInstall())

    expect(result.current.isInstalled).toBe(true)
    expect(result.current.canShow).toBe(false)
  })

  it('shows iOS guide on Safari when not dismissed', () => {
    vi.stubGlobal('navigator', {
      userAgent:
        'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
      standalone: false,
    })

    const { result } = renderHook(() => usePwaInstall())

    expect(result.current.showIosGuide).toBe(true)
    expect(result.current.canShow).toBe(true)
  })

  it('install is a no-op without deferred prompt', async () => {
    const { result } = renderHook(() => usePwaInstall())

    await act(async () => {
      await result.current.install()
    })

    expect(result.current.isInstalling).toBe(false)
    expect(result.current.isInstalled).toBe(false)
  })
})
