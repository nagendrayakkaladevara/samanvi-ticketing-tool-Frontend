import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

describe('play-notification-sound', () => {
  let resumeMock: ReturnType<typeof vi.fn>
  let createOscillatorMock: ReturnType<typeof vi.fn>

  beforeEach(() => {
    vi.resetModules()
    resumeMock = vi.fn().mockResolvedValue(undefined)
    createOscillatorMock = vi.fn(() => ({
      type: 'sine',
      frequency: { value: 0 },
      connect: vi.fn(),
      start: vi.fn(),
      stop: vi.fn(),
    }))
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  function installAudioContext(state: AudioContextState) {
    class MockAudioContext {
      state = state
      currentTime = 0
      destination = {}
      resume = resumeMock
      createGain = vi.fn(() => ({
        gain: {
          value: 0,
          setValueAtTime: vi.fn(),
          exponentialRampToValueAtTime: vi.fn(),
        },
        connect: vi.fn(),
      }))
      createOscillator = createOscillatorMock
    }

    vi.stubGlobal('AudioContext', MockAudioContext)
  }

  it('resumes suspended audio context on unlock', async () => {
    installAudioContext('suspended')
    const mod = await import('./play-notification-sound')

    mod.unlockNotificationAudio()

    expect(resumeMock).toHaveBeenCalled()
  })

  it('plays two tones when context is running', async () => {
    installAudioContext('running')
    const mod = await import('./play-notification-sound')

    await mod.playNotificationSound()

    expect(createOscillatorMock).toHaveBeenCalledTimes(2)
  })

  it('returns early when resume fails', async () => {
    resumeMock = vi.fn().mockRejectedValue(new Error('blocked'))
    installAudioContext('suspended')
    const mod = await import('./play-notification-sound')

    await expect(mod.playNotificationSound()).resolves.toBeUndefined()
    expect(createOscillatorMock).not.toHaveBeenCalled()
  })

  it('does nothing when context stays non-running', async () => {
    installAudioContext('suspended')
    const mod = await import('./play-notification-sound')

    await mod.playNotificationSound()

    expect(createOscillatorMock).not.toHaveBeenCalled()
  })

  it('does not resume when context is already running on unlock', async () => {
    installAudioContext('running')
    const mod = await import('./play-notification-sound')

    mod.unlockNotificationAudio()

    expect(resumeMock).not.toHaveBeenCalled()
  })
})
