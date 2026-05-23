import {
  Activity,
  AlertTriangle,
  CircleCheckBig,
  ClipboardList,
  Clock3,
  FolderOpen,
  Gauge,
  Ticket,
} from 'lucide-react'
import type { CSSProperties } from 'react'

import { Card, CardContent, CardDescription, CardHeader } from '@/components/ui/card'
import type { UserMetrics } from '@/features/user-history/types/user-history'
import { formatDurationMs, formatPercent } from '@/features/user-history/utils/format'
import { cn } from '@/lib/utils'

type MetricCardProps = {
  title: string
  value: string
  helper: string
  icon: typeof Ticket
  tone?: string
}

function MetricCard({ title, value, helper, icon: Icon, tone = '168 65% 38%' }: MetricCardProps) {
  return (
    <Card
      className="user-history-metric border-border/80 bg-card/95 shadow-sm"
      style={{ '--metric-tone': tone } as CSSProperties}
    >
      <CardHeader className="flex flex-row items-start justify-between space-y-0 p-3 pb-1 sm:p-6 sm:pb-2">
        <CardDescription className="pr-1 text-[0.6rem] font-semibold uppercase leading-tight tracking-[0.14em] sm:text-[0.65rem] sm:tracking-[0.2em]">
          {title}
        </CardDescription>
        <Icon className="h-3.5 w-3.5 shrink-0 text-muted-foreground sm:h-4 sm:w-4" aria-hidden />
      </CardHeader>
      <CardContent className="px-3 pb-3 pt-0 sm:px-6 sm:pb-6">
        <div className="user-history-metric__value text-2xl font-semibold leading-tight sm:text-3xl">{value}</div>
        <p className="mt-1 text-[0.7rem] leading-snug text-muted-foreground sm:text-xs">{helper}</p>
      </CardContent>
    </Card>
  )
}

type UserMetricsCardsProps = {
  metrics: UserMetrics
  className?: string
}

export function UserMetricsCards({ metrics, className }: UserMetricsCardsProps) {
  const { assigned, created, actedOn } = metrics

  return (
    <div className={cn('grid grid-cols-2 gap-2.5 sm:gap-3 lg:grid-cols-3 xl:grid-cols-4', className)}>
      <MetricCard
        title="Open assigned"
        value={String(assigned.openCount)}
        helper={`${assigned.totalCount} total assigned · ${assigned.overdueOpenCount} overdue`}
        icon={FolderOpen}
        tone="199 89% 48%"
      />
      <MetricCard
        title="Resolved in window"
        value={String(assigned.resolvedInWindowCount)}
        helper={`${assigned.resolvedAllTimeCount} resolved all-time`}
        icon={CircleCheckBig}
        tone="160 84% 39%"
      />
      <MetricCard
        title="SLA compliance"
        value={formatPercent(assigned.slaCompliancePercent)}
        helper="Resolved within SLA in selected window"
        icon={Gauge}
        tone="168 65% 38%"
      />
      <MetricCard
        title="Avg resolution"
        value={formatDurationMs(assigned.averageResolutionTimeMs)}
        helper="Create → resolve in window"
        icon={Clock3}
        tone="32 95% 52%"
      />
      <MetricCard
        title="Created tickets"
        value={String(created.totalCount)}
        helper="All-time tickets filed by user"
        icon={ClipboardList}
        tone="221 70% 50%"
      />
      <MetricCard
        title="Tickets acted on"
        value={String(actedOn.distinctTicketCount)}
        helper={`${actedOn.activityCount} activity log entries`}
        icon={Activity}
        tone="280 55% 52%"
      />
      <MetricCard
        title="Overdue open"
        value={String(assigned.overdueOpenCount)}
        helper="Assigned tickets past SLA due"
        icon={AlertTriangle}
        tone="0 72% 51%"
      />
      <MetricCard
        title="Assigned total"
        value={String(assigned.totalCount)}
        helper="Lifetime assignment count"
        icon={Ticket}
        tone="215 25% 45%"
      />
    </div>
  )
}
