import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

function installAudioContextMock(state: AudioContextState = 'running') {
  class MockAudioContext {
    state = state
    currentTime = 0
    destination = {}
    resume = vi.fn().mockImplementation(async () => {
      this.state = 'running'
    })
    createGain = vi.fn(() => ({
      gain: {
        value: 0,
        setValueAtTime: vi.fn(),
        exponentialRampToValueAtTime: vi.fn(),
      },
      connect: vi.fn(),
    }))
    createOscillator = vi.fn(() => ({
      type: 'sine',
      frequency: { value: 0 },
      connect: vi.fn(),
      start: vi.fn(),
      stop: vi.fn(),
    }))
  }

  vi.stubGlobal('AudioContext', MockAudioContext)
  return MockAudioContext
}

describe('play-notification-sound', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('resumes suspended audio context on unlock', async () => {
    installAudioContextMock('suspended')
    const mod = await import('./play-notification-sound')

    mod.unlockNotificationAudio()

    const context = new AudioContext()
    expect(context.resume).toHaveBeenCalled()
  })

  it('plays two tones when context is running', async () => {
    installAudioContextMock('running')
    const mod = await import('./play-notification-sound')

    await mod.playNotificationSound()

    const context = new AudioContext()
    expect(context.createOscillator).toHaveBeenCalledTimes(2)
  })

  it('returns early when resume fails', async () => {
    class FailingAudioContext {
      state: AudioContextState = 'suspended'
      currentTime = 0
      destination = {}
      resume = vi.fn().mockRejectedValue(new Error('blocked'))
      createGain = vi.fn()
      createOscillator = vi.fn()
    }

    vi.stubGlobal('AudioContext', FailingAudioContext)
    const mod = await import('./play-notification-sound')

    await expect(mod.playNotificationSound()).resolves.toBeUndefined()
    const context = new AudioContext()
    expect(context.createOscillator).not.toHaveBeenCalled()
  })

  it('does nothing when context stays non-running', async () => {
    class SuspendedAudioContext {
      state: AudioContextState = 'suspended'
      currentTime = 0
      destination = {}
      resume = vi.fn().mockResolvedValue(undefined)
      createGain = vi.fn()
      createOscillator = vi.fn()
    }

    vi.stubGlobal('AudioContext', SuspendedAudioContext)
    const mod = await import('./play-notification-sound')

    await mod.playNotificationSound()

    const context = new AudioContext()
    expect(context.createOscillator).not.toHaveBeenCalled()
  })
})
