import { useMemo, useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { Loader2, Printer, Save } from 'lucide-react'
import { useParams } from 'react-router-dom'
import { toast } from '@/lib/toast'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { ticketsService } from '@/features/tickets/api/tickets.service'
import { useCurrentUser } from '@/hooks/use-current-user'
import { queryClient } from '@/lib/query/query-client'

type UpdatableStatus = 'ASSIGNED' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED'
const adminStatuses: UpdatableStatus[] = ['ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'CLOSED']
const workerStatuses: UpdatableStatus[] = ['IN_PROGRESS', 'RESOLVED', 'CLOSED']
const priorityOptions = ['P1', 'P2', 'P3'] as const
type Role = 'ADMIN' | 'SUPERVISOR' | 'WORKER' | 'VIEWER'

const roleCapabilityMatrix: Record<
  Role,
  {
    canUpdateStatus: boolean
    canComment: boolean
    canAssign: boolean
    allowedStatuses: UpdatableStatus[]
  }
> = {
  ADMIN: {
    canUpdateStatus: true,
    canComment: true,
    canAssign: true,
    allowedStatuses: adminStatuses,
  },
  SUPERVISOR: {
    canUpdateStatus: true,
    canComment: true,
    canAssign: true,
    allowedStatuses: adminStatuses,
  },
  WORKER: {
    canUpdateStatus: true,
    canComment: true,
    canAssign: false,
    allowedStatuses: workerStatuses,
  },
  VIEWER: {
    canUpdateStatus: false,
    canComment: false,
    canAssign: false,
    allowedStatuses: [],
  },
}

function formatSla(rawSlaDueAt: string | undefined): string {
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

function formatDateTime(rawDate: string | undefined): string {
  if (!rawDate) {
    return 'N/A'
  }
  const parsed = new Date(rawDate)
  if (Number.isNaN(parsed.getTime())) {
    return 'N/A'
  }
  return new Intl.DateTimeFormat(undefined, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(parsed)
}

function formatWord(raw: string | undefined): string {
  if (!raw) return 'N/A'
  return raw
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase())
}

function getActorInitials(name: string | undefined, username: string | undefined): string {
  const source = (name || username || 'System').trim()
  if (!source) {
    return 'SY'
  }

  const words = source.split(/\s+/).filter(Boolean)
  if (words.length >= 2) {
    return `${words[0]?.[0] ?? ''}${words[1]?.[0] ?? ''}`.toUpperCase()
  }

  return source.slice(0, 2).toUpperCase()
}

function getActivityTone(action: string | undefined): string {
  const normalized = (action || '').toUpperCase()

  if (normalized.includes('STATUS') || normalized.includes('STATE')) {
    return 'border-blue-200 bg-blue-50 text-blue-700'
  }

  if (normalized.includes('ASSIGN')) {
    return 'border-indigo-200 bg-indigo-50 text-indigo-700'
  }

  if (normalized.includes('COMMENT') || normalized.includes('NOTE')) {
    return 'border-emerald-200 bg-emerald-50 text-emerald-700'
  }

  if (normalized.includes('CLOSE') || normalized.includes('RESOLVE')) {
    return 'border-violet-200 bg-violet-50 text-violet-700'
  }

  return 'border-slate-200 bg-slate-100 text-slate-700'
}

export function TicketDetailsPage() {
  const { ticketId } = useParams<{ ticketId: string }>()
  const currentUser = useCurrentUser()
  const [nextStatus, setNextStatus] = useState<UpdatableStatus | ''>('')
  const [assignToId, setAssignToId] = useState('')
  const [statusNote, setStatusNote] = useState('')
  const [commentNote, setCommentNote] = useState('')
  const [assignNote, setAssignNote] = useState('')
  const [printGeneratedAt, setPrintGeneratedAt] = useState(() => formatDateTime(new Date().toISOString()))

  const { data: ticket, isLoading, isError, error } = useQuery({
    queryKey: ['ticket', ticketId],
    queryFn: () => ticketsService.getById(ticketId ?? ''),
    enabled: Boolean(ticketId),
  })

  const { data: timeline = [], isLoading: isTimelineLoading } = useQuery({
    queryKey: ['ticket-timeline', ticketId],
    queryFn: () => ticketsService.getTimeline(ticketId ?? ''),
    enabled: Boolean(ticketId),
  })

  const sortedTimeline = useMemo(() => {
    return [...timeline].sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() || 0 : 0
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() || 0 : 0
      return dateB - dateA
    })
  }, [timeline])

  const normalizedRole = useMemo<Role>(() => {
    const role = currentUser?.role?.toUpperCase()
    if (role === 'ADMIN' || role === 'SUPERVISOR' || role === 'WORKER' || role === 'VIEWER') {
      return role
    }
    return 'VIEWER'
  }, [currentUser?.role])

  const capabilities = roleCapabilityMatrix[normalizedRole]
  const canUpdateStatus = capabilities.canUpdateStatus
  const canComment = capabilities.canComment
  const canAssign = capabilities.canAssign
  const canEditAnyAction = canUpdateStatus || canComment || canAssign

  const { data: assignableUsers = [] } = useQuery({
    queryKey: ['ticket-assignable-users'],
    queryFn: () => ticketsService.listAssignableUsers(),
    enabled: canAssign,
  })

  const updateStatusMutation = useMutation({
    mutationFn: async () => {
      if (!ticketId || !nextStatus || !ticket) {
        throw new Error('Select a status first.')
      }
      if (nextStatus === ticket.status) {
        throw new Error('Please select a different status.')
      }
      return ticketsService.updateStatus({
        ticketId,
        status: nextStatus,
        note: statusNote,
      })
    },
    onSuccess: () => {
      setNextStatus('')
      setStatusNote('')
      queryClient.invalidateQueries({ queryKey: ['ticket', ticketId] })
      queryClient.invalidateQueries({ queryKey: ['ticket-timeline', ticketId] })
      queryClient.invalidateQueries({ queryKey: ['tickets'] })
      toast.success('Status updated successfully.')
    },
    onError: (mutationError) => {
      toast.error(mutationError instanceof Error ? mutationError.message : 'Failed to update status.')
    },
  })

  const assignTicketMutation = useMutation({
    mutationFn: async () => {
      if (!ticketId || !effectiveAssignToId) {
        throw new Error('Select a user to assign.')
      }
      return ticketsService.assign({ ticketId, assignedToId: effectiveAssignToId, note: assignNote })
    },
    onSuccess: () => {
      setAssignToId('')
      setAssignNote('')
      queryClient.invalidateQueries({ queryKey: ['ticket', ticketId] })
      queryClient.invalidateQueries({ queryKey: ['ticket-timeline', ticketId] })
      queryClient.invalidateQueries({ queryKey: ['tickets'] })
      toast.success('Ticket assignment updated.')
    },
    onError: (mutationError) => {
      toast.error(mutationError instanceof Error ? mutationError.message : 'Failed to assign ticket.')
    },
  })

  const commentMutation = useMutation({
    mutationFn: async () => {
      if (!ticketId || commentNote.trim().length === 0) {
        throw new Error('Comment is required.')
      }
      await ticketsService.addComment({ ticketId, note: commentNote })
    },
    onSuccess: () => {
      setCommentNote('')
      queryClient.invalidateQueries({ queryKey: ['ticket-timeline', ticketId] })
      toast.success('Comment added.')
    },
    onError: (mutationError) => {
      toast.error(mutationError instanceof Error ? mutationError.message : 'Failed to add comment.')
    },
  })

  const effectiveAssignToId = assignToId || ticket?.assignedToUserId || ''

  if (!ticketId) {
    return (
      <Card className="p-4 text-sm text-destructive">
        Invalid ticket URL. Please open a ticket again from the board.
      </Card>
    )
  }

  if (isLoading) {
    return <Card className="p-4 text-sm text-muted-foreground">Loading ticket details...</Card>
  }

  if (isError || !ticket) {
    return (
      <Card className="p-4 text-sm text-destructive">
        {(error as Error)?.message ?? 'Unable to load ticket details.'}
      </Card>
    )
  }

  const hasAssignmentChanged = Boolean(effectiveAssignToId) && effectiveAssignToId !== (ticket.assignedToUserId ?? '')
  const hasStatusSelection = nextStatus !== ''
  const hasStatusChanged = hasStatusSelection && nextStatus !== ticket.status

  const handlePrintTicket = () => {
    setPrintGeneratedAt(formatDateTime(new Date().toISOString()))
    requestAnimationFrame(() => {
      window.print()
    })
  }

  return (
    <section className="space-y-4 print:space-y-3">
      <div className="print-only print-report-header">
        <p className="print-report-title">Ticket Report</p>
        <p className="print-report-subtitle">
          #{ticket.id} - Printed on {printGeneratedAt}
        </p>
      </div>

      <header className="space-y-3 border-b pb-4 print:border-slate-300 print:pb-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-2">
            <h1 className="text-2xl font-semibold tracking-tight print:text-2xl">{ticket.title}</h1>
            <p className="text-sm text-muted-foreground print-muted">
              Ticket ID: {ticket.id} {!canEditAnyAction ? '- Read only access' : ''}
            </p>
          </div>
          <Button size="sm" variant="outline" className="no-print gap-2" onClick={handlePrintTicket}>
            <Printer className="h-4 w-4" />
            Print Ticket
          </Button>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-md border bg-muted/20 p-3 print-card">
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground print-muted">Created At</p>
            <p className="mt-1 text-sm font-semibold">{formatDateTime(ticket.createdAt)}</p>
          </div>
          <div className="rounded-md border bg-muted/20 p-3 print-card">
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground print-muted">Updated At</p>
            <p className="mt-1 text-sm font-semibold">{formatDateTime(ticket.updatedAt)}</p>
          </div>
          <div className="rounded-md border bg-muted/20 p-3 print-card">
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground print-muted">Created By</p>
            <p className="mt-1 text-sm font-semibold">{ticket.createdByName || 'Unknown'}</p>
          </div>
          <div className="rounded-md border bg-muted/20 p-3 print-card">
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground print-muted">Assigned To</p>
            <p className="mt-1 text-sm font-semibold">{ticket.assignedToName || 'Unassigned'}</p>
          </div>
        </div>
      </header>

      <div className="grid gap-4 lg:grid-cols-[1.6fr_1fr] print:block print:space-y-4">
        <Card className="print-card space-y-4 p-4">
          <div className="grid gap-3 border-b pb-4 sm:grid-cols-2 xl:grid-cols-3">
            <div className="rounded-md border bg-muted/20 p-3 print-card">
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Status</p>
              <p className="mt-1 text-sm font-semibold">{formatWord(ticket.status)}</p>
            </div>
            <div className="rounded-md border bg-muted/20 p-3 print-card">
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Priority</p>
              <p className="mt-1 text-sm font-semibold">{ticket.priority}</p>
            </div>
            <div className="rounded-md border bg-muted/20 p-3 print-card">
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Severity</p>
              <p className="mt-1 text-sm font-semibold">{ticket.severity}</p>
            </div>
            <div className="rounded-md border bg-muted/20 p-3 print-card">
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Category</p>
              <p className="mt-1 text-sm font-semibold">{ticket.category || 'General'}</p>
            </div>
            <div className="rounded-md border bg-muted/20 p-3 print-card">
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Bus Number</p>
              <p className="mt-1 text-sm font-semibold">{ticket.busNumber || 'N/A'}</p>
            </div>
            <div className="rounded-md border bg-muted/20 p-3 print-card">
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground">SLA Due</p>
              <p className="mt-1 text-sm font-semibold">{formatSla(ticket.slaDueAt)}</p>
            </div>
            <div className="rounded-md border bg-muted/20 p-3 print-card">
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Assigned To</p>
              <p className="mt-1 text-sm font-semibold">{ticket.assignedToName || 'Unassigned'}</p>
            </div>
            <div className="rounded-md border bg-muted/20 p-3 print-card">
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Created By</p>
              <p className="mt-1 text-sm font-semibold">{ticket.createdByName || 'Unknown'}</p>
            </div>
            <div className="rounded-md border bg-muted/20 p-3 print-card">
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Assignee User ID</p>
              <p className="mt-1 break-all text-sm font-medium">{ticket.assignedToUserId || 'N/A'}</p>
            </div>
          </div>

          <div className="space-y-1">
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Description</p>
            <p className="rounded-md border bg-background p-3 text-sm leading-6">
              {ticket.description || 'No description'}
            </p>
          </div>
        </Card>

        <Card className="no-print space-y-3 p-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Update Work Item</h2>

          <div className="grid gap-3">
            <label className="space-y-1">
              <span className="text-xs text-muted-foreground">Status</span>
              <DropdownMenu>
                <DropdownMenuTrigger asChild disabled={!canUpdateStatus || updateStatusMutation.isPending}>
                  <Button variant="outline" className="h-9 w-full justify-between px-3 font-normal">
                    <span>{nextStatus ? formatWord(nextStatus) : 'Select status'}</span>
                    <span className="text-xs text-muted-foreground">Change</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-[var(--radix-dropdown-menu-trigger-width)]">
                  {capabilities.allowedStatuses.map((status) => (
                    <DropdownMenuItem key={status} onClick={() => setNextStatus(status)}>
                      {formatWord(status)}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </label>

            <label className="space-y-1">
              <span className="text-xs text-muted-foreground">Priority</span>
              <DropdownMenu>
                <DropdownMenuTrigger asChild disabled>
                  <Button variant="outline" className="h-9 w-full justify-between px-3 font-normal">
                    <span>{ticket.priority}</span>
                    <span className="text-xs text-muted-foreground">Read-only</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-[var(--radix-dropdown-menu-trigger-width)]">
                  {priorityOptions.map((priority) => (
                    <DropdownMenuItem key={priority}>{priority}</DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </label>
          </div>

          <label className="space-y-1">
            <span className="text-xs text-muted-foreground">Status note</span>
            <textarea
              className="min-h-20 w-full rounded-md border bg-background px-3 py-2 text-sm"
              disabled={!canUpdateStatus || updateStatusMutation.isPending}
              value={statusNote}
              onChange={(event) => setStatusNote(event.target.value)}
              placeholder={canUpdateStatus ? 'Optional note for the status change' : 'Read-only'}
            />
          </label>

          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              disabled={!canUpdateStatus || !hasStatusChanged || updateStatusMutation.isPending}
              onClick={() => updateStatusMutation.mutate()}
            >
              {updateStatusMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Update status
            </Button>
            <Button size="sm" variant="outline" disabled>
              Priority updates not available in API
            </Button>
          </div>

          {canAssign ? (
            <div className="space-y-2 rounded-md border p-3">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Assignment</h3>
              <div className="grid gap-2 sm:grid-cols-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild disabled={assignTicketMutation.isPending}>
                    <Button variant="outline" className="h-9 justify-between px-3 font-normal">
                      <span>
                        {effectiveAssignToId
                          ? (assignableUsers.find((user) => user.id === effectiveAssignToId)?.displayName ??
                            ticket.assignedToName ??
                            ticket.assignedToUserId ??
                            'Selected')
                          : 'Select user'}
                      </span>
                      <span className="text-xs text-muted-foreground">Choose</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-[var(--radix-dropdown-menu-trigger-width)]">
                    {assignableUsers.map((user) => (
                      <DropdownMenuItem key={user.id} onClick={() => setAssignToId(user.id)}>
                        {user.displayName} ({user.role})
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
                <Button
                  size="sm"
                  variant="default"
                  disabled={!hasAssignmentChanged || assignTicketMutation.isPending}
                  onClick={() => assignTicketMutation.mutate()}
                >
                  {assignTicketMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  Assign
                </Button>
              </div>
              <textarea
                className="min-h-16 w-full rounded-md border bg-background px-3 py-2 text-sm"
                value={assignNote}
                disabled={assignTicketMutation.isPending}
                onChange={(event) => setAssignNote(event.target.value)}
                placeholder="Optional assignment note"
              />
            </div>
          ) : null}

          <div className="space-y-2 rounded-md border p-3">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Comments</h3>
            <textarea
              className="min-h-20 w-full rounded-md border bg-background px-3 py-2 text-sm"
              value={commentNote}
              disabled={!canComment || commentMutation.isPending}
              onChange={(event) => setCommentNote(event.target.value)}
              placeholder={canComment ? 'Add a comment or resolution note' : 'Read-only'}
            />
            <Button
              size="sm"
              variant="outline"
              disabled={!canComment || commentNote.trim().length === 0 || commentMutation.isPending}
              onClick={() => commentMutation.mutate()}
            >
              {commentMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Add comment
            </Button>
          </div>
        </Card>
      </div>

      <Card className="print-card space-y-3 p-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Activity Timeline</h2>
        {isTimelineLoading ? (
          <p className="text-sm text-muted-foreground">Loading timeline...</p>
        ) : sortedTimeline.length === 0 ? (
          <p className="text-sm text-muted-foreground">No activity available.</p>
        ) : (
          <ul className="space-y-4">
            {sortedTimeline.map((entry) => (
              <li key={entry.id} className="relative pl-14 text-sm">
                <span className="absolute left-5 top-0 h-full w-px bg-slate-200" aria-hidden />
                <span className="absolute left-0 top-0.5 flex h-10 w-10 items-center justify-center rounded-full border border-slate-300 bg-white text-xs font-semibold tracking-wide text-slate-700 shadow-sm">
                  {getActorInitials(entry.actorName, entry.actorUsername)}
                </span>
                <div className="print-card rounded-md border border-slate-200 bg-white p-3 shadow-sm">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span
                      className={`inline-flex rounded border px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${getActivityTone(entry.actionType || entry.action)}`}
                    >
                      {formatWord(entry.actionType || entry.action)}
                    </span>
                    <span className="text-xs text-muted-foreground">{formatSla(entry.createdAt)}</span>
                  </div>
                  <p className="mt-2 text-xs text-slate-600">
                    {(entry.actorName || 'System') + (entry.actorUsername ? ` (@${entry.actorUsername})` : '')}
                  </p>
                  {entry.fromStatus || entry.toStatus ? (
                    <p className="mt-2 inline-flex items-center rounded border border-slate-200 bg-slate-50 px-2 py-1 text-xs text-slate-700">
                      {formatWord(entry.fromStatus)} {'->'} {formatWord(entry.toStatus)}
                    </p>
                  ) : null}
                  {entry.note ? (
                    <p className="mt-2 rounded-md border border-slate-200 bg-slate-50 p-2 text-sm leading-5 text-slate-700">
                      {entry.note}
                    </p>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <div className="print-only print-report-footer">
        <span>Generated from Samanvi Ticketing Tool</span>
        <span className="print-page-number" />
      </div>
    </section>
  )
}
