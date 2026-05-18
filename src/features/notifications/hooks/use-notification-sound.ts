import { useEffect, useRef } from 'react'

import { playNotificationSound, unlockNotificationAudio } from '@/features/notifications/utils/play-notification-sound'

export function useNotificationSound(unreadCount: number) {
  const previousCountRef = useRef<number | null>(null)

  useEffect(() => {
    const unlock = () => {
      unlockNotificationAudio()
    }

    window.addEventListener('pointerdown', unlock, { once: true })
    window.addEventListener('keydown', unlock, { once: true })

    return () => {
      window.removeEventListener('pointerdown', unlock)
      window.removeEventListener('keydown', unlock)
    }
  }, [])

  useEffect(() => {
    const previousCount = previousCountRef.current
    previousCountRef.current = unreadCount

    if (previousCount === null) {
      return
    }

    if (unreadCount > previousCount) {
      void playNotificationSound()
    }
  }, [unreadCount])
}
