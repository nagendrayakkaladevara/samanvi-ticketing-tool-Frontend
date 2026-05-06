import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { AlertTriangle, ArrowRight, CircleCheckBig, Clock3, FolderOpen, Ticket, TrendingDown, TrendingUp, Wrench } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useDashboardSummaryQuery } from '@/features/dashboard/hooks/use-dashboard-summary-query'

type RingSegment = {
  label: string
  value: number
  colorClass: string
  trailClass: string
}

function formatNumber(value: number) {
  return new Intl.NumberFormat('en-IN').format(value)
}

function SummaryCard({
  title,
  value,
  icon: Icon,
  toneClass,
  helper,
  trendPercent,
  lowerIsBetter,
}: {
  title: string
  value: number
  icon: React.ComponentType<{ className?: string }>
  toneClass: string
  helper: string
  trendPercent?: number
  lowerIsBetter?: boolean
}) {
  const hasTrend = typeof trendPercent === 'number' && Number.isFinite(trendPercent)
  const isPositive = (trendPercent ?? 0) >= 0
  const trendIsGood = hasTrend ? (lowerIsBetter ? !isPositive : isPositive) : true
  const trendTextColor = trendIsGood ? 'text-emerald-700' : 'text-rose-700'
  const TrendIcon = isPositive ? TrendingUp : TrendingDown

  return (
    <Card className="relative overflow-hidden border-border/80 bg-card/95 shadow-sm">
      <div className={`absolute inset-x-0 top-0 h-1 ${toneClass}`} />
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardDescription className="text-xs uppercase tracking-[0.18em]">{title}</CardDescription>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-semibold leading-tight">{formatNumber(value)}</div>
        <div className="mt-1 flex min-h-4 items-center gap-2">
          <p className="text-xs text-muted-foreground">{helper}</p>
          {hasTrend ? (
            <span className={`inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${trendTextColor}`}>
              <TrendIcon className="h-3 w-3" />
              {Math.abs(trendPercent ?? 0).toFixed(1)}%
            </span>
          ) : null}
        </div>
      </CardContent>
    </Card>
  )
}

function DashboardSkeleton() {
  return (
    <section className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-4 w-96 max-w-full" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Card key={i} className="border-border/70">
            <CardHeader className="pb-2">
              <Skeleton className="h-3 w-24" />
            </CardHeader>
            <CardContent className="space-y-2">
              <Skeleton className="h-8 w-16" />
              <Skeleton className="h-3 w-28" />
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader>
            <Skeleton className="h-5 w-48" />
          </CardHeader>
          <CardContent>
            <Skeleton className="mx-auto h-52 w-52 rounded-full" />
          </CardContent>
        </Card>
        <Card className="lg:col-span-2">
          <CardHeader>
            <Skeleton className="h-5 w-40" />
          </CardHeader>
          <CardContent className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-11 w-full" />
            ))}
          </CardContent>
        </Card>
      </div>
    </section>
  )
}

export function DashboardPage() {
  const { data, isLoading, isError, error, refetch, isFetching } = useDashboardSummaryQuery()

  const summary = data ?? {
    totalTickets: 0,
    openTickets: 0,
    inProgressTickets: 0,
    closedResolvedTickets: 0,
    overdueTickets: 0,
    priority: { high: 0, medium: 0, low: 0 },
  }

  const statusSegments = useMemo<RingSegment[]>(() => {
    return [
      {
        label: 'Open',
        value: summary.openTickets,
        colorClass: 'stroke-sky-500',
        trailClass: 'bg-sky-100 text-sky-700',
      },
      {
        label: 'In Progress',
        value: summary.inProgressTickets,
        colorClass: 'stroke-amber-500',
        trailClass: 'bg-amber-100 text-amber-800',
      },
      {
        label: 'Closed / Resolved',
        value: summary.closedResolvedTickets,
        colorClass: 'stroke-emerald-500',
        trailClass: 'bg-emerald-100 text-emerald-800',
      },
      {
        label: 'Overdue',
        value: summary.overdueTickets,
        colorClass: 'stroke-rose-500',
        trailClass: 'bg-rose-100 text-rose-800',
      },
    ]
  }, [summary.closedResolvedTickets, summary.inProgressTickets, summary.openTickets, summary.overdueTickets])

  const priorityRows = useMemo(
    () => [
      { label: 'High', value: summary.priority.high, barClass: 'bg-rose-500/85 text-rose-900' },
      { label: 'Medium', value: summary.priority.medium, barClass: 'bg-amber-400/90 text-amber-900' },
      { label: 'Low', value: summary.priority.low, barClass: 'bg-emerald-500/80 text-emerald-900' },
    ],
    [summary.priority.high, summary.priority.low, summary.priority.medium],
  )

  const totalStatus = statusSegments.reduce((acc, item) => acc + item.value, 0)
  const priorityPeak = Math.max(...priorityRows.map((item) => item.value), 1)

  if (isLoading) {
    return <DashboardSkeleton />
  }

  if (isError) {
    return (
      <section className="space-y-4">
        <header>
          <h1 className="font-serif text-3xl tracking-tight">Operations Dashboard</h1>
          <p className="text-sm text-muted-foreground">Real-time summary for ticket health and team throughput.</p>
        </header>
        <Card className="border-rose-200 bg-rose-50/60">
          <CardHeader className="space-y-2">
            <div className="flex items-center gap-2 text-rose-700">
              <AlertTriangle className="h-5 w-5" />
              <CardTitle>Unable to load dashboard</CardTitle>
            </div>
            <CardDescription className="text-rose-700/90">
              {(error as Error)?.message ?? 'Something went wrong while fetching summary data.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <Button onClick={() => void refetch()}>Retry</Button>
          </CardContent>
        </Card>
      </section>
    )
  }

  let progressOffset = 0
  const circumference = 2 * Math.PI * 42

  return (
    <section className="space-y-6 pb-4">
      <header className="rounded-xl border border-border/70 bg-gradient-to-br from-slate-50 to-slate-100/70 p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1">
            <h1 className="font-serif text-3xl tracking-tight text-slate-900">Operations Dashboard</h1>
            <p className="max-w-2xl text-sm text-slate-600">
              Snapshot of ticket flow, SLA pressure, and priority distribution to support faster decisions.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button asChild variant="outline">
              <Link to="/tickets/create">Create Ticket</Link>
            </Button>
            <Button asChild>
              <Link to="/tickets">
                View All Tickets
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
        {isFetching ? <p className="mt-3 text-xs text-muted-foreground">Refreshing latest metrics...</p> : null}
      </header>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <SummaryCard
          title="Total Tickets"
          value={summary.totalTickets}
          icon={Ticket}
          toneClass="bg-slate-500/70"
          helper="Overall workload"
          trendPercent={summary.trends?.totalTicketsPct}
        />
        <SummaryCard
          title="Open Tickets"
          value={summary.openTickets}
          icon={FolderOpen}
          toneClass="bg-sky-500/80"
          helper="Awaiting assignment or work"
          trendPercent={summary.trends?.openTicketsPct}
        />
        <SummaryCard
          title="In Progress"
          value={summary.inProgressTickets}
          icon={Wrench}
          toneClass="bg-amber-500/90"
          helper="Actively being resolved"
          trendPercent={summary.trends?.inProgressTicketsPct}
        />
        <SummaryCard
          title="Closed / Resolved"
          value={summary.closedResolvedTickets}
          icon={CircleCheckBig}
          toneClass="bg-emerald-500/90"
          helper="Healthy completion trend"
          trendPercent={summary.trends?.closedResolvedTicketsPct}
        />
        <SummaryCard
          title="Overdue"
          value={summary.overdueTickets}
          icon={Clock3}
          toneClass="bg-rose-500/90"
          helper="Needs immediate action"
          trendPercent={summary.trends?.overdueTicketsPct}
          lowerIsBetter
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Ticket Distribution by Status</CardTitle>
            <CardDescription>Donut chart of current status split</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6 md:grid-cols-[220px_minmax(0,1fr)] md:items-center">
            <div className="mx-auto">
              <svg viewBox="0 0 100 100" className="h-56 w-56 -rotate-90">
                <circle cx="50" cy="50" r="42" className="fill-none stroke-muted/60" strokeWidth="11" />
                {statusSegments.map((segment) => {
                  const segmentLength = totalStatus > 0 ? (segment.value / totalStatus) * circumference : 0
                  const currentOffset = progressOffset
                  progressOffset += segmentLength
                  return (
                    <circle
                      key={segment.label}
                      cx="50"
                      cy="50"
                      r="42"
                      className={`fill-none ${segment.colorClass}`}
                      strokeWidth="11"
                      strokeLinecap="butt"
                      strokeDasharray={`${segmentLength} ${circumference}`}
                      strokeDashoffset={-currentOffset}
                    />
                  )
                })}
                <circle cx="50" cy="50" r="30" className="fill-background" />
                <text x="50" y="47" textAnchor="middle" className="rotate-90 fill-muted-foreground text-[7px] font-medium">
                  TOTAL
                </text>
                <text x="50" y="58" textAnchor="middle" className="rotate-90 fill-foreground text-[13px] font-semibold">
                  {formatNumber(totalStatus)}
                </text>
              </svg>
            </div>

            <div className="space-y-3">
              {statusSegments.map((segment) => (
                <div key={segment.label} className="flex items-center justify-between gap-3 rounded-lg border bg-background px-3 py-2">
                  <div className="flex items-center gap-2">
                    <span className={`inline-block h-2.5 w-2.5 rounded-full ${segment.colorClass.replace('stroke-', 'bg-')}`} />
                    <span className="text-sm">{segment.label}</span>
                  </div>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${segment.trailClass}`}>
                    {formatNumber(segment.value)}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Priority Breakdown</CardTitle>
            <CardDescription>Bar chart for high, medium, and low urgency</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {priorityRows.map((item) => (
              <div key={item.label} className="space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-foreground">{item.label}</span>
                  <span className="text-muted-foreground">{formatNumber(item.value)}</span>
                </div>
                <div className="h-2.5 rounded-full bg-muted">
                  <div
                    className={`h-full rounded-full transition-[width] duration-500 ${item.barClass}`}
                    style={{
                      width: `${(item.value / priorityPeak) * 100}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </section>
  )
}
