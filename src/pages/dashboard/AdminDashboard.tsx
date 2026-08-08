import { useMemo, type ComponentType } from 'react'
import { Link } from 'react-router-dom'
import {
  AlertTriangle,
  ArrowRight,
  Bus,
  CircleCheckBig,
  ClipboardList,
  Clock3,
  FolderOpen,
  Loader2,
  Route,
  UserX,
  Users,
  Wrench,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import type { DashboardMasterCounts } from '@/features/dashboard/api/dashboard.service'
import { useDashboardMasterCountsQuery } from '@/features/dashboard/hooks/use-dashboard-master-counts-query'
import { useDashboardSummaryQuery } from '@/features/dashboard/hooks/use-dashboard-summary-query'
import { useDashboardWindowDays } from '@/features/dashboard/hooks/use-dashboard-window-days'
import {
  dashboardSummaryCardToFilter,
  getTicketsByStatusPath,
} from '@/features/tickets/utils/ticket-list-filter'
import { cn } from '@/lib/utils'

function formatNumber(value: number) {
  return new Intl.NumberFormat('en-IN').format(value)
}

type MasterStat = {
  id: string
  label: string
  value: number
  helper: string
  to: string
  icon: ComponentType<{ className?: string }>
}

type TicketMetric = {
  id: string
  label: string
  value: number
  helper: string
  icon: ComponentType<{ className?: string }>
  filterTitle?: string
}

function MasterStatLink({ item }: { item: MasterStat }) {
  const Icon = item.icon

  return (
    <Link
      to={item.to}
      className={cn(
        'group flex flex-col gap-3 rounded-lg border border-border bg-background p-4 transition-colors',
        'hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{item.label}</p>
          <p className="text-3xl font-semibold tracking-tight tabular-nums text-foreground">
            {formatNumber(item.value)}
          </p>
        </div>
        <span className="flex size-9 shrink-0 items-center justify-center rounded-md border border-border bg-muted text-muted-foreground">
          <Icon className="size-4" aria-hidden />
        </span>
      </div>
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground">{item.helper}</p>
        <span className="inline-flex items-center gap-1 text-xs font-medium text-foreground opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
          Open
          <ArrowRight className="size-3.5" aria-hidden />
        </span>
      </div>
    </Link>
  )
}

function TicketMetricCard({
  item,
  windowDays,
}: {
  item: TicketMetric
  windowDays: number
}) {
  const Icon = item.icon
  const filter = item.filterTitle ? dashboardSummaryCardToFilter(item.filterTitle) : null
  const content = (
    <>
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{item.label}</p>
          <p className="text-3xl font-semibold tracking-tight tabular-nums text-foreground">
            {formatNumber(item.value)}
          </p>
        </div>
        <span className="flex size-9 shrink-0 items-center justify-center rounded-md border border-border bg-muted text-muted-foreground">
          <Icon className="size-4" aria-hidden />
        </span>
      </div>
      <p className="text-xs text-muted-foreground">{item.helper}</p>
    </>
  )

  if (!filter) {
    return <div className="flex flex-col gap-3 rounded-lg border border-border bg-background p-4">{content}</div>
  }

  return (
    <Link
      to={getTicketsByStatusPath(filter, windowDays)}
      className={cn(
        'group flex flex-col gap-3 rounded-lg border border-border bg-background p-4 transition-colors',
        'hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
      )}
    >
      {content}
    </Link>
  )
}

function EmployeeBreakdown({
  driver,
  helper,
  staff,
  total,
}: {
  driver: number
  helper: number
  staff: number
  total: number
}) {
  const rows = [
    { label: 'Drivers', value: driver },
    { label: 'Helpers', value: helper },
    { label: 'Office staff', value: staff },
  ]
  const peak = Math.max(...rows.map((row) => row.value), 1)

  return (
    <div className="rounded-lg border border-border bg-background p-4 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <h2 className="text-base font-semibold text-foreground">Active employees</h2>
          <p className="text-sm text-muted-foreground">
            Counts include people without a leaving date only.
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Total</p>
          <p className="text-2xl font-semibold tabular-nums tracking-tight text-foreground">
            {formatNumber(total)}
          </p>
        </div>
      </div>

      <div className="mt-6 space-y-4">
        {rows.map((row) => (
          <div key={row.label} className="space-y-2">
            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="font-medium text-foreground">{row.label}</span>
              <span className="tabular-nums text-muted-foreground">{formatNumber(row.value)}</span>
            </div>
            <div className="h-2 rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-foreground/70 transition-[width] duration-300"
                style={{ width: `${(row.value / peak) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6">
        <Button asChild variant="outline" size="sm" className="gap-2">
          <Link to="/masters/employees">
            Manage employees
            <ArrowRight className="size-4" aria-hidden />
          </Link>
        </Button>
      </div>
    </div>
  )
}

function SectionError({
  title,
  message,
  onRetry,
}: {
  title: string
  message: string
  onRetry: () => void
}) {
  return (
    <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4">
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 size-5 shrink-0 text-destructive" aria-hidden />
        <div className="space-y-2">
          <p className="text-sm font-semibold text-foreground">{title}</p>
          <p className="text-sm text-muted-foreground">{message}</p>
          <Button type="button" size="sm" variant="outline" onClick={onRetry}>
            Retry
          </Button>
        </div>
      </div>
    </div>
  )
}

function buildMasterStats(data: DashboardMasterCounts | undefined): MasterStat[] {
  return [
    {
      id: 'service-for',
      label: 'Service for',
      value: data?.serviceFor ?? 0,
      helper: 'Master service categories',
      to: '/masters/service-for',
      icon: ClipboardList,
    },
    {
      id: 'bus-no',
      label: 'Bus no',
      value: data?.busNo ?? 0,
      helper: 'Registered buses',
      to: '/masters/bus-no',
      icon: Bus,
    },
    {
      id: 'service-no',
      label: 'Service no',
      value: data?.serviceNo ?? 0,
      helper: 'Active service numbers',
      to: '/masters/service-no',
      icon: Route,
    },
    {
      id: 'employees',
      label: 'Employees',
      value: data?.employees?.total ?? 0,
      helper: 'Active drivers, helpers, and staff',
      to: '/masters/employees',
      icon: Users,
    },
  ]
}

export function AdminDashboard() {
  const { windowDays } = useDashboardWindowDays()
  const masterCountsQuery = useDashboardMasterCountsQuery(true)
  const ticketSummaryQuery = useDashboardSummaryQuery(windowDays)

  const masterStats = useMemo(
    () => buildMasterStats(masterCountsQuery.data),
    [masterCountsQuery.data],
  )

  const ticketSummary = ticketSummaryQuery.data
  const unassignedOpenCount =
    ticketSummary && 'unassigned' in ticketSummary.queue.openByStatus
      ? (ticketSummary.queue.openByStatus.unassigned ?? 0)
      : (ticketSummary?.snapshot.unassignedOpenTickets ?? 0)

  const ticketMetrics = useMemo<TicketMetric[]>(() => {
    if (!ticketSummary) {
      return []
    }

    return [
      {
        id: 'total',
        label: 'Total tickets',
        value: ticketSummary.totalTickets,
        helper: 'Overall workload',
        icon: ClipboardList,
      },
      {
        id: 'open',
        label: 'Open tickets',
        value: ticketSummary.openTickets,
        helper: 'Awaiting assignment or work',
        icon: FolderOpen,
        filterTitle: 'Open Tickets',
      },
      {
        id: 'unassigned',
        label: 'Unassigned',
        value: unassignedOpenCount,
        helper: 'Open tickets without assignee',
        icon: UserX,
        filterTitle: 'Unassigned',
      },
      {
        id: 'in-progress',
        label: 'In progress',
        value: ticketSummary.inProgressTickets,
        helper: 'Actively being resolved',
        icon: Wrench,
        filterTitle: 'In Progress',
      },
      {
        id: 'closed',
        label: 'Closed / resolved',
        value: ticketSummary.closedResolvedTickets,
        helper: 'Completed work',
        icon: CircleCheckBig,
        filterTitle: 'Closed / Resolved',
      },
      {
        id: 'overdue',
        label: 'Overdue',
        value: ticketSummary.overdueTickets,
        helper: 'Needs immediate action',
        icon: Clock3,
        filterTitle: 'Overdue',
      },
    ]
  }, [ticketSummary, unassignedOpenCount])

  const employees = masterCountsQuery.data?.employees ?? {
    driver: 0,
    helper: 0,
    staff: 0,
    total: 0,
  }

  const masterCountsFailed = masterCountsQuery.isError && !masterCountsQuery.data
  const ticketSummaryFailed = ticketSummaryQuery.isError && !ticketSummaryQuery.data
  const showMasterSkeleton = masterCountsQuery.isLoading && !masterCountsQuery.data
  const showTicketSkeleton = ticketSummaryQuery.isLoading && !ticketSummaryQuery.data

  return (
    <section className="mx-auto flex w-full max-w-7xl flex-col gap-8 pb-4">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Dashboard</p>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">Operations overview</h1>
          <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
            Review master data totals and ticket health. Use the cards below to jump into the module
            you need.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {(masterCountsQuery.isFetching || ticketSummaryQuery.isFetching) &&
          !showMasterSkeleton &&
          !showTicketSkeleton ? (
            <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
              <Loader2 className="size-3.5 animate-spin" aria-hidden />
              Updating
            </span>
          ) : null}
          <Button asChild variant="outline" size="sm" className="gap-2">
            <Link to="/garage/repair-tracking">
              <Wrench className="size-4" aria-hidden />
              Repair tracking
            </Link>
          </Button>
          <Button asChild size="sm" className="gap-2">
            <Link to="/tickets">
              View tickets
              <ArrowRight className="size-4" aria-hidden />
            </Link>
          </Button>
        </div>
      </header>

      <div className="space-y-4">
        <div className="space-y-1">
          <h2 className="text-xl font-semibold text-foreground">Master inventory</h2>
          <p className="text-sm text-muted-foreground">Live counts from masters records.</p>
        </div>

        {masterCountsFailed ? (
          <SectionError
            title="Unable to load master counts"
            message={
              (masterCountsQuery.error as Error)?.message ??
              'Something went wrong while fetching master inventory.'
            }
            onRetry={() => void masterCountsQuery.refetch()}
          />
        ) : showMasterSkeleton ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="h-32 w-full rounded-lg" />
            ))}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {masterStats.map((item) => (
              <MasterStatLink key={item.id} item={item} />
            ))}
          </div>
        )}
      </div>

      <Separator />

      <div className="space-y-4">
        <div className="space-y-1">
          <h2 className="text-xl font-semibold text-foreground">Ticket health</h2>
          <p className="text-sm text-muted-foreground">Open workload and completion across the team.</p>
        </div>

        {ticketSummaryFailed ? (
          <SectionError
            title="Unable to load ticket summary"
            message={
              (ticketSummaryQuery.error as Error)?.message ??
              'Something went wrong while fetching ticket metrics.'
            }
            onRetry={() => void ticketSummaryQuery.refetch()}
          />
        ) : showTicketSkeleton ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            {Array.from({ length: 6 }).map((_, index) => (
              <Skeleton key={index} className="h-28 w-full rounded-lg" />
            ))}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            {ticketMetrics.map((item) => (
              <TicketMetricCard key={item.id} item={item} windowDays={windowDays} />
            ))}
          </div>
        )}
      </div>

      {!masterCountsFailed && !showMasterSkeleton ? (
        <>
          <Separator />
          <EmployeeBreakdown
            driver={employees.driver}
            helper={employees.helper}
            staff={employees.staff}
            total={employees.total}
          />
        </>
      ) : null}
    </section>
  )
}
