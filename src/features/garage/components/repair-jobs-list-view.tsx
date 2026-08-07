import { useMemo, useState, type CSSProperties, type MouseEvent } from 'react'
import { useMutation } from '@tanstack/react-query'
import { AgGridReact } from 'ag-grid-react'
import {
  AllCommunityModule,
  ModuleRegistry,
  type ColDef,
  type ICellRendererParams,
} from 'ag-grid-community'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { AlertTriangle, ArrowRight, Inbox, Pencil, Trash2, User, Wrench } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { toast } from '@/lib/toast'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { garageService } from '@/features/garage/api/garage.service'
import { JobMobileCard, JobMobileCardSkeleton } from '@/features/garage/components/job-mobile-card'
import type { RepairJob } from '@/features/garage/types/job'
import {
  compareJobsNewestFirst,
  getPrioritySeverityClass,
  toJobGridRow,
  type JobGridRow,
} from '@/features/garage/utils/job-list-model'
import { getJobDetailsPath, getJobEditPath } from '@/features/garage/utils/job-routes'
import { useDarkMode } from '@/hooks/use-dark-mode'
import { useIsMobile } from '@/hooks/use-mobile'
import { queryClient } from '@/lib/query/query-client'
import { cn } from '@/lib/utils'

import 'ag-grid-community/styles/ag-grid.css'
import 'ag-grid-community/styles/ag-theme-quartz.css'
import '@/features/tickets/styles/tickets-grid.css'

ModuleRegistry.registerModules([AllCommunityModule])

const easeOutExpo = [0.22, 1, 0.36, 1] as const

const mobileListVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.07, delayChildren: 0.04 },
  },
  exit: {
    transition: { staggerChildren: 0.03, staggerDirection: -1 },
  },
}

const mobileItemVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.97 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.4, ease: easeOutExpo },
  },
  exit: {
    opacity: 0,
    y: -10,
    scale: 0.98,
    transition: { duration: 0.2, ease: 'easeIn' as const },
  },
}

function JobNumberCell({ value }: ICellRendererParams<JobGridRow>) {
  return <span className="ticket-grid__ticket-number">{value}</span>
}

function DescriptionCell({ data, value }: ICellRendererParams<JobGridRow>) {
  if (!data) return null

  return (
    <TooltipProvider delayDuration={400}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="ticket-grid__title-text">{value}</span>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-xs">
          <p>{value}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

function BusNumberCell({ value }: ICellRendererParams<JobGridRow>) {
  return <span className="ticket-grid__bus-badge">{value}</span>
}

function PersonCell({ value }: ICellRendererParams<JobGridRow>) {
  const isEmpty = value === 'Unassigned' || value === 'Unknown'

  return (
    <span className={`ticket-grid__person ${isEmpty ? 'ticket-grid__person--empty' : ''}`}>
      <User className="ticket-grid__person-icon" />
      {value}
    </span>
  )
}

function PriorityCell({ data }: ICellRendererParams<JobGridRow>) {
  if (!data) return null
  const severityClass = getPrioritySeverityClass(data.priorityRaw)

  return (
    <span className={`ticket-grid__severity-badge ticket-grid__severity-badge--${severityClass}`}>
      {data.priority.toUpperCase()}
    </span>
  )
}

function StatusCell({ value }: ICellRendererParams<JobGridRow>) {
  return <span className="ticket-grid__person capitalize">{value}</span>
}

function CategoryCell({ value }: ICellRendererParams<JobGridRow>) {
  return (
    <span className="ticket-grid__person">
      <Wrench className="ticket-grid__person-icon" />
      {value}
    </span>
  )
}

function ViewJobButtonCell({ data }: ICellRendererParams<JobGridRow>) {
  const navigate = useNavigate()

  if (!data?.id) return null

  return (
    <Button
      size="sm"
      className="ticket-grid__action-btn"
      onClick={(event) => {
        event.stopPropagation()
        navigate(getJobDetailsPath(data.id))
      }}
    >
      <span>View</span>
      <ArrowRight className="ticket-grid__action-icon" />
    </Button>
  )
}

function TableSkeleton() {
  return (
    <div className="ticket-grid-skeleton">
      <div className="ticket-grid-skeleton__header">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="ticket-grid-skeleton__header-cell" />
        ))}
      </div>
      <div className="ticket-grid-skeleton__body">
        {Array.from({ length: 8 }).map((_, rowIdx) => (
          <div key={rowIdx} className="ticket-grid-skeleton__row" style={{ animationDelay: `${rowIdx * 60}ms` }}>
            {Array.from({ length: 8 }).map((_, colIdx) => (
              <Skeleton
                key={colIdx}
                className={`ticket-grid-skeleton__cell ${colIdx === 1 ? 'ticket-grid-skeleton__cell--wide' : ''}`}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

function EmptyState({ description }: { description?: string }) {
  return (
    <div className="ticket-grid-empty">
      <div className="ticket-grid-empty__icon-wrapper">
        <Inbox className="ticket-grid-empty__icon" strokeWidth={1.2} />
      </div>
      <h3 className="ticket-grid-empty__title">No repair jobs found</h3>
      <p className="ticket-grid-empty__description">
        {description ?? 'When repair jobs are logged, they will appear here.'}
      </p>
    </div>
  )
}

type RepairJobsListViewProps = {
  jobs: RepairJob[]
  isLoading: boolean
  isError: boolean
  error: Error | null
  emptyDescription?: string
  canEdit?: boolean
  canDelete?: boolean
}

export function RepairJobsListView({
  jobs,
  isLoading,
  isError,
  error,
  emptyDescription,
  canEdit = false,
  canDelete = false,
}: RepairJobsListViewProps) {
  const isDarkMode = useDarkMode()
  const navigate = useNavigate()
  const isMobile = useIsMobile()
  const shouldReduceMotion = useReducedMotion()
  const animateMobile = isMobile && !shouldReduceMotion
  const [deleteTarget, setDeleteTarget] = useState<JobGridRow | null>(null)

  const rowData = useMemo(() => [...jobs].sort(compareJobsNewestFirst).map(toJobGridRow), [jobs])

  const deleteMutation = useMutation({
    mutationFn: (jobId: string) => garageService.deleteJob(jobId),
    onSuccess: () => {
      toast.success('Repair job deleted successfully.')
      queryClient.invalidateQueries({ queryKey: ['garage', 'jobs'] })
      setDeleteTarget(null)
    },
    onError: (mutationError) => {
      toast.error(mutationError instanceof Error ? mutationError.message : 'Failed to delete repair job.')
    },
  })

  function openDeleteDialog(job: JobGridRow, event: MouseEvent<HTMLButtonElement>) {
    event.stopPropagation()
    setDeleteTarget(job)
  }

  function confirmDelete() {
    if (!deleteTarget) return
    deleteMutation.mutate(deleteTarget.id)
  }

  const columnDefs = useMemo<Array<ColDef<JobGridRow>>>(
    () => [
      {
        field: 'createdAt',
        hide: true,
        sortable: true,
        sort: 'desc',
        comparator: (valueA: string, valueB: string) => {
          const dateA = new Date(valueA).getTime() || 0
          const dateB = new Date(valueB).getTime() || 0
          return dateA - dateB
        },
      },
      {
        field: 'jobIdNumber',
        headerName: 'Job #',
        headerClass: 'ticket-grid__header-cell',
        cellRenderer: JobNumberCell,
        minWidth: 100,
        maxWidth: 120,
        sortable: true,
        filter: true,
      },
      {
        field: 'description',
        headerName: 'Description',
        headerClass: 'ticket-grid__header-cell',
        cellRenderer: DescriptionCell,
        minWidth: 220,
        flex: 2,
        sortable: true,
        filter: true,
      },
      {
        field: 'busNumber',
        headerName: 'Bus',
        headerClass: 'ticket-grid__header-cell',
        cellRenderer: BusNumberCell,
        minWidth: 120,
        maxWidth: 140,
        filter: true,
      },
      {
        field: 'category',
        headerName: 'Category',
        headerClass: 'ticket-grid__header-cell',
        cellRenderer: CategoryCell,
        minWidth: 160,
        flex: 1,
        filter: true,
      },
      {
        field: 'assignedTo',
        headerName: 'Assigned To',
        headerClass: 'ticket-grid__header-cell',
        cellRenderer: PersonCell,
        minWidth: 150,
        flex: 1,
        filter: true,
      },
      {
        field: 'priority',
        headerName: 'Priority',
        headerClass: 'ticket-grid__header-cell',
        cellRenderer: PriorityCell,
        minWidth: 120,
        maxWidth: 140,
        sortable: true,
        filter: true,
      },
      {
        field: 'status',
        headerName: 'Status',
        headerClass: 'ticket-grid__header-cell',
        cellRenderer: StatusCell,
        minWidth: 130,
        filter: true,
      },
      {
        headerName: '',
        field: 'id',
        headerClass: 'ticket-grid__header-cell ticket-grid__header-cell--actions',
        cellClass: 'ticket-grid__actions-cell',
        minWidth: 280,
        maxWidth: 320,
        sortable: false,
        filter: false,
        floatingFilter: false,
        cellRenderer: (params: ICellRendererParams<JobGridRow>) => (
          <div className="flex items-center justify-end gap-2">
            <ViewJobButtonCell {...params} />
            {canEdit && params.data?.id ? (
              <Button
                size="sm"
                className="ticket-grid__action-btn"
                onClick={(event) => {
                  event.stopPropagation()
                  navigate(getJobEditPath(params.data!.id))
                }}
              >
                <Pencil className="h-4 w-4" />
                Edit
              </Button>
            ) : null}
            {canDelete && params.data?.id ? (
              <Button
                size="sm"
                variant="destructive"
                className="border-red-600 bg-red-600 text-white hover:bg-red-700"
                onClick={(event) => openDeleteDialog(params.data as JobGridRow, event)}
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </Button>
            ) : null}
          </div>
        ),
      },
    ],
    [canDelete, canEdit, navigate],
  )

  const gridStyle: CSSProperties = {
    '--ag-font-family': 'inherit',
  } as CSSProperties

  return (
    <>
      <div className="md:hidden">
        <AnimatePresence mode="wait">
          {isLoading ? (
            <motion.div
              key="repair-jobs-mobile-loading"
              className="ticket-mobile-list"
              variants={animateMobile ? mobileListVariants : undefined}
              initial={animateMobile ? 'hidden' : false}
              animate={animateMobile ? 'visible' : undefined}
              exit={animateMobile ? 'exit' : undefined}
            >
              {Array.from({ length: 5 }).map((_, index) => (
                <motion.div key={index} variants={animateMobile ? mobileItemVariants : undefined}>
                  <JobMobileCardSkeleton />
                </motion.div>
              ))}
            </motion.div>
          ) : null}

          {!isLoading && !isError && rowData.length > 0 ? (
            <motion.div
              key="repair-jobs-mobile-data"
              className="ticket-mobile-list"
              variants={animateMobile ? mobileListVariants : undefined}
              initial={animateMobile ? 'hidden' : false}
              animate={animateMobile ? 'visible' : undefined}
              exit={animateMobile ? 'exit' : undefined}
            >
              {rowData.map((row, index) => (
                <motion.div
                  key={row.id}
                  variants={animateMobile ? mobileItemVariants : undefined}
                  layout={animateMobile}
                >
                  <JobMobileCard
                    jobId={row.id}
                    jobIdNumber={row.jobIdNumber}
                    description={row.description}
                    busNumber={row.busNumber}
                    category={row.category}
                    priority={row.priorityRaw}
                    status={row.status}
                    assignedTo={row.assignedTo}
                    createdBy={row.createdBy}
                    createdAt={row.createdAt}
                    animationDelay={animateMobile ? index * 0.05 : 0}
                    onView={() => navigate(getJobDetailsPath(row.id))}
                    onEdit={canEdit ? () => navigate(getJobEditPath(row.id)) : undefined}
                    onDelete={canDelete ? (event) => openDeleteDialog(row, event) : undefined}
                  />
                </motion.div>
              ))}
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>

      {isLoading ? (
        <div className="hidden md:block">
          <TableSkeleton />
        </div>
      ) : null}

      {isError ? (
        <Card className="ticket-page__error">
          <AlertTriangle className="ticket-page__error-icon" />
          <div>
            <p className="ticket-page__error-title">Failed to load repair jobs</p>
            <p className="ticket-page__error-message">{error?.message ?? 'An unexpected error occurred.'}</p>
          </div>
        </Card>
      ) : null}

      {!isLoading && !isError && rowData.length === 0 ? <EmptyState description={emptyDescription} /> : null}

      {!isLoading && !isError && rowData.length > 0 ? (
        <Card className="ticket-grid-wrapper hidden md:block">
          <div
            className={cn(isDarkMode ? 'ag-theme-quartz-dark' : 'ag-theme-quartz', 'ticket-grid')}
            style={gridStyle}
          >
            <AgGridReact<JobGridRow>
              rowData={rowData}
              columnDefs={columnDefs}
              defaultColDef={{
                sortable: true,
                filter: true,
                resizable: true,
                floatingFilter: true,
              }}
              rowSelection="single"
              animateRows
              suppressCellFocus
              domLayout="autoHeight"
              rowHeight={52}
              headerHeight={44}
              floatingFiltersHeight={44}
              onRowClicked={(event) => {
                const clickTarget = event.event?.target as HTMLElement | null
                if (clickTarget?.closest('button')) return
                if (event.data?.id) {
                  navigate(getJobDetailsPath(event.data.id))
                }
              }}
            />
          </div>
        </Card>
      ) : null}

      <AlertDialog open={Boolean(deleteTarget)} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete repair job?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget
                ? `This will remove job "${deleteTarget.jobIdNumber}". This action cannot be undone.`
                : 'This action cannot be undone.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="border-red-600 bg-red-600 text-white hover:bg-red-700"
              onClick={confirmDelete}
              disabled={deleteMutation.isPending}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
