import { Download, Share, Smartphone } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { isIosSafari, usePwaInstall } from '@/features/pwa/hooks/use-pwa-install'

export function PwaInstallSettingsSection() {
  const { showIosGuide, install, isInstalling, canInstall, isInstalled } = usePwaInstall({
    respectDismiss: false,
  })

  const showGenericHint =
    !isInstalled && !canInstall && !showIosGuide && typeof window !== 'undefined' && !isIosSafari()

  return (
    <Card className="xl:col-span-5">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-base">
          <Smartphone className="h-4 w-4" />
          Install app
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Add Samanvi to your home screen for quicker access and an app-like experience.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {isInstalled ? (
          <p className="text-sm text-muted-foreground">
            You are already using the installed app (standalone mode). Updates roll out automatically when you
            refresh or reopen the app.
          </p>
        ) : null}

        {!isInstalled && canInstall ? (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">
              Your browser can install this app. Tap install to add it to your device or desktop.
            </p>
            <Button type="button" className="shrink-0" onClick={() => void install()} disabled={isInstalling}>
              {isInstalling ? 'Installing…' : 'Install app'}
            </Button>
          </div>
        ) : null}

        {!isInstalled && showIosGuide ? (
          <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
            <div className="flex gap-3">
              <div className="bg-primary/15 text-primary flex size-10 shrink-0 items-center justify-center rounded-lg">
                <Download className="size-5" aria-hidden />
              </div>
              <p className="text-sm leading-relaxed text-muted-foreground">
                On iPhone or iPad, tap <Share className="inline size-3.5 align-text-bottom" aria-hidden />{' '}
                <span className="font-medium text-foreground">Share</span>, then choose{' '}
                <span className="font-medium text-foreground">Add to Home Screen</span>.
              </p>
            </div>
          </div>
        ) : null}

        {!isInstalled && showGenericHint ? (
          <p className="text-sm text-muted-foreground">
            If you do not see an install option, use your browser menu: in Chrome, open the menu and choose
            &quot;Install app&quot; or &quot;Add to Home screen&quot;. For the best experience, use Chrome or Edge
            on desktop or Android.
          </p>
        ) : null}
      </CardContent>
    </Card>
  )
}
