let audioContext: AudioContext | null = null

function getAudioContext(): AudioContext {
  if (!audioContext) {
    audioContext = new AudioContext()
  }
  return audioContext
}

export function unlockNotificationAudio(): void {
  const context = getAudioContext()
  if (context.state === 'suspended') {
    void context.resume()
  }
}

export async function playNotificationSound(): Promise<void> {
  if (typeof window === 'undefined') {
    return
  }

  const context = getAudioContext()

  if (context.state === 'suspended') {
    try {
      await context.resume()
    } catch {
      return
    }
  }

  if (context.state !== 'running') {
    return
  }

  const start = context.currentTime
  const masterGain = context.createGain()
  masterGain.gain.value = 0.2
  masterGain.connect(context.destination)

  const playTone = (frequency: number, toneStart: number, duration: number) => {
    const oscillator = context.createOscillator()
    const gain = context.createGain()

    oscillator.type = 'sine'
    oscillator.frequency.value = frequency

    gain.gain.setValueAtTime(0.0001, toneStart)
    gain.gain.exponentialRampToValueAtTime(0.35, toneStart + 0.02)
    gain.gain.exponentialRampToValueAtTime(0.0001, toneStart + duration)

    oscillator.connect(gain)
    gain.connect(masterGain)

    oscillator.start(toneStart)
    oscillator.stop(toneStart + duration + 0.05)
  }

  playTone(880, start, 0.12)
  playTone(1174.66, start + 0.1, 0.18)
}
