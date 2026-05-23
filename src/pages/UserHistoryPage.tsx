import { motion, useReducedMotion } from 'framer-motion'
import {
  ArrowLeft,
  AtSign,
  CalendarDays,
  Clock3,
  History,
  Loader2,
  RefreshCw,
  Shield,
  UserRound,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { ActivityFeed } from '@/features/user-history/components/activity-feed'
import { RecentTicketList } from '@/features/user-history/components/recent-ticket-list'
import { ResolvedPerDayChart } from '@/features/user-history/components/resolved-per-day-chart'
import { StatusBreakdownBars } from '@/features/user-history/components/status-breakdown-bars'
import { UserMetricsCards } from '@/features/user-history/components/user-metrics-cards'
import { UserTicketsDrilldown } from '@/features/user-history/components/user-tickets-drilldown'
import { useUserHistoryQuery } from '@/features/user-history/hooks/use-user-history-query'
import type { TicketStatusApi } from '@/features/user-history/types/user-history'
import { formatDateTime } from '@/features/user-history/utils/format'
import '@/features/user-history/styles/user-history.css'
import { cn } from '@/lib/utils'

const WINDOW_DAYS_OPTIONS = [
  { value: 0, label: 'Today' },
  { value: 1, label: 'Last 1 day' },
  { value: 7, label: 'Last 7 days' },
  { value: 14, label: 'Last 14 days' },
  { value: 30, label: 'Last 30 days' },
  { value: 60, label: 'Last 60 days' },
  { value: 90, label: 'Last 90 days' },
] as const

const metaPillClass =
  'flex w-full min-w-0 items-stretch overflow-hidden rounded-full border border-border bg-card/90 text-xs shadow-sm ring-1 ring-black/[0.03] dark:ring-white/[0.04] sm:inline-flex sm:w-auto'
const metaPillLabelClass =
  'flex shrink-0 items-center gap-1.5 border-r border-border px-3 py-1.5 font-medium text-muted-foreground'
const metaPillValueClass =
  'flex min-w-0 items-center py-1.5 pl-2.5 pr-2 text-xs font-semibold text-foreground'

type LocationState = {
  displayName?: string
  username?: string
}

function hasStatusBreakdown(breakdown: Partial<Record<TicketStatusApi, number>>): boolean {
  return Object.values(breakdown).some((count) => typeof count === 'number' && count > 0)
}

function RoleBadge({ code, label }: { code: string; label: string }) {
  const normalized = code.toLowerCase()

  return (
    <span
      className={cn(
        'user-history-hero__badge inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[0.65rem] font-bold uppercase',
        normalized === 'admin' && 'border-violet-300/70 bg-violet-50 text-violet-800 dark:bg-violet-950/40 dark:text-violet-200',
        normalized === 'supervisor' && 'border-sky-300/70 bg-sky-50 text-sky-800 dark:bg-sky-950/40 dark:text-sky-200',
        normalized === 'worker' && 'border-amber-300/70 bg-amber-50 text-amber-900 dark:bg-amber-950/40 dark:text-amber-100',
      )}
    >
      <Shield className="h-3 w-3" aria-hidden />
      {label}
    </span>
  )
}

function UserHistorySkeleton() {
  return (
    <section className="user-history-page space-y-6">
      <Skeleton className="h-32 w-full rounded-2xl" />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, index) => (
          <Skeleton key={index} className="h-28 rounded-xl" />
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Skeleton className="h-64 rounded-xl" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    </section>
  )
}

export function UserHistoryPage() {
  const navigate = useNavigate()
  const { userId = '' } = useParams()
  const location = useLocation()
  const locationState = (location.state as LocationState | null) ?? null
  const shouldReduceMotion = useReducedMotion()
  const [windowDays, setWindowDays] = useState(14)

  const { data, isLoading, isError, error, refetch, isFetching } = useUserHistoryQuery(userId, windowDays, 5)

  const heading = useMemo(() => {
    if (data?.user.displayName) return data.user.displayName
    if (locationState?.displayName) return locationState.displayName
    return 'User performance'
  }, [data?.user.displayName, locationState?.displayName])

  const username = data?.user.username ?? locationState?.username ?? userId

  const reveal = shouldReduceMotion
    ? {}
    : {
        initial: { opacity: 0, y: 12 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] as const },
      }

  if (!userId) {
    return (
      <section className="space-y-3">
        <p className="text-destructive font-medium">Missing user identifier.</p>
        <Button variant="outline" onClick={() => navigate('/users')}>
          Back to users
        </Button>
      </section>
    )
  }

  if (isLoading) {
    return <UserHistorySkeleton />
  }

  if (isError || !data) {
    return (
      <section className="space-y-4">
        <Button variant="ghost" className="-ml-3 w-fit" onClick={() => navigate('/users')}>
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Back to users
        </Button>
        <Card className="space-y-2 p-6">
          <p className="font-semibold text-destructive">Unable to load user history</p>
          <p className="text-sm text-muted-foreground">
            {(error as Error)?.message ?? 'The analytics snapshot could not be retrieved.'}
          </p>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4" aria-hidden />
            Retry
          </Button>
        </Card>
      </section>
    )
  }

  const { user, metrics, ticketCounts, ticketsByStatus, recent, generatedAt } = data
  const showCreatedByStatus = hasStatusBreakdown(ticketsByStatus.created)
  const windowLabel =
    metrics.window.days === 0
      ? 'Today (UTC)'
      : `Last ${metrics.window.days} day${metrics.window.days === 1 ? '' : 's'}`

  return (
    <motion.section className="user-history-page space-y-5 sm:space-y-6" {...reveal}>
      <header className="space-y-4">
        <Button variant="ghost" className="-ml-3 w-fit" onClick={() => navigate('/users')}>
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Back to users
        </Button>

        <div className="user-history-hero p-4 sm:p-6">
          <div className="flex min-w-0 items-start gap-3 sm:gap-4">
            <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border bg-muted/40 text-muted-foreground sm:h-12 sm:w-12 sm:rounded-2xl">
              <UserRound className="h-5 w-5 sm:h-6 sm:w-6" aria-hidden />
            </span>
            <div className="min-w-0 flex-1 space-y-1.5 sm:space-y-2">
              <div className="flex flex-col gap-1.5 min-[400px]:flex-row min-[400px]:flex-wrap min-[400px]:items-center min-[400px]:gap-2">
                <h1 className="text-xl font-semibold leading-tight tracking-tight break-words sm:text-3xl">
                  {heading}
                </h1>
                <RoleBadge code={user.role.code} label={user.role.label} />
              </div>
              <p className="inline-flex min-w-0 items-center gap-1.5 text-sm text-muted-foreground">
                <AtSign className="h-3.5 w-3.5 shrink-0" aria-hidden />
                <span className="truncate">{username}</span>
              </p>
              <p className="text-xs text-muted-foreground">{windowLabel}</p>
            </div>
          </div>

          <div className="mt-4 flex w-full flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
            <div className={metaPillClass}>
              <span className={metaPillLabelClass}>
                <CalendarDays className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden />
                Period
              </span>
              <Select value={String(windowDays)} onValueChange={(value) => setWindowDays(Number(value))}>
                <SelectTrigger
                  aria-label="Reporting period"
                  className="h-auto w-[9.25rem] shrink-0 gap-1 rounded-none border-0 bg-transparent py-1.5 pl-2.5 pr-2 text-xs font-semibold text-foreground shadow-none transition-colors hover:bg-muted/60 focus:ring-0 focus:ring-offset-0 data-[state=open]:bg-muted/60"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent align="start" className="min-w-[9.25rem]">
                  {WINDOW_DAYS_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={String(option.value)} className="text-xs">
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className={metaPillClass}>
              <span className={metaPillLabelClass}>
                {isFetching ? (
                  <Loader2
                    className="h-3.5 w-3.5 shrink-0 animate-spin text-sky-600 dark:text-sky-400"
                    aria-hidden
                  />
                ) : (
                  <Clock3 className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden />
                )}
                Updated
              </span>
              <span className={metaPillValueClass}>
                {isFetching ? (
                  <span className="font-normal text-muted-foreground">Updating…</span>
                ) : (
                  formatDateTime(generatedAt)
                )}
              </span>
            </div>

            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-9 w-9 shrink-0 self-end rounded-full sm:self-auto"
              onClick={() => refetch()}
              disabled={isFetching}
              aria-label="Refresh analytics"
            >
              <RefreshCw className={cn('h-4 w-4', isFetching && 'animate-spin')} aria-hidden />
            </Button>
          </div>

          <dl className="mt-5 grid gap-3 border-t border-border/60 pt-4 sm:grid-cols-3">
            <div className="rounded-lg bg-card/50 px-3 py-2">
              <dt className="text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Assigned
              </dt>
              <dd className="text-2xl font-semibold tabular-nums">{ticketCounts.assigned}</dd>
            </div>
            <div className="rounded-lg bg-card/50 px-3 py-2">
              <dt className="text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Created
              </dt>
              <dd className="text-2xl font-semibold tabular-nums">{ticketCounts.created}</dd>
            </div>
            <div className="rounded-lg bg-card/50 px-3 py-2">
              <dt className="text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Acted on
              </dt>
              <dd className="text-2xl font-semibold tabular-nums">{ticketCounts.actedOn}</dd>
            </div>
          </dl>
        </div>
      </header>

      <UserMetricsCards metrics={metrics} />

      <div
        className={cn(
          'grid gap-4',
          showCreatedByStatus ? 'lg:grid-cols-2' : 'lg:grid-cols-1',
        )}
      >
        <div className="space-y-4">
          <StatusBreakdownBars
            title="Assigned by status"
            description="Distribution of tickets assigned to this user"
            breakdown={ticketsByStatus.assigned}
          />
          <ResolvedPerDayChart data={metrics.assigned.resolvedPerDay} />
        </div>
        {showCreatedByStatus ? (
          <StatusBreakdownBars
            title="Created by status"
            description="Tickets this user filed"
            breakdown={ticketsByStatus.created}
          />
        ) : null}
      </div>

      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
        <History className="h-4 w-4" aria-hidden />
        Recent snapshot
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <RecentTicketList
          title="Recent assigned"
          description="Latest tickets currently or previously assigned"
          tickets={recent.assignedTickets}
          emptyMessage="No assigned tickets in the recent window."
        />
        <RecentTicketList
          title="Recent created"
          description="Tickets filed by this user"
          tickets={recent.createdTickets}
          emptyMessage="No created tickets in the recent window."
        />
      </div>

      <ActivityFeed
        title="Recent activity"
        description="Latest actions across tickets"
        items={recent.activity}
        emptyMessage="No recent activity recorded."
      />

      <UserTicketsDrilldown userId={userId} />
    </motion.section>
  )
}
