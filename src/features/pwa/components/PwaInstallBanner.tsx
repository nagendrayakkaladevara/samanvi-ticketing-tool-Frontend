import { Download, Share, X } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { usePwaInstall } from '@/features/pwa/hooks/use-pwa-install'
import { cn } from '@/lib/utils'

export function PwaInstallBanner() {
  const { canShow, showIosGuide, install, dismiss, isInstalling, canInstall } = usePwaInstall()

  if (!canShow) {
    return null
  }

  return (
    <div
      role="region"
      aria-label="Install app"
      className={cn('no-print border-b border-primary/20 bg-primary/5 px-3 py-3 sm:px-4')}
    >
      <div className="mx-auto flex max-w-5xl gap-3">
        <div className="bg-primary/15 text-primary flex size-10 shrink-0 items-center justify-center rounded-lg">
          <Download className="size-5" aria-hidden />
        </div>

        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-sm font-semibold leading-tight">Install Samanvi</p>
              <p className="text-muted-foreground mt-0.5 text-xs leading-relaxed sm:text-sm">
                {showIosGuide ? (
                  <>
                    Tap <Share className="inline size-3.5 align-text-bottom" aria-hidden /> Share, then{' '}
                    <span className="text-foreground font-medium">Add to Home Screen</span> for quick access.
                  </>
                ) : (
                  'Add the ticketing app to your home screen for faster access and an app-like experience.'
                )}
              </p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="text-muted-foreground size-7 shrink-0"
              onClick={dismiss}
              aria-label="Dismiss install banner"
            >
              <X className="size-4" />
            </Button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {canInstall ? (
              <Button type="button" size="sm" onClick={() => void install()} disabled={isInstalling}>
                {isInstalling ? 'Installing…' : 'Install app'}
              </Button>
            ) : null}
            <Button type="button" variant="outline" size="sm" onClick={dismiss}>
              Not now
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
