import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import type { TicketStatusApi } from '@/features/user-history/types/user-history'
import { formatStatusLabel } from '@/features/user-history/utils/format'
import { cn } from '@/lib/utils'

const STATUS_COLORS: Partial<Record<TicketStatusApi, string>> = {
  created: 'bg-slate-400',
  assigned: 'bg-sky-500',
  in_progress: 'bg-amber-400',
  blocked: 'bg-rose-500',
  resolved: 'bg-emerald-500',
  closed: 'bg-slate-600',
  reopened: 'bg-violet-500',
}

const STATUS_ORDER: TicketStatusApi[] = [
  'created',
  'assigned',
  'in_progress',
  'blocked',
  'resolved',
  'closed',
  'reopened',
]

type StatusBreakdownBarsProps = {
  title: string
  description: string
  breakdown: Partial<Record<TicketStatusApi, number>>
}

function StatusRow({ status, count, peak }: { status: TicketStatusApi; count: number; peak: number }) {
  const width = peak > 0 ? Math.max(4, (count / peak) * 100) : 0

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between gap-2 text-xs">
        <span className="font-medium capitalize text-foreground">{formatStatusLabel(status)}</span>
        <span className="tabular-nums text-muted-foreground">{count}</span>
      </div>
      <div className="user-history-status-bar__track">
        <div
          className={cn('user-history-status-bar__fill', STATUS_COLORS[status] ?? 'bg-primary')}
          style={{ width: `${width}%` }}
        />
      </div>
    </div>
  )
}

export function StatusBreakdownBars({ title, description, breakdown }: StatusBreakdownBarsProps) {
  const rows = STATUS_ORDER.map((status) => ({
    status,
    count: breakdown[status] ?? 0,
  })).filter((row) => row.count > 0)

  const peak = Math.max(...rows.map((row) => row.count), 1)
  const total = rows.reduce((sum, row) => sum + row.count, 0)

  return (
    <Card className="border-border/80 bg-card/95 shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold tracking-tight">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        {rows.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">No tickets in this category.</p>
        ) : (
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground">
              <span className="font-semibold text-foreground">{total}</span> tickets across statuses
            </p>
            {rows.map((row) => (
              <StatusRow key={row.status} status={row.status} count={row.count} peak={peak} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
