import { useMemo, useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { Loader2, Pencil, Printer } from 'lucide-react'
import { ShareTicketButton } from '@/features/tickets/components/share-ticket-button'
import { getTicketShareUrl } from '@/features/tickets/utils/ticket-share'
import { QRCodeSVG } from 'qrcode.react'
import { useParams } from 'react-router-dom'
import { toast } from '@/lib/toast'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { notificationQueryKeys } from '@/features/notifications/hooks/notification-query-keys'
import { ticketsService } from '@/features/tickets/api/tickets.service'
import type { TicketStatus } from '@/features/tickets/types/ticket'
import {
  getInvalidStatusTransitionMessage,
  isNoteRequiredForTransition,
} from '@/features/tickets/utils/ticket-status-transition'
import { useCurrentUser } from '@/hooks/use-current-user'
import { SAMANVI_LOGO_URL } from '@/lib/branding'
import { queryClient } from '@/lib/query/query-client'

type UpdatableStatus = 'ASSIGNED' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED'
type SelectableStatus = UpdatableStatus | 'REOPENED'

function isUpdatableStatus(status: TicketStatus): status is UpdatableStatus {
  return status === 'ASSIGNED' || status === 'IN_PROGRESS' || status === 'RESOLVED' || status === 'CLOSED'
}

function isSelectableStatus(status: TicketStatus): status is SelectableStatus {
  return isUpdatableStatus(status) || status === 'REOPENED'
}

function getStatusDialogOptions(currentStatus: TicketStatus, allowedStatuses: UpdatableStatus[]): TicketStatus[] {
  if (currentStatus === 'CLOSED') {
    return ['CLOSED', 'REOPENED']
  }
  const options = new Set<TicketStatus>(allowedStatuses)
  options.add(currentStatus)
  return Array.from(options)
}
const adminStatuses: UpdatableStatus[] = ['ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'CLOSED']
const workerStatuses: UpdatableStatus[] = ['IN_PROGRESS', 'RESOLVED', 'CLOSED']
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

function getTicketPrintDocumentTitle(ticketNumber: string | undefined, ticketId: string): string {
  const label = (ticketNumber || ticketId).replace(/[/\\?%*:|"<>]/g, '-').trim()
  return `Ticket-${label}`
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

const PRINT_ACTIVITY_TONE =
  'print:border-gray-300 print:bg-gray-50 print:text-gray-800'

function getActivityTone(action: string | undefined): string {
  const normalized = (action || '').toUpperCase()

  if (normalized.includes('STATUS') || normalized.includes('STATE')) {
    return `border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800/60 dark:bg-blue-950/40 dark:text-blue-300 print:border-blue-200 print:bg-blue-50 print:text-blue-800`
  }

  if (normalized.includes('ASSIGN')) {
    return `border-indigo-200 bg-indigo-50 text-indigo-700 dark:border-indigo-800/60 dark:bg-indigo-950/40 dark:text-indigo-300 print:border-indigo-200 print:bg-indigo-50 print:text-indigo-800`
  }

  if (normalized.includes('COMMENT') || normalized.includes('NOTE')) {
    return `border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800/60 dark:bg-emerald-950/40 dark:text-emerald-300 print:border-emerald-200 print:bg-emerald-50 print:text-emerald-800`
  }

  if (normalized.includes('CLOSE') || normalized.includes('RESOLVE')) {
    return `border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-800/60 dark:bg-violet-950/40 dark:text-violet-300 print:border-violet-200 print:bg-violet-50 print:text-violet-800`
  }

  return `border-border bg-muted/50 text-foreground ${PRINT_ACTIVITY_TONE}`
}

function EditableDetailValue({
  value,
  editable,
  onClick,
  ariaLabel,
}: {
  value: string
  editable: boolean
  onClick?: () => void
  ariaLabel: string
}) {
  if (!editable) {
    return <p className="mt-1 text-sm font-semibold">{value}</p>
  }

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      className="group mt-1 flex w-full items-center justify-between gap-2 rounded-md border border-transparent px-1 py-0.5 text-left text-sm font-semibold transition-colors hover:border-primary/30 hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <span>{value}</span>
      <Pencil className="h-3.5 w-3.5 shrink-0 text-muted-foreground opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-visible:opacity-100" />
    </button>
  )
}

export function TicketDetailsPage() {
  const { ticketId } = useParams<{ ticketId: string }>()
  const currentUser = useCurrentUser()
  const [nextStatus, setNextStatus] = useState<TicketStatus | ''>('')
  const [assignToId, setAssignToId] = useState('')
  const [statusNote, setStatusNote] = useState('')
  const [commentNote, setCommentNote] = useState('')
  const [assignNote, setAssignNote] = useState('')
  const [statusDialogOpen, setStatusDialogOpen] = useState(false)
  const [assignDialogOpen, setAssignDialogOpen] = useState(false)
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
      if (!isSelectableStatus(nextStatus)) {
        throw new Error('This status cannot be applied.')
      }
      const invalidTransition = getInvalidStatusTransitionMessage(ticket.status, nextStatus)
      if (invalidTransition) {
        throw new Error(invalidTransition)
      }
      if (isNoteRequiredForTransition(nextStatus) && statusNote.trim().length === 0) {
        throw new Error('Description is required when moving to resolved.')
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
      setStatusDialogOpen(false)
      queryClient.invalidateQueries({ queryKey: ['ticket', ticketId] })
      queryClient.invalidateQueries({ queryKey: ['ticket-timeline', ticketId] })
      queryClient.invalidateQueries({ queryKey: ['tickets'] })
      queryClient.invalidateQueries({ queryKey: notificationQueryKeys.all })
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
      setAssignDialogOpen(false)
      queryClient.invalidateQueries({ queryKey: ['ticket', ticketId] })
      queryClient.invalidateQueries({ queryKey: ['ticket-timeline', ticketId] })
      queryClient.invalidateQueries({ queryKey: ['tickets'] })
      queryClient.invalidateQueries({ queryKey: notificationQueryKeys.all })
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
      queryClient.invalidateQueries({ queryKey: notificationQueryKeys.all })
      toast.success('Comment added.')
    },
    onError: (mutationError) => {
      toast.error(mutationError instanceof Error ? mutationError.message : 'Failed to add comment.')
    },
  })

  const effectiveAssignToId = assignToId || ticket?.assignedToUserId || ''

  const openStatusDialog = () => {
    setNextStatus(ticket?.status ?? '')
    setStatusNote('')
    setStatusDialogOpen(true)
  }

  const openAssignDialog = () => {
    setAssignToId(ticket?.assignedToUserId ?? '')
    setAssignNote('')
    setAssignDialogOpen(true)
  }

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
  const hasStatusChanged = nextStatus !== '' && nextStatus !== ticket.status
  const isStatusNoteRequired =
    hasStatusChanged && isSelectableStatus(nextStatus) && isNoteRequiredForTransition(nextStatus)
  const statusDialogOptions = getStatusDialogOptions(ticket.status, capabilities.allowedStatuses)
  const ticketRouteUrl = getTicketShareUrl(ticket.id)

  const handlePrintTicket = () => {
    setPrintGeneratedAt(formatDateTime(new Date().toISOString()))
    const previousTitle = document.title
    const printTitle = getTicketPrintDocumentTitle(ticket.ticketNumber, ticket.id)

    const restoreTitle = () => {
      document.title = previousTitle
      window.removeEventListener('afterprint', restoreTitle)
    }

    requestAnimationFrame(() => {
      document.title = printTitle
      window.addEventListener('afterprint', restoreTitle)
      window.print()
    })
  }

  return (
    <section className="space-y-4 print:space-y-3">
      <div className="print-only print-report-header">
        <div className="print-report-header-row">
          <img src={SAMANVI_LOGO_URL} alt="Samanvi" className="print-report-logo" />
          <div className="print-report-header-text">
            <p className="print-report-title">Ticket Report</p>
            <p className="print-report-subtitle">
              #{ticket.id} - Printed on {printGeneratedAt}
            </p>
          </div>
        </div>
      </div>

      <header className="space-y-3 border-b pb-4 print:border-slate-300 print:pb-3">
        <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between">
          <div className="min-w-0 space-y-2">
            <h1 className="text-xl font-semibold leading-snug tracking-tight sm:text-2xl print:text-2xl">
              {ticket.title}
            </h1>
            <p className="text-sm text-muted-foreground print-muted">
              Ticket ID: {ticket.id} {!canEditAnyAction ? '- Read only access' : ''}
            </p>
          </div>
          <div className="no-print flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center">
            <ShareTicketButton
              ticketId={ticket.id}
              ticketNumber={ticket.ticketNumber}
              title={ticket.title}
              className="w-full sm:w-auto"
            />
            <Button
              size="sm"
              variant="outline"
              className="w-full gap-2 sm:w-auto"
              onClick={handlePrintTicket}
            >
              <Printer className="h-4 w-4" />
              Print Ticket
            </Button>
          </div>
        </div>
      </header>

      <div className="space-y-4 print:space-y-4">
        <Card className="print-card space-y-4 p-4">
          <div className="space-y-3 border-b pb-4">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Ticket Details</h2>
            <div className="grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-4">
            <div className="rounded-md border bg-muted/20 p-3 print-card">
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground print-muted">Ticket Number</p>
              <p className="mt-1 text-sm font-semibold">{ticket.ticketNumber || ticket.id}</p>
            </div>
            <div className="rounded-md border bg-muted/20 p-3 print-card">
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground print-muted">Status</p>
              <EditableDetailValue
                value={formatWord(ticket.status)}
                editable={canUpdateStatus}
                onClick={openStatusDialog}
                ariaLabel="Update status"
              />
            </div>
            <div className="rounded-md border bg-muted/20 p-3 print-card">
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground print-muted">Created At</p>
              <p className="mt-1 text-sm font-semibold">{formatDateTime(ticket.createdAt)}</p>
            </div>
            <div className="rounded-md border bg-muted/20 p-3 print-card">
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground print-muted">Updated At</p>
              <p className="mt-1 text-sm font-semibold">{formatDateTime(ticket.updatedAt)}</p>
            </div>
            <div className="rounded-md border bg-muted/20 p-3 print-card">
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground print-muted">Priority</p>
              <p className="mt-1 text-sm font-semibold">{ticket.priority}</p>
            </div>
            <div className="rounded-md border bg-muted/20 p-3 print-card">
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground print-muted">Severity</p>
              <p className="mt-1 text-sm font-semibold">{ticket.severity}</p>
            </div>
            <div className="rounded-md border bg-muted/20 p-3 print-card">
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground print-muted">Category</p>
              <p className="mt-1 text-sm font-semibold">{ticket.category || 'General'}</p>
            </div>
            <div className="rounded-md border bg-muted/20 p-3 print-card">
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground print-muted">Bus Number</p>
              <p className="mt-1 text-sm font-semibold">{ticket.busNumber || 'N/A'}</p>
            </div>
            <div className="rounded-md border bg-muted/20 p-3 print-card">
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground print-muted">SLA Due</p>
              <p className="mt-1 text-sm font-semibold">{formatSla(ticket.slaDueAt)}</p>
            </div>
            <div className="rounded-md border bg-muted/20 p-3 print-card">
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground print-muted">Assignment</p>
              <EditableDetailValue
                value={ticket.assignedToName || 'Unassigned'}
                editable={canAssign}
                onClick={openAssignDialog}
                ariaLabel="Update assignment"
              />
            </div>
            <div className="rounded-md border bg-muted/20 p-3 print-card">
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground print-muted">Created By</p>
              <p className="mt-1 text-sm font-semibold">{ticket.createdByName || 'Unknown'}</p>
            </div>
            <div className="col-span-2 rounded-md border bg-background p-3 print-card">
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground print-muted">Ticket QR</p>
              <div className="mt-2 flex flex-col items-center gap-3 sm:flex-row sm:items-start">
                <div className="shrink-0 rounded-md border bg-white p-2">
                  <QRCodeSVG value={ticketRouteUrl} size={76} />
                </div>
                <p className="w-full break-all text-center text-xs text-muted-foreground sm:text-left">
                  {ticketRouteUrl}
                </p>
              </div>
            </div>
            <div className="col-span-2 rounded-md border bg-background p-3 lg:col-span-4 print-card">
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground print-muted">Description</p>
              <p className="mt-1 text-sm leading-6">{ticket.description || 'No description'}</p>
            </div>
            </div>
          </div>
        </Card>

        <Card className="no-print space-y-3 p-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Comments</h2>
          <Textarea
            className="min-h-20"
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
        </Card>

        <Dialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Update status</DialogTitle>
              <DialogDescription>
                Update the ticket status
                {isStatusNoteRequired
                  ? ' and add a description for this change.'
                  : ' and add an optional note for the change.'}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="status-select">Status</Label>
                <Select
                  value={nextStatus}
                  onValueChange={(value) => setNextStatus(value as TicketStatus)}
                  disabled={updateStatusMutation.isPending}
                >
                  <SelectTrigger id="status-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {statusDialogOptions.map((status) => (
                      <SelectItem key={status} value={status}>
                        {formatWord(status)}
                        {status === ticket.status ? ' (current)' : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="status-note">
                  Status change notes
                  {isStatusNoteRequired ? <span className="ml-1 text-destructive">*</span> : null}
                </Label>
                <Textarea
                  id="status-note"
                  className="min-h-24"
                  value={statusNote}
                  disabled={updateStatusMutation.isPending}
                  onChange={(event) => setStatusNote(event.target.value)}
                  placeholder={
                    isStatusNoteRequired
                      ? 'Add context for this status update...'
                      : 'Optional note for the status change'
                  }
                />
                {isStatusNoteRequired ? (
                  <p className="text-xs text-muted-foreground">
                    Description is required when moving to resolved.
                  </p>
                ) : null}
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                disabled={updateStatusMutation.isPending}
                onClick={() => setStatusDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                disabled={!hasStatusChanged || updateStatusMutation.isPending}
                onClick={() => updateStatusMutation.mutate()}
              >
                {updateStatusMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Save status
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Update assignment</DialogTitle>
              <DialogDescription>
                Currently assigned to {ticket.assignedToName || 'no one'}. Select a new assignee below.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="assignee-select">Assignee</Label>
                <Select
                  value={effectiveAssignToId || undefined}
                  onValueChange={setAssignToId}
                  disabled={assignTicketMutation.isPending}
                >
                  <SelectTrigger id="assignee-select">
                    <SelectValue placeholder="Select user" />
                  </SelectTrigger>
                  <SelectContent>
                    {assignableUsers.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.displayName} ({user.role})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="assign-note">Assignment note</Label>
                <Textarea
                  id="assign-note"
                  className="min-h-20"
                  value={assignNote}
                  disabled={assignTicketMutation.isPending}
                  onChange={(event) => setAssignNote(event.target.value)}
                  placeholder="Optional assignment note"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                disabled={assignTicketMutation.isPending}
                onClick={() => setAssignDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                disabled={!hasAssignmentChanged || assignTicketMutation.isPending}
                onClick={() => assignTicketMutation.mutate()}
              >
                {assignTicketMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Save assignment
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
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
              <li key={entry.id} className="relative pl-11 text-sm sm:pl-14">
                <span className="absolute left-4 top-0 h-full w-px bg-border sm:left-5" aria-hidden />
                <span className="absolute left-0 top-0.5 flex h-9 w-9 items-center justify-center rounded-full border border-border bg-card text-[10px] font-semibold tracking-wide text-foreground shadow-sm sm:h-10 sm:w-10 sm:text-xs">
                  {getActorInitials(entry.actorName, entry.actorUsername)}
                </span>
                <div className="print-card rounded-md border border-border bg-card p-3 shadow-sm">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span
                      className={`inline-flex rounded border px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${getActivityTone(entry.actionType || entry.action)}`}
                    >
                      {formatWord(entry.actionType || entry.action)}
                    </span>
                    <span className="text-xs text-muted-foreground">{formatSla(entry.createdAt)}</span>
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {(entry.actorName || 'System') + (entry.actorUsername ? ` (@${entry.actorUsername})` : '')}
                  </p>
                  {entry.fromStatus || entry.toStatus ? (
                    <p className="mt-2 inline-flex items-center rounded border border-border bg-muted/40 px-2 py-1 text-xs text-foreground">
                      {formatWord(entry.fromStatus)} {'->'} {formatWord(entry.toStatus)}
                    </p>
                  ) : null}
                  {entry.note ? (
                    <p className="mt-2 rounded-md border border-border bg-muted/40 p-2 text-sm leading-5 text-foreground">
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
