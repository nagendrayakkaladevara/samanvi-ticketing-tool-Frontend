import { Wifi, WifiOff } from 'lucide-react'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { useNetworkStatus } from '@/hooks/use-network-status'
import { cn } from '@/lib/utils'

export function NetworkStatusAlert() {
  const { isOnline, showReconnected } = useNetworkStatus()

  if (isOnline && !showReconnected) {
    return null
  }

  return (
    <Alert
      variant={isOnline ? 'default' : 'destructive'}
      className={cn(
        'no-print fixed inset-x-0 top-0 z-50 rounded-none border-x-0 border-t-0 shadow-md',
        isOnline && 'border-primary/30 bg-primary/10 text-foreground [&>svg]:text-primary',
      )}
    >
      {isOnline ? <Wifi aria-hidden /> : <WifiOff aria-hidden />}
      <AlertTitle>{isOnline ? 'Back online' : 'You are offline'}</AlertTitle>
      <AlertDescription>
        {isOnline
          ? 'Your internet connection has been restored.'
          : 'Changes may not save until your connection is restored.'}
      </AlertDescription>
    </Alert>
  )
}
