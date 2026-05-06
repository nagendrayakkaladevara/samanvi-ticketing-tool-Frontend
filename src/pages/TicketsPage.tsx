import { useMemo, useState, type CSSProperties, type MouseEvent } from 'react'
import { useMutation } from '@tanstack/react-query'
import { AgGridReact } from 'ag-grid-react'
import {
  AllCommunityModule,
  ModuleRegistry,
  type ColDef,
  type ICellRendererParams,
} from 'ag-grid-community'
import { AlertTriangle, ArrowRight, Calendar, Clock, Inbox, Loader2, Search, Trash2, User } from 'lucide-react'
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
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { ticketsService } from '@/features/tickets/api/tickets.service'
import { useTicketsQuery } from '@/features/tickets/hooks/use-tickets-query'
import type { Ticket } from '@/features/tickets/types/ticket'
import { getCreateTicketPath, getTicketDetailsPath } from '@/features/tickets/utils/ticket-routes'
import { useCurrentUser } from '@/hooks/use-current-user'
import { queryClient } from '@/lib/query/query-client'

import 'ag-grid-community/styles/ag-grid.css'
import 'ag-grid-community/styles/ag-theme-quartz.css'
import '@/features/tickets/styles/tickets-grid.css'

ModuleRegistry.registerModules([AllCommunityModule])

type TicketGridRow = {
  id: string
  title: string
  busNumber: string
  createdBy: string
  assignedTo: string
  severity: string
  slaDueAt: string
  isOverdue: boolean
}

function formatSlaDueAt(rawSlaDueAt: string): string {
  if (!rawSlaDueAt) {
    return 'No SLA'
  }

  const parsed = new Date(rawSlaDueAt)
  if (Number.isNaN(parsed.getTime())) {
    return 'No SLA'
  }

  return new Intl.DateTimeFormat(undefined, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(parsed)
}

function isSlaOverdue(rawSlaDueAt: string): boolean {
  if (!rawSlaDueAt) {
    return false
  }

  const parsed = new Date(rawSlaDueAt)
  if (Number.isNaN(parsed.getTime())) {
    return false
  }

  return parsed.getTime() < Date.now()
}

function toTicketGridRow(ticket: Ticket): TicketGridRow {
  return {
    id: ticket.id,
    title: ticket.title,
    busNumber: ticket.busNumber || 'N/A',
    createdBy: ticket.createdByName || 'Unknown',
    assignedTo: ticket.assignedToName || ticket.assignedToUserId || 'Unassigned',
    severity: ticket.severity,
    slaDueAt: ticket.slaDueAt,
    isOverdue: isSlaOverdue(ticket.slaDueAt),
  }
}

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
        {Array.from({ length: 7 }).map((_, i) => (
          <Skeleton key={i} className="ticket-grid-skeleton__header-cell" />
        ))}
      </div>
      <div className="ticket-grid-skeleton__body">
        {Array.from({ length: 8 }).map((_, rowIdx) => (
          <div key={rowIdx} className="ticket-grid-skeleton__row" style={{ animationDelay: `${rowIdx * 60}ms` }}>
            {Array.from({ length: 7 }).map((_, colIdx) => (
              <Skeleton
                key={colIdx}
                className={`ticket-grid-skeleton__cell ${colIdx === 0 ? 'ticket-grid-skeleton__cell--wide' : ''}`}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

function EmptyState() {
  return (
    <div className="ticket-grid-empty">
      <div className="ticket-grid-empty__icon-wrapper">
        <Inbox className="ticket-grid-empty__icon" strokeWidth={1.2} />
      </div>
      <h3 className="ticket-grid-empty__title">No tickets found</h3>
      <p className="ticket-grid-empty__description">
        When tickets are created, they will appear here. Check back later or adjust your filters.
      </p>
    </div>
  )
}

export function TicketsPage() {
  const { data: tickets = [], isLoading, isFetching, isError, error } = useTicketsQuery()
  const navigate = useNavigate()
  const currentUser = useCurrentUser()
  const canCreateTicket = currentUser?.role === 'ADMIN' || currentUser?.role === 'SUPERVISOR'
  const canDeleteTicket = currentUser?.role === 'ADMIN' || currentUser?.role === 'SUPERVISOR'
  const [deleteTarget, setDeleteTarget] = useState<TicketGridRow | null>(null)
  const [ticketNumberQuery, setTicketNumberQuery] = useState('')

  const rowData = useMemo(() => tickets.map(toTicketGridRow), [tickets])

  const deleteMutation = useMutation({
    mutationFn: (ticketId: string) => ticketsService.remove(ticketId),
    onSuccess: () => {
      toast.success('Ticket deleted successfully.')
      queryClient.invalidateQueries({ queryKey: ['tickets'] })
      setDeleteTarget(null)
    },
    onError: (mutationError) => {
      toast.error(mutationError instanceof Error ? mutationError.message : 'Failed to delete ticket.')
    },
  })

  const searchTicketMutation = useMutation({
    mutationFn: async (ticketNumber: string) => ticketsService.searchByTicketNumber(ticketNumber),
    onSuccess: (ticket) => {
      navigate(getTicketDetailsPath(ticket.id))
    },
    onError: (mutationError) => {
      toast.error(mutationError instanceof Error ? mutationError.message : 'Unable to find ticket.')
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

  function handleTicketSearch() {
    const trimmedTicketNumber = ticketNumberQuery.trim()
    if (!/^\d{4}$/.test(trimmedTicketNumber)) {
      toast.error('Enter a valid 4-digit ticket number.')
      return
    }

    searchTicketMutation.mutate(trimmedTicketNumber)
  }

  const columnDefs = useMemo<Array<ColDef<TicketGridRow>>>(
    () => [
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
        sort: 'asc',
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
        minWidth: canDeleteTicket ? 190 : 110,
        maxWidth: canDeleteTicket ? 220 : 120,
        sortable: false,
        filter: false,
        cellRenderer: (params: ICellRendererParams<TicketGridRow>) => (
          <div className="flex items-center justify-end gap-2">
            <ViewTicketButtonCell {...params} />
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
    <section className="ticket-page">
      <header className="ticket-page__header">
        <div className="ticket-page__header-content">
          <h1 className="ticket-page__title">Tickets</h1>
          <p className="ticket-page__subtitle">
            Track and manage active issues across your fleet
          </p>
        </div>
        <div className="ticket-page__header-actions">
          <div className="flex w-full max-w-sm items-center gap-2">
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
          </div>
          {canCreateTicket ? (
            <Button className="ticket-page__create-btn" onClick={() => navigate(getCreateTicketPath())}>
              Create Ticket
            </Button>
          ) : null}
          {isFetching && !isLoading ? (
            <div className="ticket-page__refresh-indicator">
              <Clock className="ticket-page__refresh-icon" />
              <span>Syncing...</span>
            </div>
          ) : null}
        </div>
      </header>

      {isLoading ? <TableSkeleton /> : null}

      {isError ? (
        <Card className="ticket-page__error">
          <AlertTriangle className="ticket-page__error-icon" />
          <div>
            <p className="ticket-page__error-title">Failed to load tickets</p>
            <p className="ticket-page__error-message">{(error as Error)?.message ?? 'An unexpected error occurred.'}</p>
          </div>
        </Card>
      ) : null}

      {!isLoading && !isError && rowData.length === 0 ? <EmptyState /> : null}

      {!isLoading && !isError && rowData.length > 0 ? (
        <Card className="ticket-grid-wrapper">
          <div className="ag-theme-quartz ticket-grid" style={gridStyle}>
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
              rowHeight={50}
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
    </section>
  )
}
