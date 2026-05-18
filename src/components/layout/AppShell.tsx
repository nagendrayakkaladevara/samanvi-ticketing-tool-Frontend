import { Outlet } from 'react-router-dom'

import { AppSidebar } from '@/components/app-sidebar'
import { NotificationBell } from '@/features/notifications/components/NotificationBell'
import { useCurrentUser } from '@/hooks/use-current-user'
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'
import { Separator } from '@/components/ui/separator'

export function AppShell() {
  const currentUser = useCurrentUser()

  return (
    <SidebarProvider defaultOpen={false}>
      <AppSidebar />
      <SidebarInset>
        <header className="no-print bg-card sticky top-0 z-10 flex h-16 shrink-0 items-center justify-between border-b px-4">
          <div className="flex items-center gap-2">
            <SidebarTrigger />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <p className="text-sm font-medium">Samanvi Ticketing Tool</p>
          </div>
          <div className="flex items-center gap-3">
            <NotificationBell />
            <div className="text-right text-xs text-muted-foreground">
              <p className="font-medium text-foreground">{currentUser?.name ?? 'Unknown user'}</p>
              <p>{currentUser?.role ?? 'WORKER'}</p>
            </div>
          </div>
        </header>
        <main className="min-w-0 p-6 print:p-0">
          <Outlet />
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
