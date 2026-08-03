import { useEffect, useState } from 'react'

function readIsOnline(): boolean {
  if (typeof navigator === 'undefined') {
    return true
  }

  return navigator.onLine
}

export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(readIsOnline)
  const [showReconnected, setShowReconnected] = useState(false)

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      setShowReconnected(true)
    }

    const handleOffline = () => {
      setIsOnline(false)
      setShowReconnected(false)
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  useEffect(() => {
    if (!showReconnected) {
      return
    }

    const timer = window.setTimeout(() => setShowReconnected(false), 4000)
    return () => window.clearTimeout(timer)
  }, [showReconnected])

  return { isOnline, showReconnected }
}
