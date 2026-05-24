import { useMutation } from '@tanstack/react-query'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  dashboardSummaryCardToFilter,
  getTicketsByStatusPath,
  queueStatusToTicketListFilter,
} from '@/features/tickets/utils/ticket-list-filter'
import {
  AlertTriangle,
  ArrowRight,
  CalendarDays,
  CircleCheckBig,
  Clock3,
  FolderOpen,
  Loader2,
  Search,
  Ticket,
  X,
  TrendingDown,
  TrendingUp,
  UserX,
  Users,
  Wrench,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { ticketsService } from '@/features/tickets/api/tickets.service'
import { getTicketDetailsPath } from '@/features/tickets/utils/ticket-routes'
import type { DashboardLeaderboardAgent } from '@/features/dashboard/api/dashboard.service'
import { useDashboardSummaryQuery } from '@/features/dashboard/hooks/use-dashboard-summary-query'
import { useDashboardWindowDays } from '@/features/dashboard/hooks/use-dashboard-window-days'
import { toast } from '@/lib/toast'
import { cn } from '@/lib/utils'
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

type SeverityStyle = {
  rowClass: string
  trackClass: string
  barClass: string
}

const SEVERITY_STYLES: Record<string, SeverityStyle> = {
  critical: {
    rowClass: 'border-rose-200/80 bg-rose-50/40 dark:border-rose-800/50 dark:bg-rose-950/30',
    trackClass: 'bg-rose-100 dark:bg-rose-950/50',
    barClass: 'bg-rose-500/85',
  },
  high: {
    rowClass: 'border-orange-200/80 bg-orange-50/40 dark:border-orange-800/50 dark:bg-orange-950/30',
    trackClass: 'bg-orange-100 dark:bg-orange-950/50',
    barClass: 'bg-orange-500/85',
  },
  medium: {
    rowClass: 'border-amber-200/80 bg-amber-50/40 dark:border-amber-800/50 dark:bg-amber-950/30',
    trackClass: 'bg-amber-100 dark:bg-amber-950/50',
    barClass: 'bg-amber-500/85',
  },
  low: {
    rowClass: 'border-emerald-200/80 bg-emerald-50/40 dark:border-emerald-800/50 dark:bg-emerald-950/30',
    trackClass: 'bg-emerald-100 dark:bg-emerald-950/50',
    barClass: 'bg-emerald-500/80',
  },
}

const DEFAULT_SEVERITY_STYLE: SeverityStyle = {
  rowClass: 'border-border/80 bg-muted/30',
  trackClass: 'bg-muted',
  barClass: 'bg-muted-foreground/70',
}

function getSeverityStyle(label: string): SeverityStyle {
  return SEVERITY_STYLES[label.toLowerCase()] ?? DEFAULT_SEVERITY_STYLE
}

const dashboardPanelCardClass =
  'flex h-full flex-col border-border/80 bg-card/95 shadow-sm'

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

function formatWindowLabel(days: number): string {
  if (days === 0) return 'today'
  if (days === 1) return 'the last 1 day'
  return `the last ${days} days`
}

function getAgentInitials(displayName: string, username: string): string {
  const parts = displayName
    .split(' ')
    .map((part) => part.trim())
    .filter(Boolean)

  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
  }

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase()
  }

  return username.slice(0, 2).toUpperCase()
}

function TeamPerformanceLeaderboard({
  agents,
  windowDays,
}: {
  agents: DashboardLeaderboardAgent[]
  windowDays: number
}) {
  const visibleAgents = useMemo(
    () =>
      [...agents]
        .sort((left, right) => {
          if (right.resolvedInWindow !== left.resolvedInWindow) {
            return right.resolvedInWindow - left.resolvedInWindow
          }
          if (left.openAssignedCount !== right.openAssignedCount) {
            return left.openAssignedCount - right.openAssignedCount
          }
          return left.displayName.localeCompare(right.displayName)
        })
        .slice(0, 6),
    [agents],
  )
  const totals = useMemo(() => {
    const totalOpen = visibleAgents.reduce((sum, agent) => sum + agent.openAssignedCount, 0)
    const totalResolved = visibleAgents.reduce((sum, agent) => sum + agent.resolvedInWindow, 0)

    return { totalOpen, totalResolved }
  }, [visibleAgents])

  const resolvedHeader =
    windowDays === 0 ? 'Resolved today' : windowDays === 1 ? 'Resolved (1d)' : `Resolved (${windowDays}d)`

  if (visibleAgents.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border/80 bg-muted/20 px-4 py-8 text-center sm:py-10">
        <Users className="mx-auto h-7 w-7 text-muted-foreground/70" aria-hidden />
        <p className="mt-2 text-sm font-medium">No team data for this period</p>
        <p className="mt-1 text-xs text-muted-foreground">Assign tickets to see member workload here.</p>
      </div>
    )
  }

  return (
    <div className="space-y-3 md:space-y-2.5">
      <div className="hidden grid-cols-[minmax(0,1fr)_4rem_5rem] gap-x-4 px-1 text-xs font-medium text-muted-foreground md:grid">
        <span>Member</span>
        <span className="text-right">Open</span>
        <span className="text-right">{resolvedHeader}</span>
      </div>

      <ul className="space-y-3 md:space-y-2" role="list">
        {visibleAgents.map((agent) => (
          <li
            key={agent.userId}
            className="rounded-xl border border-border/70 bg-muted/20 p-4 transition-colors hover:bg-muted/35 md:grid md:grid-cols-[minmax(0,1fr)_4rem_5rem] md:items-center md:gap-x-4 md:p-3"
          >
            <div className="flex min-w-0 items-center gap-3">
              <div
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-background text-sm font-semibold text-foreground ring-1 ring-border/80"
                aria-hidden
              >
                {getAgentInitials(agent.displayName, agent.username)}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium leading-snug">{agent.displayName}</p>
                <p className="truncate text-xs text-muted-foreground">@{agent.username}</p>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3 md:mt-0 md:contents">
              <div className="rounded-lg border border-border/60 bg-background/80 px-3 py-3 text-center md:rounded-none md:border-0 md:bg-transparent md:px-0 md:py-0 md:text-right">
                <p className="text-xs font-medium text-muted-foreground md:sr-only">Open</p>
                <p className="mt-1 text-xl font-semibold tabular-nums leading-none md:mt-0 md:text-base">
                  {formatNumber(agent.openAssignedCount)}
                </p>
              </div>
              <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-3 py-3 text-center md:rounded-none md:border-0 md:bg-transparent md:px-0 md:py-0 md:text-right">
                <p className="text-xs font-medium text-muted-foreground md:sr-only">Resolved</p>
                <p className="mt-1 text-xl font-semibold tabular-nums leading-none text-emerald-700 dark:text-emerald-400 md:mt-0 md:text-base">
                  {formatNumber(agent.resolvedInWindow)}
                </p>
              </div>
            </div>
          </li>
        ))}
      </ul>

      <div className="space-y-1 text-xs leading-relaxed text-muted-foreground md:space-y-0">
        <p className="md:hidden">
          <span className="font-medium text-foreground">{formatNumber(totals.totalOpen)}</span> open ·{' '}
          <span className="font-medium text-emerald-700 dark:text-emerald-400">
            {formatNumber(totals.totalResolved)}
          </span>{' '}
          resolved ({formatWindowLabel(windowDays)})
        </p>
        <p className="md:hidden">
          {visibleAgents.length} team member{visibleAgents.length === 1 ? '' : 's'}
          {agents.length > visibleAgents.length ? ` · top ${visibleAgents.length} shown` : null}
        </p>
        <p className="hidden md:block">
          <span className="font-medium text-foreground">{formatNumber(totals.totalOpen)}</span> open across{' '}
          {visibleAgents.length} member{visibleAgents.length === 1 ? '' : 's'}
          <span className="mx-1.5 text-border">·</span>
          <span className="font-medium text-emerald-700 dark:text-emerald-400">{formatNumber(totals.totalResolved)}</span>{' '}
          resolved in {formatWindowLabel(windowDays)}
          {agents.length > visibleAgents.length ? (
            <>
              <span className="mx-1.5 text-border">·</span>
              Top {visibleAgents.length} shown
            </>
          ) : null}
        </p>
      </div>
    </div>
  )
}

function SummaryCard({
  title,
  value,
  icon: Icon,
  toneClass,
  helper,
  trendPercent,
  lowerIsBetter,
  onClick,
}: {
  title: string
  value: number
  icon: React.ComponentType<{ className?: string }>
  toneClass: string
  helper: string
  trendPercent?: number
  lowerIsBetter?: boolean
  onClick?: () => void
}) {
  const hasTrend = typeof trendPercent === 'number' && Number.isFinite(trendPercent)
  const isPositive = (trendPercent ?? 0) >= 0
  const trendIsGood = hasTrend ? (lowerIsBetter ? !isPositive : isPositive) : true
  const trendTextColor = trendIsGood
    ? 'text-emerald-700 dark:text-emerald-400'
    : 'text-rose-700 dark:text-rose-400'
  const TrendIcon = isPositive ? TrendingUp : TrendingDown
  const isInteractive = typeof onClick === 'function'

  return (
    <Card
      className={cn(
        'relative overflow-hidden border-border/80 bg-card/95 shadow-sm',
        isInteractive &&
          'cursor-pointer transition-shadow hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
      )}
      role={isInteractive ? 'button' : undefined}
      tabIndex={isInteractive ? 0 : undefined}
      onClick={onClick}
      onKeyDown={
        isInteractive
          ? (event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault()
                onClick()
              }
            }
          : undefined
      }
    >
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
      <div className="grid gap-4 lg:grid-cols-2 lg:gap-5 xl:grid-cols-12 xl:gap-6">
        <Card className={`${dashboardPanelCardClass} xl:col-span-4`}>
          <CardHeader>
            <Skeleton className="h-5 w-40" />
          </CardHeader>
          <CardContent className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-11 w-full" />
            ))}
          </CardContent>
        </Card>
        <Card className={`${dashboardPanelCardClass} xl:col-span-8`}>
          <CardHeader>
            <Skeleton className="h-5 w-48" />
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2 xl:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-11 w-full" />
            ))}
          </CardContent>
        </Card>
        <Card className={`${dashboardPanelCardClass} xl:col-span-4`}>
          <CardHeader>
            <Skeleton className="h-5 w-32" />
          </CardHeader>
          <CardContent className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-11 w-full" />
            ))}
          </CardContent>
        </Card>
        <Card className={`${dashboardPanelCardClass} lg:col-span-2 xl:col-span-8`}>
          <CardHeader>
            <Skeleton className="h-5 w-44" />
            <Skeleton className="mt-2 h-3 w-72 max-w-full" />
          </CardHeader>
          <CardContent className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-[7.25rem] w-full rounded-xl md:h-14" />
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
  const { windowDays, setWindowDays } = useDashboardWindowDays()
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

  const priorityRows = useMemo(
    () => [
      { label: 'High', value: summary.priority.high, barClass: 'bg-rose-500/85' },
      { label: 'Medium', value: summary.priority.medium, barClass: 'bg-amber-400/90' },
      { label: 'Low', value: summary.priority.low, barClass: 'bg-emerald-500/80' },
    ],
    [summary.priority.high, summary.priority.low, summary.priority.medium],
  )

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
    style: getSeverityStyle(label),
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
    <section
      className={`space-y-6 pb-4 transition-opacity duration-200${isFetching && !isLoading ? ' opacity-60' : ''}`}
    >
      <header className="relative isolate overflow-hidden rounded-xl border border-border bg-gradient-to-br from-sky-500/10 via-background to-slate-500/10 p-5 shadow-sm">
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
            className="flex min-h-9 w-full min-w-0 max-w-full shrink-0 items-center justify-end gap-2 sm:w-auto"
          >
            <AnimatePresence mode="wait" initial={false}>
              {isTicketSearchOpen ? (
                <motion.div
                  key="ticket-search"
                  role="search"
                  aria-label="Search ticket by number"
                  {...getHeaderActionsPanelVariants(shouldReduceMotion)}
                  className="flex w-full min-w-0 max-w-full flex-wrap items-center justify-end gap-2 sm:flex-nowrap"
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
                    className="min-w-0 flex-1 border-input bg-background shadow-sm sm:w-44 sm:flex-none md:w-52"
                    autoFocus
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleTicketSearch}
                    disabled={searchTicketMutation.isPending}
                    aria-label="Search ticket"
                    className="shrink-0 gap-2 px-2.5 sm:px-4"
                  >
                    {searchTicketMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Search className="h-4 w-4" />
                    )}
                    <span className="hidden sm:inline">Search</span>
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={closeTicketSearch}
                    aria-label="Close ticket search"
                    className="shrink-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </motion.div>
              ) : (
                <motion.div
                  key="ticket-actions"
                  {...getHeaderActionsPanelVariantsReverse(shouldReduceMotion)}
                  className="flex w-full min-w-0 max-w-full flex-wrap items-center justify-end gap-2"
                >
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => setIsTicketSearchOpen(true)}
                    aria-label="Search ticket by number"
                    className="shrink-0"
                  >
                    <Search className="h-4 w-4" />
                  </Button>
                  <Button asChild variant="outline" size="sm" className="shrink-0 sm:h-9 sm:px-4 sm:text-sm">
                    <Link to="/tickets/create">
                      <span className="sm:hidden">Create</span>
                      <span className="hidden sm:inline">Create Ticket</span>
                    </Link>
                  </Button>
                  <Button asChild size="sm" className="shrink-0 sm:h-9 sm:px-4 sm:text-sm">
                    <Link to="/tickets">
                      <span className="sm:hidden">Tickets</span>
                      <span className="hidden sm:inline">View All Tickets</span>
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
          onClick={() => {
            const filter = dashboardSummaryCardToFilter('Open Tickets')
            if (filter) navigate(getTicketsByStatusPath(filter, windowDays))
          }}
        />
        <SummaryCard
          title="Unassigned"
          value={unassignedOpenCount}
          icon={UserX}
          toneClass="bg-orange-500/90"
          helper="Open tickets without assignee"
          lowerIsBetter
          onClick={() => {
            const filter = dashboardSummaryCardToFilter('Unassigned')
            if (filter) navigate(getTicketsByStatusPath(filter, windowDays))
          }}
        />
        <SummaryCard
          title="In Progress"
          value={summary.inProgressTickets}
          icon={Wrench}
          toneClass="bg-amber-500/90"
          helper="Actively being resolved"
          trendPercent={summary.trends?.inProgressTicketsPct}
          onClick={() => {
            const filter = dashboardSummaryCardToFilter('In Progress')
            if (filter) navigate(getTicketsByStatusPath(filter, windowDays))
          }}
        />
        <SummaryCard
          title="Closed / Resolved"
          value={summary.closedResolvedTickets}
          icon={CircleCheckBig}
          toneClass="bg-emerald-500/90"
          helper="Healthy completion trend"
          trendPercent={summary.trends?.closedResolvedTicketsPct}
          onClick={() => {
            const filter = dashboardSummaryCardToFilter('Closed / Resolved')
            if (filter) navigate(getTicketsByStatusPath(filter, windowDays))
          }}
        />
        <SummaryCard
          title="Overdue"
          value={summary.overdueTickets}
          icon={Clock3}
          toneClass="bg-rose-500/90"
          helper="Needs immediate action"
          trendPercent={summary.trends?.overdueTicketsPct}
          lowerIsBetter
          onClick={() => {
            const filter = dashboardSummaryCardToFilter('Overdue')
            if (filter) navigate(getTicketsByStatusPath(filter, windowDays))
          }}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2 lg:gap-5 xl:grid-cols-12 xl:gap-6">
        <Card className={cn(dashboardPanelCardClass, 'xl:col-span-4')}>
          <CardHeader className="pb-3">
            <CardTitle className="text-base xl:text-lg">Priority Breakdown</CardTitle>
            <CardDescription>High, medium, and low urgency tickets</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-1 flex-col justify-center space-y-4 xl:space-y-5">
            {priorityRows.map((item) => (
              <div key={item.label} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-foreground">{item.label}</span>
                  <span className="tabular-nums text-muted-foreground">{formatNumber(item.value)}</span>
                </div>
                <div className="h-2.5 rounded-full bg-muted xl:h-3">
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

        <Card className={cn(dashboardPanelCardClass, 'xl:col-span-8')}>
          <CardHeader className="pb-3">
            <CardTitle className="text-base xl:text-lg">Open Tickets by Status</CardTitle>
            <CardDescription>How many open tickets are in each status</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 space-y-2 sm:grid sm:grid-cols-2 sm:gap-3 sm:space-y-0 xl:gap-4">
            {statusRows.length === 0 ? (
              <p className="text-sm text-muted-foreground sm:col-span-2">No status data available.</p>
            ) : (
              statusRows.map((row) => {
                const listFilter = queueStatusToTicketListFilter(row.status)
                const isRowInteractive = listFilter !== null

                return (
                  <div
                    key={row.status}
                    role={isRowInteractive ? 'button' : undefined}
                    tabIndex={isRowInteractive ? 0 : undefined}
                    className={cn(
                      `rounded-lg border px-3 py-2.5 ${row.style.rowClass}`,
                      isRowInteractive &&
                        'cursor-pointer transition-shadow hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                    )}
                    onClick={
                      isRowInteractive
                        ? () => navigate(getTicketsByStatusPath(listFilter, windowDays))
                        : undefined
                    }
                    onKeyDown={
                      isRowInteractive
                        ? (event) => {
                            if (event.key === 'Enter' || event.key === ' ') {
                              event.preventDefault()
                              navigate(getTicketsByStatusPath(listFilter, windowDays))
                            }
                          }
                        : undefined
                    }
                  >
                    <div className="mb-2 flex items-center justify-between text-sm">
                      <span className="capitalize">{row.label}</span>
                      <span className="font-semibold tabular-nums">{formatNumber(row.value)}</span>
                    </div>
                    <div className={`h-2 rounded-full xl:h-2.5 ${row.style.trackClass}`}>
                      <div
                        className={`h-full rounded-full transition-[width] duration-500 ${row.style.barClass}`}
                        style={{ width: `${(row.value / statusPeak) * 100}%` }}
                      />
                    </div>
                  </div>
                )
              })
            )}
          </CardContent>
        </Card>

        <Card className={cn(dashboardPanelCardClass, 'xl:col-span-4')}>
          <CardHeader className="pb-3">
            <CardTitle className="text-base xl:text-lg">By Severity</CardTitle>
            <CardDescription>Open issues by severity level</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 space-y-2">
            {severityRows.length === 0 ? (
              <p className="text-sm text-muted-foreground">No severity data.</p>
            ) : (
              severityRows.map((row) => (
                <div key={row.label} className={`rounded-lg border px-3 py-2.5 ${row.style.rowClass}`}>
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span className="capitalize">{row.label}</span>
                    <span className="font-semibold tabular-nums">{formatNumber(row.value)}</span>
                  </div>
                  <div className={`h-2 rounded-full xl:h-2.5 ${row.style.trackClass}`}>
                    <div
                      className={`h-full rounded-full transition-[width] duration-500 ${row.style.barClass}`}
                      style={{ width: `${(row.value / severityPeak) * 100}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card className={cn(dashboardPanelCardClass, 'lg:col-span-2 xl:col-span-8')}>
          <CardHeader className="pb-3">
            <CardTitle className="text-base xl:text-lg">Team Performance</CardTitle>
            <CardDescription>Open workload and tickets resolved in {formatWindowLabel(windowDays)}</CardDescription>
          </CardHeader>
          <CardContent className="flex-1">
            <TeamPerformanceLeaderboard agents={summary.leaderboard} windowDays={windowDays} />
          </CardContent>
        </Card>
      </div>
    </section>
  )
}
