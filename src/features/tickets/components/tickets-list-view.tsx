import { useMemo, useState, type CSSProperties, type MouseEvent } from 'react'
import { useMutation } from '@tanstack/react-query'
import { AgGridReact } from 'ag-grid-react'
import {
  AllCommunityModule,
  ModuleRegistry,
  type ColDef,
  type ICellRendererParams,
} from 'ag-grid-community'
import { AlertTriangle, ArrowRight, Calendar, Inbox, Trash2, User } from 'lucide-react'
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
import { ticketsService } from '@/features/tickets/api/tickets.service'
import type { Ticket } from '@/features/tickets/types/ticket'
import { ShareTicketButton } from '@/features/tickets/components/share-ticket-button'
import { TicketMobileCard, TicketMobileCardSkeleton } from '@/features/tickets/components/ticket-mobile-card'
import {
  compareTicketsNewestFirst,
  formatSlaDueAt,
  toTicketGridRow,
  type TicketGridRow,
} from '@/features/tickets/utils/ticket-list-model'
import { getTicketDetailsPath } from '@/features/tickets/utils/ticket-routes'
import { useCurrentUser } from '@/hooks/use-current-user'
import { useDarkMode } from '@/hooks/use-dark-mode'
import { queryClient } from '@/lib/query/query-client'
import { cn } from '@/lib/utils'

import 'ag-grid-community/styles/ag-grid.css'
import 'ag-grid-community/styles/ag-theme-quartz.css'
import '@/features/tickets/styles/tickets-grid.css'

ModuleRegistry.registerModules([AllCommunityModule])

function TitleCell({ data, value }: ICellRendererParams<TicketGridRow>) {
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

function TicketNumberCell({ value }: ICellRendererParams<TicketGridRow>) {
  return <span className="ticket-grid__ticket-number">{value}</span>
}

function BusNumberCell({ value }: ICellRendererParams<TicketGridRow>) {
  return <span className="ticket-grid__bus-badge">{value}</span>
}

function PersonCell({ value }: ICellRendererParams<TicketGridRow>) {
  const isUnassigned = value === 'Unassigned' || value === 'Unknown'

  return (
    <span className={`ticket-grid__person ${isUnassigned ? 'ticket-grid__person--empty' : ''}`}>
      <User className="ticket-grid__person-icon" />
      {value}
    </span>
  )
}

function SlaCell({ data }: ICellRendererParams<TicketGridRow>) {
  if (!data) return null

  const formatted = formatSlaDueAt(data.slaDueAt)
  const isOverdue = data.isOverdue

  return (
    <span className={`ticket-grid__sla-badge ${isOverdue ? 'ticket-grid__sla-badge--overdue' : ''}`}>
      {isOverdue ? <AlertTriangle className="ticket-grid__sla-icon" /> : <Calendar className="ticket-grid__sla-icon" />}
      {formatted}
    </span>
  )
}

function SeverityCell({ value }: ICellRendererParams<TicketGridRow>) {
  const severity = String(value ?? 'LOW').toUpperCase()

  return (
    <span className={`ticket-grid__severity-badge ticket-grid__severity-badge--${severity.toLowerCase()}`}>
      {severity}
    </span>
  )
}

function ViewTicketButtonCell({ data }: ICellRendererParams<TicketGridRow>) {
  const navigate = useNavigate()

  if (!data?.id) {
    return null
  }

  return (
    <Button
      size="sm"
      className="ticket-grid__action-btn"
      onClick={(event) => {
        event.stopPropagation()
        navigate(getTicketDetailsPath(data.id))
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
      <h3 className="ticket-grid-empty__title">No tickets found</h3>
      <p className="ticket-grid-empty__description">
        {description ?? 'When tickets match this view, they will appear here.'}
      </p>
    </div>
  )
}

type TicketsListViewProps = {
  tickets: Ticket[]
  isLoading: boolean
  isError: boolean
  error: Error | null
  emptyDescription?: string
  invalidateQueryKeys?: Array<readonly unknown[]>
}

export function TicketsListView({
  tickets,
  isLoading,
  isError,
  error,
  emptyDescription,
  invalidateQueryKeys = [['tickets']],
}: TicketsListViewProps) {
  const isDarkMode = useDarkMode()
  const navigate = useNavigate()
  const currentUser = useCurrentUser()
  const canDeleteTicket = currentUser?.role === 'ADMIN' || currentUser?.role === 'SUPERVISOR'
  const [deleteTarget, setDeleteTarget] = useState<TicketGridRow | null>(null)

  const rowData = useMemo(
    () => [...tickets].sort(compareTicketsNewestFirst).map(toTicketGridRow),
    [tickets],
  )

  const deleteMutation = useMutation({
    mutationFn: (ticketId: string) => ticketsService.remove(ticketId),
    onSuccess: () => {
      toast.success('Ticket deleted successfully.')
      for (const queryKey of invalidateQueryKeys) {
        queryClient.invalidateQueries({ queryKey })
      }
      setDeleteTarget(null)
    },
    onError: (mutationError) => {
      toast.error(mutationError instanceof Error ? mutationError.message : 'Failed to delete ticket.')
    },
  })

  function openDeleteDialog(ticket: TicketGridRow, event: MouseEvent<HTMLButtonElement>) {
    event.stopPropagation()
    setDeleteTarget(ticket)
  }

  function confirmDelete() {
    if (!deleteTarget) return
    deleteMutation.mutate(deleteTarget.id)
  }

  const columnDefs = useMemo<Array<ColDef<TicketGridRow>>>(
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
        field: 'ticketNumber',
        headerName: 'Ticket #',
        headerClass: 'ticket-grid__header-cell',
        cellRenderer: TicketNumberCell,
        minWidth: 100,
        maxWidth: 120,
        sortable: true,
        filter: true,
      },
      {
        field: 'title',
        headerName: 'Title',
        headerClass: 'ticket-grid__header-cell',
        cellRenderer: TitleCell,
        minWidth: 240,
        flex: 2.5,
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
        field: 'createdBy',
        headerName: 'Created By',
        headerClass: 'ticket-grid__header-cell',
        cellRenderer: PersonCell,
        minWidth: 160,
        flex: 1,
        filter: true,
      },
      {
        field: 'assignedTo',
        headerName: 'Assigned To',
        headerClass: 'ticket-grid__header-cell',
        cellRenderer: PersonCell,
        minWidth: 160,
        flex: 1,
        filter: true,
      },
      {
        field: 'slaDueAt',
        headerName: 'Due Date',
        headerClass: 'ticket-grid__header-cell',
        cellRenderer: SlaCell,
        minWidth: 190,
        flex: 1.2,
        sortable: true,
        filter: true,
        comparator: (valueA: string, valueB: string) => {
          const dateA = new Date(valueA).getTime() || 0
          const dateB = new Date(valueB).getTime() || 0
          return dateA - dateB
        },
      },
      {
        field: 'severity',
        headerName: 'Severity',
        headerClass: 'ticket-grid__header-cell',
        cellRenderer: SeverityCell,
        minWidth: 140,
        maxWidth: 160,
        sortable: true,
        filter: true,
      },
      {
        headerName: '',
        field: 'id',
        headerClass: 'ticket-grid__header-cell ticket-grid__header-cell--actions',
        cellClass: 'ticket-grid__actions-cell',
        minWidth: canDeleteTicket ? 280 : 200,
        maxWidth: canDeleteTicket ? 320 : 240,
        sortable: false,
        filter: false,
        floatingFilter: false,
        cellRenderer: (params: ICellRendererParams<TicketGridRow>) => (
          <div className="flex items-center justify-end gap-2">
            <ViewTicketButtonCell {...params} />
            {params.data?.id ? (
              <ShareTicketButton
                ticketId={params.data.id}
                ticketNumber={params.data.ticketNumber !== '—' ? params.data.ticketNumber : undefined}
                title={params.data.title}
                className="ticket-grid__share-btn"
              />
            ) : null}
            {canDeleteTicket && params.data?.id ? (
              <Button
                size="sm"
                variant="destructive"
                className="border-red-600 bg-red-600 text-white hover:bg-red-700"
                onClick={(event) => openDeleteDialog(params.data as TicketGridRow, event)}
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </Button>
            ) : null}
          </div>
        ),
      },
    ],
    [canDeleteTicket],
  )

  const gridStyle: CSSProperties = {
    '--ag-font-family': 'inherit',
  } as CSSProperties

  return (
    <>
      {isLoading ? (
        <>
          <div className="ticket-mobile-list md:hidden">
            {Array.from({ length: 5 }).map((_, index) => (
              <TicketMobileCardSkeleton key={index} />
            ))}
          </div>
          <div className="hidden md:block">
            <TableSkeleton />
          </div>
        </>
      ) : null}

      {isError ? (
        <Card className="ticket-page__error">
          <AlertTriangle className="ticket-page__error-icon" />
          <div>
            <p className="ticket-page__error-title">Failed to load tickets</p>
            <p className="ticket-page__error-message">{error?.message ?? 'An unexpected error occurred.'}</p>
          </div>
        </Card>
      ) : null}

      {!isLoading && !isError && rowData.length === 0 ? <EmptyState description={emptyDescription} /> : null}

      {!isLoading && !isError && rowData.length > 0 ? (
        <>
          <div className="ticket-mobile-list md:hidden">
            {rowData.map((row) => (
              <TicketMobileCard
                key={row.id}
                ticketId={row.id}
                ticketNumber={row.ticketNumber}
                title={row.title}
                busNumber={row.busNumber}
                createdBy={row.createdBy}
                assignedTo={row.assignedTo}
                severity={row.severity}
                slaLabel={formatSlaDueAt(row.slaDueAt)}
                isOverdue={row.isOverdue}
                showDelete={canDeleteTicket}
                onView={() => navigate(getTicketDetailsPath(row.id))}
                onDelete={(event) => openDeleteDialog(row, event)}
              />
            ))}
          </div>

          <Card className="ticket-grid-wrapper hidden md:block">
            <div
              className={cn(isDarkMode ? 'ag-theme-quartz-dark' : 'ag-theme-quartz', 'ticket-grid')}
              style={gridStyle}
            >
              <AgGridReact<TicketGridRow>
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
                getRowClass={(params) => (params.data?.isOverdue ? 'ticket-grid__row--overdue' : '')}
                onRowClicked={(event) => {
                  const clickTarget = event.event?.target as HTMLElement | null
                  if (clickTarget?.closest('button')) {
                    return
                  }
                  if (event.data?.id) {
                    navigate(getTicketDetailsPath(event.data.id))
                  }
                }}
              />
            </div>
          </Card>
        </>
      ) : null}

      <AlertDialog open={Boolean(deleteTarget)} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete ticket?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget
                ? `This will permanently remove "${deleteTarget.title}". This action cannot be undone.`
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
