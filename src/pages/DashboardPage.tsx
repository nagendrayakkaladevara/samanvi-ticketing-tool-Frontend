import { useMutation } from '@tanstack/react-query'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Label, Pie, PieChart } from 'recharts'
import {
  AlertTriangle,
  ArrowRight,
  CalendarDays,
  CircleCheckBig,
  Clock3,
  FolderOpen,
  Gauge,
  Loader2,
  Search,
  ShieldCheck,
  Siren,
  Ticket,
  X,
  TrendingDown,
  TrendingUp,
  UserX,
  Wrench,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { ticketsService } from '@/features/tickets/api/tickets.service'
import { getTicketDetailsPath } from '@/features/tickets/utils/ticket-routes'
import { useDashboardSummaryQuery } from '@/features/dashboard/hooks/use-dashboard-summary-query'
import { toast } from '@/lib/toast'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'

const HEADER_ACTIONS_ENTER_EASE = [0.16, 1, 0.3, 1] as const
const HEADER_ACTIONS_EXIT_EASE = [0.4, 0, 1, 1] as const

const headerActionsLayoutTransition = {
  layout: { type: 'spring' as const, stiffness: 380, damping: 32, mass: 0.85 },
}

function getHeaderActionsPanelVariants(reduceMotion: boolean | null) {
  if (reduceMotion) {
    return {
      initial: { opacity: 0 },
      animate: { opacity: 1, transition: { duration: 0.12 } },
      exit: { opacity: 0, transition: { duration: 0.1 } },
    }
  }

  return {
    initial: { opacity: 0, x: 6 },
    animate: {
      opacity: 1,
      x: 0,
      transition: { duration: 0.22, ease: HEADER_ACTIONS_ENTER_EASE },
    },
    exit: {
      opacity: 0,
      x: -4,
      transition: { duration: 0.16, ease: HEADER_ACTIONS_EXIT_EASE },
    },
  }
}

function getHeaderActionsPanelVariantsReverse(reduceMotion: boolean | null) {
  if (reduceMotion) {
    return getHeaderActionsPanelVariants(true)
  }

  return {
    initial: { opacity: 0, x: -6 },
    animate: {
      opacity: 1,
      x: 0,
      transition: { duration: 0.22, ease: HEADER_ACTIONS_ENTER_EASE },
    },
    exit: {
      opacity: 0,
      x: 4,
      transition: { duration: 0.16, ease: HEADER_ACTIONS_EXIT_EASE },
    },
  }
}

const WINDOW_DAYS_OPTIONS = [
  { value: 0, label: 'Today' },
  { value: 1, label: 'Last 1 day' },
  { value: 2, label: 'Last 2 days' },
  { value: 6, label: 'Last 6 days' },
  { value: 14, label: 'Last 14 days' },
  { value: 30, label: 'Last 30 days' },
  { value: 60, label: 'Last 60 days' },
  { value: 90, label: 'Last 90 days' },
] as const

const dashboardMetaPillClass =
  'flex w-full min-w-0 items-stretch overflow-hidden rounded-full border border-border bg-card/90 text-xs shadow-sm ring-1 ring-black/[0.03] dark:ring-white/[0.04] sm:inline-flex sm:w-auto'
const dashboardMetaLabelClass =
  'flex w-[7.125rem] shrink-0 items-center gap-1.5 border-r border-border px-3 py-1.5 font-medium text-muted-foreground sm:w-auto'
const dashboardMetaValueClass =
  'flex min-w-0 flex-1 items-center py-1.5 pl-2.5 pr-2 text-xs font-semibold text-foreground'

const QUEUE_STATUS_ORDER = ['created', 'unassigned', 'assigned', 'in_progress', 'reopened', 'blocked'] as const

type QueueStatusStyle = {
  rowClass: string
  trackClass: string
  barClass: string
}

const QUEUE_STATUS_STYLES: Record<string, QueueStatusStyle> = {
  created: {
    rowClass: 'border-slate-200/80 bg-slate-50/50 dark:border-slate-700/60 dark:bg-slate-900/40',
    trackClass: 'bg-slate-100 dark:bg-slate-800',
    barClass: 'bg-slate-500/85',
  },
  unassigned: {
    rowClass: 'border-orange-200/80 bg-orange-50/40 dark:border-orange-800/50 dark:bg-orange-950/30',
    trackClass: 'bg-orange-100 dark:bg-orange-950/50',
    barClass: 'bg-orange-500/85',
  },
  assigned: {
    rowClass: 'border-sky-200/80 bg-sky-50/40 dark:border-sky-800/50 dark:bg-sky-950/30',
    trackClass: 'bg-sky-100 dark:bg-sky-950/50',
    barClass: 'bg-sky-500/85',
  },
  in_progress: {
    rowClass: 'border-amber-200/80 bg-amber-50/40 dark:border-amber-800/50 dark:bg-amber-950/30',
    trackClass: 'bg-amber-100 dark:bg-amber-950/50',
    barClass: 'bg-amber-500/85',
  },
  reopened: {
    rowClass: 'border-violet-200/80 bg-violet-50/40 dark:border-violet-800/50 dark:bg-violet-950/30',
    trackClass: 'bg-violet-100 dark:bg-violet-950/50',
    barClass: 'bg-violet-500/85',
  },
  blocked: {
    rowClass: 'border-rose-200/80 bg-rose-50/40 dark:border-rose-800/50 dark:bg-rose-950/30',
    trackClass: 'bg-rose-100 dark:bg-rose-950/50',
    barClass: 'bg-rose-500/85',
  },
}

const DEFAULT_QUEUE_STATUS_STYLE: QueueStatusStyle = {
  rowClass: 'border-border/80 bg-muted/30',
  trackClass: 'bg-muted',
  barClass: 'bg-muted-foreground/70',
}

function getQueueStatusStyle(status: string): QueueStatusStyle {
  return QUEUE_STATUS_STYLES[status] ?? DEFAULT_QUEUE_STATUS_STYLE
}

function formatQueueStatusLabel(status: string) {
  return status.replaceAll('_', ' ')
}

function buildQueueStatusRows(openByStatus: Record<string, number>) {
  const keys = Object.keys(openByStatus)
  const orderedKeys = [
    ...QUEUE_STATUS_ORDER.filter((status) => keys.includes(status)),
    ...keys.filter((status) => !QUEUE_STATUS_ORDER.includes(status as (typeof QUEUE_STATUS_ORDER)[number])).sort(),
  ]

  return orderedKeys.map((status) => ({
    status,
    label: formatQueueStatusLabel(status),
    value: openByStatus[status] ?? 0,
    style: getQueueStatusStyle(status),
  }))
}

type StatusSegment = {
  status: keyof typeof STATUS_CHART_CONFIG
  label: string
  value: number
  trailClass: string
}

const STATUS_CHART_CONFIG = {
  tickets: {
    label: 'Tickets',
  },
  open: {
    label: 'Open',
    color: 'hsl(var(--chart-1))',
  },
  inProgress: {
    label: 'In Progress',
    color: 'hsl(var(--chart-2))',
  },
  closedResolved: {
    label: 'Closed / Resolved',
    color: 'hsl(var(--chart-3))',
  },
  overdue: {
    label: 'Overdue',
    color: 'hsl(var(--chart-4))',
  },
} satisfies ChartConfig

function formatNumber(value: number) {
  return new Intl.NumberFormat('en-IN').format(value)
}

function formatDateTime(iso?: string) {
  if (!iso) {
    return '-'
  }
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) {
    return '-'
  }
  return new Intl.DateTimeFormat('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date)
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
  const trendTextColor = trendIsGood
    ? 'text-emerald-700 dark:text-emerald-400'
    : 'text-rose-700 dark:text-rose-400'
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
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
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
  const navigate = useNavigate()
  const shouldReduceMotion = useReducedMotion()
  const [windowDays, setWindowDays] = useState(14)
  const [isTicketSearchOpen, setIsTicketSearchOpen] = useState(false)
  const [ticketNumberQuery, setTicketNumberQuery] = useState('')
  const { data, isLoading, isError, error, refetch, isFetching } = useDashboardSummaryQuery(windowDays)

  const searchTicketMutation = useMutation({
    mutationFn: async (ticketNumber: string) => ticketsService.searchByTicketNumber(ticketNumber),
    onSuccess: (ticket) => {
      navigate(getTicketDetailsPath(ticket.id))
    },
    onError: (mutationError) => {
      toast.error(mutationError instanceof Error ? mutationError.message : 'Unable to find ticket.')
    },
  })

  function handleTicketSearch() {
    if (searchTicketMutation.isPending) {
      return
    }

    const trimmedTicketNumber = ticketNumberQuery.trim()
    if (!/^\d{4}$/.test(trimmedTicketNumber)) {
      toast.error('Enter a valid 4-digit ticket number.')
      return
    }

    searchTicketMutation.mutate(trimmedTicketNumber)
  }

  function closeTicketSearch() {
    setIsTicketSearchOpen(false)
    setTicketNumberQuery('')
  }

  const summary = data ?? {
    totalTickets: 0,
    openTickets: 0,
    inProgressTickets: 0,
    closedResolvedTickets: 0,
    overdueTickets: 0,
    priority: { high: 0, medium: 0, low: 0 },
    meta: {
      scope: 'unknown',
    },
    snapshot: {
      newTicketsInWindow: 0,
      resolvedTicketsInWindow: 0,
      unassignedOpenTickets: 0,
      oldestOpenTicketAgeHours: 0,
      oldestOpenTicket: undefined,
    },
    queue: {
      openByStatus: {},
      openBySeverity: {},
    },
    sla: {
      overdueOpenCount: 0,
      atRiskOpenCount: 0,
      resolvedWithinSlaCount: 0,
      resolvedInWindowCount: 0,
      slaCompliancePercent: 0,
    },
    speed: {
      averageResolutionTimeHours: 0,
    },
    leaderboard: [],
  }

  const statusSegments = useMemo<StatusSegment[]>(() => {
    return [
      {
        status: 'open',
        label: 'Open',
        value: summary.openTickets,
        trailClass: 'bg-sky-100 text-sky-700 dark:bg-sky-950/50 dark:text-sky-300',
      },
      {
        status: 'inProgress',
        label: 'In Progress',
        value: summary.inProgressTickets,
        trailClass: 'bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300',
      },
      {
        status: 'closedResolved',
        label: 'Closed / Resolved',
        value: summary.closedResolvedTickets,
        trailClass: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300',
      },
      {
        status: 'overdue',
        label: 'Overdue',
        value: summary.overdueTickets,
        trailClass: 'bg-rose-100 text-rose-800 dark:bg-rose-950/50 dark:text-rose-300',
      },
    ]
  }, [summary.closedResolvedTickets, summary.inProgressTickets, summary.openTickets, summary.overdueTickets])

  const statusChartData = useMemo(
    () =>
      statusSegments.map((segment) => ({
        status: segment.status,
        tickets: segment.value,
        fill: `var(--color-${segment.status})`,
      })),
    [statusSegments],
  )

  const priorityRows = useMemo(
    () => [
      { label: 'High', value: summary.priority.high, barClass: 'bg-rose-500/85' },
      { label: 'Medium', value: summary.priority.medium, barClass: 'bg-amber-400/90' },
      { label: 'Low', value: summary.priority.low, barClass: 'bg-emerald-500/80' },
    ],
    [summary.priority.high, summary.priority.low, summary.priority.medium],
  )

  const totalStatus = statusSegments.reduce((acc, item) => acc + item.value, 0)
  const priorityPeak = Math.max(...priorityRows.map((item) => item.value), 1)
  const statusRows = useMemo(
    () => buildQueueStatusRows(summary.queue.openByStatus),
    [summary.queue.openByStatus],
  )
  const unassignedOpenCount =
    'unassigned' in summary.queue.openByStatus
      ? (summary.queue.openByStatus.unassigned ?? 0)
      : summary.snapshot.unassignedOpenTickets
  const severityRows = Object.entries(summary.queue.openBySeverity).map(([label, value]) => ({
    label,
    value,
  }))
  const statusPeak = Math.max(...statusRows.map((row) => row.value), 1)
  const severityPeak = Math.max(...severityRows.map((row) => row.value), 1)

  if (isLoading) {
    return <DashboardSkeleton />
  }

  if (isError) {
    return (
      <section className="space-y-4">
        <header>
          <h1 className="font-serif text-3xl tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground">Real-time summary for ticket health and team throughput.</p>
        </header>
        <Card className="border-rose-200 bg-rose-50/60 dark:border-rose-800/60 dark:bg-rose-950/40">
          <CardHeader className="space-y-2">
            <div className="flex items-center gap-2 text-rose-700 dark:text-rose-400">
              <AlertTriangle className="h-5 w-5" />
              <CardTitle>Unable to load dashboard</CardTitle>
            </div>
            <CardDescription className="text-rose-700/90 dark:text-rose-400/90">
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

  return (
    <section className="space-y-6 pb-4">
      <header className="relative isolate rounded-xl border border-border bg-gradient-to-br from-sky-500/10 via-background to-slate-500/10 p-5 shadow-sm">
        <motion.div
          aria-hidden
          className="pointer-events-none absolute inset-0 overflow-hidden rounded-xl"
        >
          <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-sky-400/20 blur-3xl dark:bg-sky-500/10" />
        </motion.div>
        <div className="relative flex w-full flex-wrap items-start justify-between gap-4">
          <div className="min-w-0 flex-1 basis-full space-y-1 sm:basis-auto">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-700 dark:text-sky-400">
              Operations
            </p>
            <h1 className="font-serif text-3xl tracking-tight text-foreground">Dashboard</h1>
            <p className="max-w-2xl text-sm text-muted-foreground">
              See ticket status, SLA deadlines, and priorities in one place.
            </p>
          </div>
          <motion.div
            layout
            transition={shouldReduceMotion ? { duration: 0 } : headerActionsLayoutTransition}
            className="flex min-h-9 w-full shrink-0 items-center justify-end gap-2 sm:w-auto"
          >
            <AnimatePresence mode="wait" initial={false}>
              {isTicketSearchOpen ? (
                <motion.div
                  key="ticket-search"
                  role="search"
                  aria-label="Search ticket by number"
                  {...getHeaderActionsPanelVariants(shouldReduceMotion)}
                  className="flex items-center gap-2"
                >
                  <Input
                    value={ticketNumberQuery}
                    onChange={(event) => setTicketNumberQuery(event.target.value.replace(/\D/g, '').slice(0, 4))}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') {
                        event.preventDefault()
                        handleTicketSearch()
                      }
                    }}
                    inputMode="numeric"
                    pattern="[0-9]{4}"
                    maxLength={4}
                    placeholder="Search ticket # (4 digits)"
                    aria-label="Search ticket by number"
                    className="w-44 border-input bg-background shadow-sm sm:w-52"
                    autoFocus
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleTicketSearch}
                    disabled={searchTicketMutation.isPending}
                    className="gap-2"
                  >
                    {searchTicketMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Search className="h-4 w-4" />
                    )}
                    Search
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={closeTicketSearch}
                    aria-label="Close ticket search"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </motion.div>
              ) : (
                <motion.div
                  key="ticket-actions"
                  {...getHeaderActionsPanelVariantsReverse(shouldReduceMotion)}
                  className="flex items-center gap-2"
                >
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => setIsTicketSearchOpen(true)}
                    aria-label="Search ticket by number"
                  >
                    <Search className="h-4 w-4" />
                  </Button>
                  <Button asChild variant="outline">
                    <Link to="/tickets/create">Create Ticket</Link>
                  </Button>
                  <Button asChild>
                    <Link to="/tickets">
                      View All Tickets
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
        <div className="mt-4 flex w-full flex-col gap-1.5 sm:flex-row sm:flex-wrap sm:items-center sm:gap-2">
          <div className={dashboardMetaPillClass}>
            <span className={dashboardMetaLabelClass}>
              <CalendarDays className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden />
              Period
            </span>
            <Select
              value={String(windowDays)}
              onValueChange={(value) => setWindowDays(Number(value))}
            >
              <SelectTrigger
                aria-label="Reporting period"
                className="h-auto min-w-0 flex-1 gap-1 rounded-none border-0 bg-transparent py-1.5 pl-2.5 pr-2 text-xs font-semibold text-foreground shadow-none transition-colors hover:bg-muted/60 focus:ring-0 focus:ring-offset-0 data-[state=open]:bg-muted/60 sm:min-w-[8.25rem] sm:flex-none"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent align="start" className="min-w-[10rem]">
                {WINDOW_DAYS_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={String(option.value)} className="text-xs">
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className={dashboardMetaPillClass}>
            <span className={dashboardMetaLabelClass}>
              {isFetching ? (
                <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-sky-600 dark:text-sky-400" aria-hidden />
              ) : (
                <Clock3 className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden />
              )}
              Updated
            </span>
            <span className={dashboardMetaValueClass}>
              {isFetching ? (
                <span className="font-normal text-muted-foreground">Updating metrics…</span>
              ) : (
                formatDateTime(summary.meta.generatedAt)
              )}
            </span>
          </div>
        </div>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6">
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
          title="Unassigned"
          value={unassignedOpenCount}
          icon={UserX}
          toneClass="bg-orange-500/90"
          helper="Open tickets without assignee"
          lowerIsBetter
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
            <ChartContainer
              config={STATUS_CHART_CONFIG}
              className="mx-auto aspect-square h-56 w-full max-w-[14rem]"
            >
              <PieChart>
                <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
                <Pie
                  data={statusChartData}
                  dataKey="tickets"
                  nameKey="status"
                  innerRadius={58}
                  outerRadius={84}
                  strokeWidth={4}
                >
                  <Label
                    content={({ viewBox }) => {
                      if (viewBox && 'cx' in viewBox && 'cy' in viewBox) {
                        return (
                          <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle" dominantBaseline="middle">
                            <tspan
                              x={viewBox.cx}
                              y={(viewBox.cy ?? 0) - 8}
                              className="fill-muted-foreground text-[10px] font-medium uppercase tracking-wider"
                            >
                              Total
                            </tspan>
                            <tspan
                              x={viewBox.cx}
                              y={(viewBox.cy ?? 0) + 14}
                              className="fill-foreground text-xl font-semibold"
                            >
                              {formatNumber(totalStatus)}
                            </tspan>
                          </text>
                        )
                      }
                      return null
                    }}
                  />
                </Pie>
              </PieChart>
            </ChartContainer>
            <div className="space-y-3">
              {statusSegments.map((segment) => (
                <div key={segment.label} className="flex items-center justify-between gap-3 rounded-lg border bg-background px-3 py-2">
                  <div className="flex items-center gap-2">
                    <span
                      className="inline-block h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: `var(--color-${segment.status})` }}
                    />
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

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              SLA Health
            </CardTitle>
            <CardDescription>Compliance and risk indicators</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center justify-between rounded-lg border bg-background px-3 py-2">
              <span className="text-muted-foreground">SLA Compliance</span>
              <span className="font-semibold">{summary.sla.slaCompliancePercent.toFixed(1)}%</span>
            </div>
            <div className="flex items-center justify-between rounded-lg border bg-background px-3 py-2">
              <span className="inline-flex items-center gap-1 text-muted-foreground">
                <Siren className="h-3.5 w-3.5 text-rose-600 dark:text-rose-400" />
                Overdue Open
              </span>
              <span className="font-semibold">{formatNumber(summary.sla.overdueOpenCount)}</span>
            </div>
            <div className="flex items-center justify-between rounded-lg border bg-background px-3 py-2">
              <span className="text-muted-foreground">At Risk Open</span>
              <span className="font-semibold">{formatNumber(summary.sla.atRiskOpenCount)}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Gauge className="h-4 w-4 text-sky-600 dark:text-sky-400" />
              Ticket Activity
            </CardTitle>
            <CardDescription>New tickets, resolved tickets, and average resolution time</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center justify-between rounded-lg border bg-background px-3 py-2">
              <span className="text-muted-foreground">New in Window</span>
              <span className="font-semibold">{formatNumber(summary.snapshot.newTicketsInWindow)}</span>
            </div>
            <div className="flex items-center justify-between rounded-lg border bg-background px-3 py-2">
              <span className="text-muted-foreground">Resolved in Window</span>
              <span className="font-semibold">{formatNumber(summary.snapshot.resolvedTicketsInWindow)}</span>
            </div>
            <div className="flex items-center justify-between rounded-lg border bg-background px-3 py-2">
              <span className="text-muted-foreground">Avg Resolution Time</span>
              <span className="font-semibold">{summary.speed.averageResolutionTimeHours.toFixed(1)}h</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserX className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              Open Tickets to Watch
            </CardTitle>
            <CardDescription>Unassigned tickets and the oldest open ticket</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center justify-between rounded-lg border bg-background px-3 py-2">
              <span className="text-muted-foreground">Unassigned Open</span>
              <span className="font-semibold">{formatNumber(unassignedOpenCount)}</span>
            </div>
            <div className="flex items-center justify-between rounded-lg border bg-background px-3 py-2">
              <span className="text-muted-foreground">Oldest Open Age</span>
              <span className="font-semibold">{summary.snapshot.oldestOpenTicketAgeHours.toFixed(1)}h</span>
            </div>
            <div className="rounded-lg border bg-background px-3 py-2">
              <p className="text-xs text-muted-foreground">Oldest Ticket</p>
              <p className="text-sm font-medium">
                #{summary.snapshot.oldestOpenTicket?.ticketNumber ?? '-'} ·{' '}
                {(summary.snapshot.oldestOpenTicket?.priority ?? '-').toUpperCase()} ·{' '}
                {(summary.snapshot.oldestOpenTicket?.status ?? '-').replaceAll('_', ' ')}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Open Tickets by Status</CardTitle>
            <CardDescription>How many open tickets are in each status</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {statusRows.length === 0 ? (
              <p className="text-sm text-muted-foreground">No status data available.</p>
            ) : (
              statusRows.map((row) => (
                <div key={row.status} className={`rounded border px-3 py-2 ${row.style.rowClass}`}>
                  <div className="mb-1.5 flex items-center justify-between text-sm">
                    <span className="capitalize">{row.label}</span>
                    <span className="font-semibold">{formatNumber(row.value)}</span>
                  </div>
                  <div className={`h-2 rounded-full ${row.style.trackClass}`}>
                    <div
                      className={`h-full rounded-full transition-[width] duration-500 ${row.style.barClass}`}
                      style={{ width: `${(row.value / statusPeak) * 100}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>By Severity</CardTitle>
            <CardDescription>Open issues by severity level</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {severityRows.length === 0 ? (
              <p className="text-sm text-muted-foreground">No severity data.</p>
            ) : (
              severityRows.map((row) => (
                <div key={row.label} className="rounded border px-3 py-2">
                  <div className="mb-1.5 flex items-center justify-between text-sm">
                    <span className="capitalize">{row.label}</span>
                    <span className="font-semibold">{formatNumber(row.value)}</span>
                  </div>
                  <div className="h-2 rounded-full bg-amber-100 dark:bg-amber-950/50">
                    <div
                      className="h-full rounded-full bg-amber-500/85 transition-[width] duration-500"
                      style={{ width: `${(row.value / severityPeak) * 100}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Agent Leaderboard</CardTitle>
            <CardDescription>Open assigned vs resolved in window</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {summary.leaderboard.length === 0 ? (
              <p className="text-sm text-muted-foreground">No leaderboard data available.</p>
            ) : (
              summary.leaderboard.slice(0, 6).map((agent) => (
                <div key={agent.userId} className="flex items-center justify-between rounded border px-3 py-2 text-sm">
                  <div>
                    <p className="font-medium">{agent.displayName}</p>
                    <p className="text-xs text-muted-foreground">@{agent.username}</p>
                  </div>
                  <div className="text-right">
                    <p>Open: {formatNumber(agent.openAssignedCount)}</p>
                    <p className="text-xs text-muted-foreground">Resolved: {formatNumber(agent.resolvedInWindow)}</p>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </section>
  )
}
