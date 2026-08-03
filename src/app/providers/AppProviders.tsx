import type { PropsWithChildren } from 'react'
import { QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'sonner'

import { PermissionsBootstrap } from '@/components/auth/PermissionsBootstrap'
import { NetworkStatusAlert } from '@/components/network-status-alert'
import { queryClient } from '@/lib/query/query-client'

export function AppProviders({ children }: PropsWithChildren) {
  return (
    <QueryClientProvider client={queryClient}>
      <PermissionsBootstrap />
      <NetworkStatusAlert />
      {children}
      <Toaster richColors position="top-right" />
    </QueryClientProvider>
  )
}
