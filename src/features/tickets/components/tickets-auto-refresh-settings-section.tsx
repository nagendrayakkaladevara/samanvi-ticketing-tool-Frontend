import { RefreshCw } from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useTicketsAutoRefresh } from '@/features/tickets/hooks/use-tickets-auto-refresh'
import { cn } from '@/lib/utils'

export function TicketsAutoRefreshSettingsSection() {
  const { autoRefresh, toggleAutoRefresh } = useTicketsAutoRefresh()

  return (
    <Card className="xl:col-span-2">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-base">
          <RefreshCw className="h-4 w-4" />
          Tickets
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Automatically refresh the tickets list every 10 seconds while you are on the tickets page.
        </p>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between gap-4 rounded-lg border p-3">
          <div className="min-w-0">
            <p className="font-medium">Auto refresh</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {autoRefresh ? 'Tickets list stays up to date in the background.' : 'Refresh tickets manually when needed.'}
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={autoRefresh}
            aria-label="Auto refresh tickets list"
            onClick={toggleAutoRefresh}
            className={cn(
              'relative h-5 w-9 shrink-0 cursor-pointer rounded-full border-none transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
              autoRefresh ? 'bg-primary' : 'bg-muted',
            )}
          >
            <span
              className={cn(
                'absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-background shadow-sm transition-transform',
                autoRefresh && 'translate-x-4',
              )}
            />
          </button>
        </div>
      </CardContent>
    </Card>
  )
}
