import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { CheckCircle2, Wifi, WifiOff } from 'lucide-react'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { RECONNECTED_VISIBLE_MS, useNetworkStatus } from '@/hooks/use-network-status'
import { cn } from '@/lib/utils'

const bannerVariants = {
  hidden: {
    opacity: 0,
    y: -24,
    scale: 0.96,
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: 'spring' as const,
      stiffness: 420,
      damping: 28,
      mass: 0.8,
    },
  },
  exit: {
    opacity: 0,
    y: -16,
    scale: 0.98,
    transition: {
      duration: 0.22,
      ease: 'easeIn' as const,
    },
  },
}

const reducedMotionVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.15 } },
  exit: { opacity: 0, transition: { duration: 0.1 } },
}

function OfflineIcon({ shouldReduceMotion }: { shouldReduceMotion: boolean | null }) {
  return (
    <motion.span
      className="relative flex size-9 shrink-0 items-center justify-center rounded-full bg-destructive/15 text-destructive"
      animate={shouldReduceMotion ? undefined : { scale: [1, 1.06, 1] }}
      transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
    >
      <span
        className={cn(
          'absolute inset-0 rounded-full bg-destructive/20',
          !shouldReduceMotion && 'motion-safe:animate-ping',
        )}
        aria-hidden
      />
      <WifiOff className="relative size-4" aria-hidden />
    </motion.span>
  )
}

function OnlineIcon() {
  return (
    <motion.span
      className="flex size-9 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
      initial={{ scale: 0.6, rotate: -12 }}
      animate={{ scale: 1, rotate: 0 }}
      transition={{ type: 'spring', stiffness: 500, damping: 18 }}
    >
      <CheckCircle2 className="size-4" aria-hidden />
    </motion.span>
  )
}

export function NetworkStatusAlert() {
  const { isOnline, showReconnected } = useNetworkStatus()
  const shouldReduceMotion = useReducedMotion()
  const mode = !isOnline ? 'offline' : showReconnected ? 'online' : null
  const variants = shouldReduceMotion ? reducedMotionVariants : bannerVariants

  return (
    <div
      className="no-print pointer-events-none fixed inset-x-0 top-0 z-50 flex justify-center px-3 pt-3 sm:px-4 sm:pt-4"
      aria-live="polite"
    >
      <AnimatePresence mode="wait">
        {mode ? (
          <motion.div
            key={mode}
            role="alert"
            variants={variants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="pointer-events-auto w-full max-w-sm"
          >
            <Alert
              variant={mode === 'offline' ? 'destructive' : 'default'}
              className={cn(
                'relative overflow-hidden rounded-xl border px-3.5 py-3 shadow-lg backdrop-blur-md sm:px-4',
                mode === 'offline'
                  ? 'border-destructive/35 bg-destructive/10 dark:border-destructive/45 dark:bg-destructive/20 [&>svg]:hidden'
                  : 'border-emerald-500/35 bg-emerald-500/10 text-foreground dark:border-emerald-400/35 dark:bg-emerald-500/15 [&>svg]:hidden',
              )}
            >
              {mode === 'online' ? (
                <motion.div
                  className="absolute inset-x-0 bottom-0 h-0.5 bg-emerald-500/25"
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ duration: RECONNECTED_VISIBLE_MS / 1000, ease: 'linear' }}
                  style={{ transformOrigin: 'left' }}
                  aria-hidden
                />
              ) : null}

              <div className="flex items-start gap-3">
                {mode === 'offline' ? <OfflineIcon shouldReduceMotion={shouldReduceMotion} /> : <OnlineIcon />}

                <div className="min-w-0 flex-1">
                  <AlertTitle className="text-sm font-semibold leading-tight">
                    {mode === 'offline' ? 'You are offline' : 'Back online'}
                  </AlertTitle>
                  <AlertDescription className="mt-1 text-xs leading-relaxed sm:text-sm">
                    {mode === 'offline'
                      ? 'Changes may not save until your connection is restored.'
                      : 'Your internet connection has been restored.'}
                  </AlertDescription>
                </div>

                {mode === 'online' ? (
                  <motion.span
                    className="text-emerald-600 dark:text-emerald-400"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.1, type: 'spring', stiffness: 400, damping: 20 }}
                    aria-hidden
                  >
                    <Wifi className="size-4" />
                  </motion.span>
                ) : null}
              </div>
            </Alert>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  )
}
