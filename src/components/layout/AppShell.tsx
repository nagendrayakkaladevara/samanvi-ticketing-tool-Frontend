import { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'

import { AppSidebar } from '@/components/app-sidebar'
import { NotificationBell } from '@/features/notifications/components/NotificationBell'
import { PwaInstallBanner } from '@/features/pwa/components/PwaInstallBanner'
import { useCurrentUser } from '@/hooks/use-current-user'
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'
import { Separator } from '@/components/ui/separator'

export function AppShell() {
  const currentUser = useCurrentUser()
  const { pathname } = useLocation()

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0 })
    document.documentElement.scrollTop = 0
    document.body.scrollTop = 0
  }, [pathname])

  return (
    <SidebarProvider defaultOpen={false}>
      <AppSidebar />
      <SidebarInset>
        <header className="no-print bg-card sticky top-0 z-10 flex h-16 shrink-0 items-center justify-between gap-2 border-b px-3 sm:px-4">
          <div className="flex min-w-0 items-center gap-2">
            <SidebarTrigger />
            <Separator orientation="vertical" className="mr-1 hidden h-4 sm:mr-2 sm:block" />
            <p className="hidden truncate text-sm font-medium sm:block">Samanvi Internal Tool</p>
            <p className="truncate text-sm font-medium sm:hidden">Samanvi</p>
          </div>
          <div className="flex shrink-0 items-center gap-1.5 sm:gap-3">
            <NotificationBell />
            <div className="hidden min-w-0 max-w-[7.5rem] text-right text-xs text-muted-foreground min-[380px]:block sm:max-w-[10rem]">
              <p className="truncate font-medium text-foreground">{currentUser?.name ?? 'Unknown user'}</p>
              <p className="hidden truncate sm:block">{currentUser?.role ?? 'WORKER'}</p>
            </div>
          </div>
        </header>
        <PwaInstallBanner />
        <main className="min-w-0 p-4 sm:p-6 print:p-0">
          <Outlet />
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
