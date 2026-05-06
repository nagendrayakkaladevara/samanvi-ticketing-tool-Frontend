import { toast as sonnerToast, type ExternalToast } from 'sonner'

const MIN_TOAST_DURATION_MS = 2200
const MAX_TOAST_DURATION_MS = 8000
const DURATION_PER_CHARACTER_MS = 35

type ToastOptions = ExternalToast

function getMessageLength(message: string): number {
  return message.replace(/\s+/g, ' ').trim().length
}

function getDurationForMessage(message: string): number {
  const messageLength = getMessageLength(message)
  if (messageLength === 0) {
    return MIN_TOAST_DURATION_MS
  }

  const computedDuration = messageLength * DURATION_PER_CHARACTER_MS
  return Math.min(MAX_TOAST_DURATION_MS, Math.max(MIN_TOAST_DURATION_MS, computedDuration))
}

function withAutoDuration(message: string, options?: ToastOptions): ToastOptions {
  return {
    ...options,
    duration: options?.duration ?? getDurationForMessage(message),
  }
}

export const toast = {
  success(message: string, options?: ToastOptions) {
    return sonnerToast.success(message, withAutoDuration(message, options))
  },
  error(message: string, options?: ToastOptions) {
    return sonnerToast.error(message, withAutoDuration(message, options))
  },
  info(message: string, options?: ToastOptions) {
    return sonnerToast.info(message, withAutoDuration(message, options))
  },
  warning(message: string, options?: ToastOptions) {
    return sonnerToast.warning(message, withAutoDuration(message, options))
  },
  message(message: string, options?: ToastOptions) {
    return sonnerToast.message(message, withAutoDuration(message, options))
  },
}
