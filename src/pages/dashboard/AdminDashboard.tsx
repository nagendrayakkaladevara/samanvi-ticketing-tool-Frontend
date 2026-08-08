import { useMemo, type ComponentType } from 'react'
import { Link } from 'react-router-dom'
import {
  AlertTriangle,
  ArrowRight,
  Bus,
  ClipboardList,
  Loader2,
  Route,
  Users,
  Wrench,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { useDashboardMasterCountsQuery } from '@/features/dashboard/hooks/use-dashboard-master-counts-query'
import { useDashboardSummaryQuery } from '@/features/dashboard/hooks/use-dashboard-summary-query'
import { useDashboardWindowDays } from '@/features/dashboard/hooks/use-dashboard-window-days'
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

function TicketSnapshot({
  openTickets,
  unassigned,
  overdue,
  inProgress,
  isFetching,
}: {
  openTickets: number
  unassigned: number
  overdue: number
  inProgress: number
  isFetching: boolean
}) {
  const metrics = [
    { label: 'Open tickets', value: openTickets },
    { label: 'Unassigned', value: unassigned },
    { label: 'In progress', value: inProgress },
    { label: 'Overdue', value: overdue },
  ]

  return (
    <div className="rounded-lg border border-border bg-background p-4 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <h2 className="text-base font-semibold text-foreground">Ticket health</h2>
          <p className="text-sm text-muted-foreground">Current open workload across the team.</p>
        </div>
        {isFetching ? (
          <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
            <Loader2 className="size-3.5 animate-spin" aria-hidden />
            Updating
          </span>
        ) : null}
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {metrics.map((metric) => (
          <div key={metric.label} className="rounded-md border border-border px-3 py-3">
            <p className="text-xs text-muted-foreground">{metric.label}</p>
            <p className="mt-1 text-xl font-semibold tabular-nums tracking-tight text-foreground">
              {formatNumber(metric.value)}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        <Button asChild size="sm" className="gap-2">
          <Link to="/tickets">
            View tickets
            <ArrowRight className="size-4" aria-hidden />
          </Link>
        </Button>
        <Button asChild variant="outline" size="sm">
          <Link to="/tickets/create">Create ticket</Link>
        </Button>
      </div>
    </div>
  )
}

function AdminDashboardSkeleton() {
  return (
    <section className="mx-auto flex w-full max-w-7xl flex-col gap-8">
      <div className="space-y-2">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-9 w-56" />
        <Skeleton className="h-4 w-80 max-w-full" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-32 w-full rounded-lg" />
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Skeleton className="h-64 w-full rounded-lg" />
        <Skeleton className="h-64 w-full rounded-lg" />
      </div>
    </section>
  )
}

export function AdminDashboard() {
  const { windowDays } = useDashboardWindowDays()
  const masterCountsQuery = useDashboardMasterCountsQuery(true)
  const ticketSummaryQuery = useDashboardSummaryQuery(windowDays)

  const masterStats = useMemo<MasterStat[]>(() => {
    const data = masterCountsQuery.data
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
        value: data?.employees.total ?? 0,
        helper: 'Active drivers, helpers, and staff',
        to: '/masters/employees',
        icon: Users,
      },
    ]
  }, [masterCountsQuery.data])

  if (masterCountsQuery.isLoading) {
    return <AdminDashboardSkeleton />
  }

  if (masterCountsQuery.isError) {
    return (
      <section className="mx-auto flex w-full max-w-3xl flex-col gap-4">
        <header className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Dashboard</p>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">Operations overview</h1>
        </header>
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 size-5 shrink-0 text-destructive" aria-hidden />
            <div className="space-y-2">
              <p className="text-sm font-semibold text-foreground">Unable to load master counts</p>
              <p className="text-sm text-muted-foreground">
                {(masterCountsQuery.error as Error)?.message ??
                  'Something went wrong while fetching dashboard data.'}
              </p>
              <Button type="button" size="sm" onClick={() => void masterCountsQuery.refetch()}>
                Retry
              </Button>
            </div>
          </div>
        </div>
      </section>
    )
  }

  const employees = masterCountsQuery.data?.employees ?? {
    driver: 0,
    helper: 0,
    staff: 0,
    total: 0,
  }

  const ticketSummary = ticketSummaryQuery.data
  const unassignedOpenCount =
    ticketSummary && 'unassigned' in ticketSummary.queue.openByStatus
      ? (ticketSummary.queue.openByStatus.unassigned ?? 0)
      : (ticketSummary?.snapshot.unassignedOpenTickets ?? 0)

  return (
    <section
      className={cn(
        'mx-auto flex w-full max-w-7xl flex-col gap-8 pb-4 transition-opacity duration-150',
        masterCountsQuery.isFetching && !masterCountsQuery.isLoading ? 'opacity-70' : undefined,
      )}
    >
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Dashboard</p>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">Operations overview</h1>
          <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
            Review master data totals and open ticket health. Use the cards below to jump into the
            module you need.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
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
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {masterStats.map((item) => (
            <MasterStatLink key={item.id} item={item} />
          ))}
        </div>
      </div>

      <Separator />

      <div className="grid gap-4 lg:grid-cols-2 lg:gap-6">
        <EmployeeBreakdown
          driver={employees.driver}
          helper={employees.helper}
          staff={employees.staff}
          total={employees.total}
        />

        {ticketSummaryQuery.isError ? (
          <div className="rounded-lg border border-border bg-background p-4 sm:p-6">
            <h2 className="text-base font-semibold text-foreground">Ticket health</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Ticket summary is temporarily unavailable. Master counts above are still up to date.
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-4"
              onClick={() => void ticketSummaryQuery.refetch()}
            >
              Retry ticket summary
            </Button>
          </div>
        ) : ticketSummaryQuery.isLoading || !ticketSummary ? (
          <Skeleton className="h-64 w-full rounded-lg" />
        ) : (
          <TicketSnapshot
            openTickets={ticketSummary.openTickets}
            unassigned={unassignedOpenCount}
            overdue={ticketSummary.overdueTickets}
            inProgress={ticketSummary.inProgressTickets}
            isFetching={ticketSummaryQuery.isFetching}
          />
        )}
      </div>
    </section>
  )
}
