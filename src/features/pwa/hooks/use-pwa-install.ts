import { useCallback, useEffect, useState } from 'react'

import type { BeforeInstallPromptEvent } from '@/features/pwa/types/before-install-prompt-event'

const DISMISS_STORAGE_KEY = 'samanvi.pwa.installDismissedUntil'
const DISMISS_MS = 14 * 24 * 60 * 60 * 1000

function isStandaloneDisplay(): boolean {
  if (typeof window === 'undefined') {
    return false
  }

  const navigatorWithStandalone = window.navigator as Navigator & { standalone?: boolean }
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.matchMedia('(display-mode: fullscreen)').matches ||
    navigatorWithStandalone.standalone === true
  )
}

function isIosSafari(): boolean {
  if (typeof window === 'undefined') {
    return false
  }

  const ua = window.navigator.userAgent
  const isIos = /iphone|ipad|ipod/i.test(ua)
  const isSafari = /safari/i.test(ua) && !/crios|fxios|edgios/i.test(ua)
  return isIos && isSafari
}

function isDismissed(): boolean {
  try {
    const until = window.localStorage.getItem(DISMISS_STORAGE_KEY)
    if (!until) {
      return false
    }
    return Date.now() < Number(until)
  } catch {
    return false
  }
}

function dismissBanner() {
  try {
    window.localStorage.setItem(DISMISS_STORAGE_KEY, String(Date.now() + DISMISS_MS))
  } catch {
    // Ignore storage errors
  }
}

export function usePwaInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [isInstalling, setIsInstalling] = useState(false)
  const [isInstalled, setIsInstalled] = useState(isStandaloneDisplay)
  const [dismissed, setDismissed] = useState(isDismissed)
  const [showIosGuide, setShowIosGuide] = useState(false)

  useEffect(() => {
    if (isStandaloneDisplay() || isDismissed()) {
      return
    }

    if (isIosSafari()) {
      setShowIosGuide(true)
    }

    const onBeforeInstallPrompt = (event: BeforeInstallPromptEvent) => {
      event.preventDefault()
      setDeferredPrompt(event)
      setShowIosGuide(false)
    }

    const onAppInstalled = () => {
      setIsInstalled(true)
      setDeferredPrompt(null)
      setShowIosGuide(false)
    }

    window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt)
    window.addEventListener('appinstalled', onAppInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt)
      window.removeEventListener('appinstalled', onAppInstalled)
    }
  }, [])

  const dismiss = useCallback(() => {
    dismissBanner()
    setDismissed(true)
    setDeferredPrompt(null)
    setShowIosGuide(false)
  }, [])

  const install = useCallback(async () => {
    if (!deferredPrompt) {
      return
    }

    setIsInstalling(true)
    try {
      await deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      if (outcome === 'accepted') {
        setIsInstalled(true)
      }
    } finally {
      setDeferredPrompt(null)
      setIsInstalling(false)
    }
  }, [deferredPrompt])

  const canShow = !isInstalled && !dismissed && (deferredPrompt !== null || showIosGuide)

  return {
    canShow,
    showIosGuide,
    install,
    dismiss,
    isInstalling,
    canInstall: deferredPrompt !== null,
  }
}
