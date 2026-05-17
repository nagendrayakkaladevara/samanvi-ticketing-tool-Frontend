import { useMemo, useState, type MouseEvent } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
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
import { Card } from '@/components/ui/card'
import { ticketsService } from '@/features/tickets/api/tickets.service'
import type { Ticket, TicketStatus } from '@/features/tickets/types/ticket'
import { useTicketsQuery } from '@/features/tickets/hooks/use-tickets-query'
import { ShareTicketButton } from '@/features/tickets/components/share-ticket-button'
import { getTicketDetailsPath } from '@/features/tickets/utils/ticket-routes'
import { cn } from '@/lib/utils'
import { queryClient } from '@/lib/query/query-client'

const boardColumns: Array<{
  status: TicketStatus
  title: string
  accent: string
}> = [
  { status: 'CREATED', title: 'Created', accent: 'from-zinc-500 to-zinc-400' },
  { status: 'ASSIGNED', title: 'Assigned', accent: 'from-sky-500 to-cyan-400' },
  { status: 'IN_PROGRESS', title: 'In Progress', accent: 'from-violet-500 to-purple-400' },
  { status: 'RESOLVED', title: 'Resolved', accent: 'from-emerald-500 to-green-400' },
  { status: 'CLOSED', title: 'Closed', accent: 'from-rose-500 to-red-400' },
  { status: 'REOPENED', title: 'Reopened', accent: 'from-amber-500 to-orange-400' },
]

const updatableStatuses = new Set<TicketStatus>(['ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'])
type UpdatableStatus = 'ASSIGNED' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED'

function isUpdatableStatus(status: TicketStatus): status is UpdatableStatus {
  return updatableStatuses.has(status)
}

type PendingDrop = {
  ticket: Ticket
  targetStatus: TicketStatus
}

function isNoteRequiredForTransition(targetStatus: TicketStatus): boolean {
  return targetStatus === 'RESOLVED' || targetStatus === 'CLOSED'
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

export function BoardPage() {
  const navigate = useNavigate()
  const { data: tickets = [], isLoading, isFetching, isError, error } = useTicketsQuery()
  const [draggedTicketId, setDraggedTicketId] = useState<string | null>(null)
  const [hoveredStatus, setHoveredStatus] = useState<TicketStatus | null>(null)
  const [pendingDrop, setPendingDrop] = useState<PendingDrop | null>(null)
  const [transitionNote, setTransitionNote] = useState('')

  const ticketsByStatus = useMemo(() => {
    return boardColumns.reduce(
      (acc, column) => {
        acc[column.status] = tickets.filter((ticket) => ticket.status === column.status)
        return acc
      },
      {} as Record<TicketStatus, Ticket[]>,
    )
  }, [tickets])

  const updateStatusMutation = useMutation({
    mutationFn: ({
      ticketId,
      targetStatus,
      note,
    }: {
      ticketId: string
      targetStatus: TicketStatus
      note?: string
    }) => {
      if (!isUpdatableStatus(targetStatus)) {
        throw new Error(`Status "${targetStatus}" cannot be set from the board.`)
      }

      return ticketsService.updateStatus({
        ticketId,
        status: targetStatus,
        note,
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] })
      toast.success('Ticket status updated')
    },
    onError: (mutationError) => {
      const message = mutationError instanceof Error ? mutationError.message : 'Failed to update status'
      toast.error(message)
    },
  })

  function onTicketDragStart(ticketId: string) {
    setDraggedTicketId(ticketId)
  }

  function onTicketDragEnd() {
    setDraggedTicketId(null)
    setHoveredStatus(null)
  }

  function onColumnDrop(targetStatus: TicketStatus) {
    if (!draggedTicketId) {
      return
    }

    const draggedTicket = tickets.find((ticket) => ticket.id === draggedTicketId)
    if (!draggedTicket) {
      return
    }

    if (draggedTicket.status === targetStatus) {
      setDraggedTicketId(null)
      setHoveredStatus(null)
      return
    }

    if (!isUpdatableStatus(targetStatus)) {
      toast.error(`Drop is disabled for "${targetStatus.replace('_', ' ')}" status.`)
      setDraggedTicketId(null)
      setHoveredStatus(null)
      return
    }

    setPendingDrop({ ticket: draggedTicket, targetStatus })
    setTransitionNote('')
    setDraggedTicketId(null)
    setHoveredStatus(null)
  }

  async function confirmStatusChange(event?: MouseEvent<HTMLButtonElement>) {
    if (!pendingDrop) {
      return
    }

    if (
      isNoteRequiredForTransition(pendingDrop.targetStatus) &&
      transitionNote.trim().length === 0
    ) {
      event?.preventDefault()
      toast.error('Description is required when moving to resolved or closed.')
      return
    }

    await updateStatusMutation.mutateAsync({
      ticketId: pendingDrop.ticket.id,
      targetStatus: pendingDrop.targetStatus,
      note: transitionNote,
    })

    setPendingDrop(null)
    setTransitionNote('')
  }

  return (
    <section className="flex flex-col gap-5">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">Ticket Flow Board</h1>
        <p className="text-sm text-muted-foreground">
          Drag cards between columns to update status. A transition note can be added before confirming.
        </p>
      </header>

      {isLoading ? (
        <div className="flex min-h-64 items-center justify-center rounded-xl border bg-muted/40">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : null}

      {isError ? (
        <Card className="border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
          {(error as Error)?.message ?? 'Unable to load board data.'}
        </Card>
      ) : null}

      {!isLoading && !isError ? (
        <div className="flex h-[calc(100svh-16rem)] min-h-[30rem] w-full gap-4 overflow-x-auto overflow-y-hidden pb-2">
          {boardColumns.map((column) => {
            const columnTickets = ticketsByStatus[column.status] ?? []
            const isDropBlocked = !isUpdatableStatus(column.status)
            const isActiveDropZone = hoveredStatus === column.status && !isDropBlocked

            return (
              <div
                key={column.status}
                className="relative flex h-full min-w-[260px] flex-1 basis-0 flex-col overflow-hidden rounded-2xl border bg-card/80 backdrop-blur"
                onDragOver={(event) => {
                  event.preventDefault()
                  setHoveredStatus(column.status)
                }}
                onDragLeave={() => {
                  setHoveredStatus((current) => (current === column.status ? null : current))
                }}
                onDrop={(event) => {
                  event.preventDefault()
                  onColumnDrop(column.status)
                }}
              >
                <div className={`h-1 w-full bg-gradient-to-r ${column.accent}`} />
                <div className="flex items-center justify-between px-4 pb-2 pt-4">
                  <div>
                    <h2 className="text-sm font-semibold">{column.title}</h2>
                    <p className="text-xs text-muted-foreground">{columnTickets.length} tickets</p>
                  </div>
                  {isDropBlocked ? (
                    <span className="rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                      Read only
                    </span>
                  ) : null}
                </div>

                <div
                  className={`flex-1 space-y-3 overflow-y-auto p-3 transition-colors ${isActiveDropZone ? 'bg-primary/5' : 'bg-transparent'}`}
                >
                  {columnTickets.length === 0 ? (
                    <div className="rounded-xl border border-dashed p-5 text-center text-xs text-muted-foreground">
                      No tickets
                    </div>
                  ) : null}

                  {columnTickets.map((ticket) => (
                    <Card
                      key={ticket.id}
                      draggable
                      onDragStart={() => onTicketDragStart(ticket.id)}
                      onDragEnd={onTicketDragEnd}
                      className={`cursor-grab rounded-xl border p-3 shadow-sm transition hover:shadow-md active:cursor-grabbing ${draggedTicketId === ticket.id ? 'opacity-60' : ''}`}
                    >
                      {(() => {
                        const overdue = ticket.status !== 'CLOSED' && isSlaOverdue(ticket.slaDueAt)
                        return (
                      <div className="space-y-2">
                        <div className="flex min-w-0 items-center justify-between gap-2">
                          <p className="shrink-0 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                            Bus {ticket.busNumber || 'N/A'}
                          </p>
                          <span className="ml-auto inline-block max-w-[65%] truncate rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold uppercase">
                            {ticket.assignedToName || 'Unassigned'}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => navigate(getTicketDetailsPath(ticket.id))}
                          className="line-clamp-2 text-left text-sm font-semibold leading-tight transition-colors hover:text-primary"
                        >
                          {ticket.title}
                        </button>
                        <div className="flex items-center justify-between pt-1 text-[11px]">
                          <span>{ticket.severity}</span>
                          <span
                            className={cn(
                              'truncate',
                              overdue ? 'font-semibold text-red-600 dark:text-red-400' : 'text-muted-foreground',
                            )}
                          >
                            SLA: {formatSlaDueAt(ticket.slaDueAt)}
                          </span>
                        </div>
                        <ShareTicketButton
                          ticketId={ticket.id}
                          ticketNumber={ticket.ticketNumber}
                          title={ticket.title}
                          className="w-full"
                        />
                      </div>
                        )
                      })()}
                    </Card>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      ) : null}

      {isFetching && !isLoading ? (
        <p className="text-xs text-muted-foreground">Refreshing board...</p>
      ) : null}

      <AlertDialog
        open={Boolean(pendingDrop)}
        onOpenChange={(open) => {
          if (!open) {
            setPendingDrop(null)
            setTransitionNote('')
          }
        }}
      >
        {pendingDrop ? (
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirm status change</AlertDialogTitle>
              <AlertDialogDescription>
                Move <span className="font-medium text-foreground">{pendingDrop.ticket.title}</span> to{' '}
                <span className="font-medium text-foreground">
                  {pendingDrop.targetStatus.replace('_', ' ')}
                </span>
                .
              </AlertDialogDescription>
            </AlertDialogHeader>

            <div className="space-y-2">
              <label htmlFor="transition-note" className="text-sm font-medium">
                Transition note
                {isNoteRequiredForTransition(pendingDrop.targetStatus) ? (
                  <span className="ml-1 text-destructive">*</span>
                ) : null}
              </label>
              <textarea
                id="transition-note"
                className="min-h-28 w-full rounded-md border bg-background px-3 py-2 text-sm outline-none ring-ring focus:ring-1"
                placeholder="Add context for this status update..."
                value={transitionNote}
                onChange={(event) => setTransitionNote(event.target.value)}
              />
              {isNoteRequiredForTransition(pendingDrop.targetStatus) ? (
                <p className="text-xs text-muted-foreground">
                  Description is required for resolved and closed transitions.
                </p>
              ) : null}
            </div>

            <AlertDialogFooter>
              <AlertDialogCancel
                onClick={() => {
                  setPendingDrop(null)
                  setTransitionNote('')
                }}
              >
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction onClick={confirmStatusChange} disabled={updateStatusMutation.isPending}>
                {updateStatusMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Update status'
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        ) : null}
      </AlertDialog>
    </section>
  )
}
