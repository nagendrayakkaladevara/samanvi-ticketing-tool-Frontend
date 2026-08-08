import { useMemo, type ComponentType } from 'react'
import { Link } from 'react-router-dom'
import { motion, useReducedMotion } from 'framer-motion'
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
  UserRound,
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

const EASE_OUT = [0.22, 1, 0.36, 1] as const

function getStaggerContainer(reduceMotion: boolean | null) {
  if (reduceMotion) {
    return {
      hidden: { opacity: 0 },
      visible: {
        opacity: 1,
        transition: { duration: 0.15 },
      },
    }
  }

  return {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.06,
        delayChildren: 0.04,
      },
    },
  }
}

function getStaggerItem(reduceMotion: boolean | null) {
  if (reduceMotion) {
    return {
      hidden: { opacity: 0 },
      visible: {
        opacity: 1,
        transition: { duration: 0.15 },
      },
    }
  }

  return {
    hidden: { opacity: 0, y: 12 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.35, ease: EASE_OUT },
    },
  }
}

function getSectionReveal(reduceMotion: boolean | null) {
  if (reduceMotion) {
    return {
      hidden: { opacity: 0 },
      visible: {
        opacity: 1,
        transition: { duration: 0.15 },
      },
    }
  }

  return {
    hidden: { opacity: 0, y: 14 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.4, ease: EASE_OUT },
    },
  }
}

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
        'group flex min-w-0 flex-col gap-2 rounded-lg border border-border bg-background p-3 transition-colors sm:gap-3 sm:p-4',
        'hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 space-y-1">
          <p className="truncate text-[11px] font-medium uppercase tracking-wide text-muted-foreground sm:text-xs">
            {item.label}
          </p>
          <p className="text-2xl font-semibold tracking-tight tabular-nums text-foreground sm:text-3xl">
            {formatNumber(item.value)}
          </p>
        </div>
        <span className="flex size-8 shrink-0 items-center justify-center rounded-md border border-border bg-muted text-muted-foreground sm:size-9">
          <Icon className="size-4" aria-hidden />
        </span>
      </div>
      <p className="line-clamp-2 text-[11px] leading-snug text-muted-foreground sm:text-xs">{item.helper}</p>
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
  const className = cn(
    'group flex min-w-0 flex-col gap-2 rounded-lg border border-border bg-background p-3 transition-colors sm:gap-3 sm:p-4',
    filter &&
      'hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
  )
  const content = (
    <>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 space-y-1">
          <p className="truncate text-[11px] font-medium uppercase tracking-wide text-muted-foreground sm:text-xs">
            {item.label}
          </p>
          <p className="text-2xl font-semibold tracking-tight tabular-nums text-foreground sm:text-3xl">
            {formatNumber(item.value)}
          </p>
        </div>
        <span className="flex size-8 shrink-0 items-center justify-center rounded-md border border-border bg-muted text-muted-foreground sm:size-9">
          <Icon className="size-4" aria-hidden />
        </span>
      </div>
      <p className="line-clamp-2 text-[11px] leading-snug text-muted-foreground sm:text-xs">{item.helper}</p>
    </>
  )

  if (!filter) {
    return <div className={className}>{content}</div>
  }

  return (
    <Link to={getTicketsByStatusPath(filter, windowDays)} className={className}>
      {content}
    </Link>
  )
}

function EmployeeBreakdown({
  driver,
  helper,
  staff,
  total,
  reduceMotion,
}: {
  driver: number
  helper: number
  staff: number
  total: number
  reduceMotion: boolean | null
}) {
  const rows = [
    { label: 'Drivers', value: driver, icon: UserRound },
    { label: 'Helpers', value: helper, icon: Users },
    { label: 'Office staff', value: staff, icon: ClipboardList },
  ]
  const sectionVariants = getSectionReveal(reduceMotion)
  const itemVariants = getStaggerItem(reduceMotion)
  const containerVariants = getStaggerContainer(reduceMotion)

  return (
    <motion.div
      className="space-y-4"
      variants={sectionVariants}
      initial="hidden"
      animate="visible"
    >
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-1">
          <h2 className="text-xl font-semibold text-foreground">Active employees</h2>
          <p className="text-sm text-muted-foreground">
            People currently on roster (no leaving date).
          </p>
        </div>
        <Button asChild variant="outline" size="sm" className="gap-2">
          <Link to="/masters/employees">
            Manage employees
            <ArrowRight className="size-4" aria-hidden />
          </Link>
        </Button>
      </div>

      <motion.div
        className="overflow-hidden rounded-lg border border-border"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div
          variants={itemVariants}
          className="flex items-center justify-between gap-3 border-b border-border bg-muted/40 px-4 py-3"
        >
          <div className="flex items-center gap-2">
            <span className="flex size-8 items-center justify-center rounded-md border border-border bg-background text-muted-foreground">
              <Users className="size-4" aria-hidden />
            </span>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Total active</p>
              <p className="text-sm text-muted-foreground">Across all employee types</p>
            </div>
          </div>
          <p className="text-2xl font-semibold tabular-nums tracking-tight text-foreground">
            {formatNumber(total)}
          </p>
        </motion.div>

        <div className="grid grid-cols-3 divide-x divide-border">
          {rows.map((row) => {
            const Icon = row.icon
            const share = total > 0 ? Math.round((row.value / total) * 100) : 0

            return (
              <motion.div
                key={row.label}
                variants={itemVariants}
                className="min-w-0 px-3 py-4 sm:px-4 sm:py-5"
              >
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Icon className="size-3.5 shrink-0" aria-hidden />
                  <p className="truncate text-[11px] font-medium uppercase tracking-wide sm:text-xs">
                    {row.label}
                  </p>
                </div>
                <p className="mt-2 text-xl font-semibold tabular-nums tracking-tight text-foreground sm:text-2xl">
                  {formatNumber(row.value)}
                </p>
                <p className="mt-1 text-[11px] text-muted-foreground sm:text-xs">{share}% of total</p>
              </motion.div>
            )
          })}
        </div>
      </motion.div>
    </motion.div>
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
  const shouldReduceMotion = useReducedMotion()
  const { windowDays } = useDashboardWindowDays()
  const masterCountsQuery = useDashboardMasterCountsQuery(true)
  const ticketSummaryQuery = useDashboardSummaryQuery(windowDays)
  const containerVariants = getStaggerContainer(shouldReduceMotion)
  const itemVariants = getStaggerItem(shouldReduceMotion)

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
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Dashboard</p>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">Operations overview</h1>
          <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
            Review master data totals and ticket health. Use the cards below to jump into the module
            you need.
          </p>
        </div>
        {(masterCountsQuery.isFetching || ticketSummaryQuery.isFetching) &&
        !showMasterSkeleton &&
        !showTicketSkeleton ? (
          <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
            <Loader2 className="size-3.5 animate-spin" aria-hidden />
            Updating
          </span>
        ) : null}
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
          <div className="grid grid-cols-2 gap-3 xl:grid-cols-4 xl:gap-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="h-28 w-full rounded-lg sm:h-32" />
            ))}
          </div>
        ) : (
          <motion.div
            key="master-inventory"
            className="grid grid-cols-2 gap-3 xl:grid-cols-4 xl:gap-4"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {masterStats.map((item) => (
              <motion.div key={item.id} variants={itemVariants}>
                <MasterStatLink item={item} />
              </motion.div>
            ))}
          </motion.div>
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
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6 xl:gap-4">
            {Array.from({ length: 6 }).map((_, index) => (
              <Skeleton key={index} className="h-28 w-full rounded-lg" />
            ))}
          </div>
        ) : (
          <motion.div
            key="ticket-health"
            className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6 xl:gap-4"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {ticketMetrics.map((item) => (
              <motion.div key={item.id} variants={itemVariants}>
                <TicketMetricCard item={item} windowDays={windowDays} />
              </motion.div>
            ))}
          </motion.div>
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
            reduceMotion={shouldReduceMotion}
          />
        </>
      ) : null}
    </section>
  )
}
