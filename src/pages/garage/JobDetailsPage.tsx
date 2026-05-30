import { useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import {
  ArrowLeft,
  CalendarClock,
  Download,
  History,
  Loader2,
  MessageSquarePlus,
  MoreHorizontal,
  PackagePlus,
  Pencil,
  Repeat2,
  Trash2,
  Wrench,
} from 'lucide-react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
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
import { MasterDetailGrid } from '@/components/master-detail-grid'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'
import '@/features/tickets/styles/tickets-grid.css'

import { garageService } from '@/features/garage/api/garage.service'
import { AddJobPartDialog } from '@/features/garage/components/add-job-part-dialog'
import { ScheduleRepeatJobDialog } from '@/features/garage/components/schedule-repeat-job-dialog'
import {
  formatJobDate,
  formatJobPriority,
  formatJobStatus,
  getPrioritySeverityClass,
} from '@/features/garage/utils/job-list-model'
import {
  formatJobPartAddedAt,
  formatJobPartLineTotal,
  formatJobPartsTotal,
} from '@/features/garage/utils/job-part-model'
import { formatRepairPartPrice } from '@/features/garage/utils/repair-part-model'
import { getJobDetailsPath, getJobEditPath, getRepairTrackingPath } from '@/features/garage/utils/job-routes'
import {
  formatCommentMeta,
  getJobComments,
  validateJobCommentNote,
} from '@/features/garage/utils/job-activity-model'
import {
  formatRepeatScheduledDate,
  hasPendingRepeatSchedule,
  hasProcessedRepeatSchedule,
} from '@/features/garage/utils/job-repeat-model'
import type { RepairJobPart } from '@/features/garage/types/job'
import { usePermissions, useSubmoduleActions } from '@/hooks/use-permissions'
import { queryClient } from '@/lib/query/query-client'
import { cn } from '@/lib/utils'

function DetailItem({
  label,
  value,
  className,
}: {
  label: string
  value: string
  className?: string
}) {
  return (
    <div className={cn('space-y-1 rounded-lg border bg-muted/20 px-3 py-2.5', className)}>
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="text-sm font-medium text-foreground">{value}</p>
    </div>
  )
}

export function JobDetailsPage() {
  const navigate = useNavigate()
  const { jobId } = useParams()
  const jobActions = useSubmoduleActions('garage', 'repair_job')
  const { has, can } = usePermissions()
  const canViewJob = has('garage', 'repair_job', 'view')
  const canAddParts = can('garage', 'repair_job', 'edit')
  const [addPartOpen, setAddPartOpen] = useState(false)
  const [repeatJobOpen, setRepeatJobOpen] = useState(false)
  const [showCommentForm, setShowCommentForm] = useState(false)
  const [commentNote, setCommentNote] = useState('')
  const [removePartTarget, setRemovePartTarget] = useState<RepairJobPart | null>(null)

  const {
    data: job,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['garage', 'jobs', jobId],
    queryFn: () => garageService.getJob(jobId!),
    enabled: Boolean(jobId),
  })

  const removePartMutation = useMutation({
    mutationFn: (lineId: string) => garageService.removeJobPart(jobId!, lineId),
    onSuccess: () => {
      toast.success('Spare part removed from repair job.')
      queryClient.invalidateQueries({ queryKey: ['garage', 'jobs', jobId] })
      queryClient.invalidateQueries({ queryKey: ['garage', 'jobs'] })
      setRemovePartTarget(null)
    },
    onError: (mutationError) => {
      toast.error(
        mutationError instanceof Error ? mutationError.message : 'Failed to remove spare part.',
      )
    },
  })

  const commentMutation = useMutation({
    mutationFn: (note: string) => garageService.addJobComment({ jobId: jobId!, note }),
    onSuccess: () => {
      toast.success('Comment added.')
      setCommentNote('')
      setShowCommentForm(false)
      queryClient.invalidateQueries({ queryKey: ['garage', 'jobs', jobId] })
    },
    onError: (mutationError) => {
      toast.error(mutationError instanceof Error ? mutationError.message : 'Failed to add comment.')
    },
  })

  function confirmRemovePart() {
    if (!removePartTarget) return
    removePartMutation.mutate(removePartTarget.id)
  }

  function handleSubmitComment() {
    const validationError = validateJobCommentNote(commentNote)
    if (validationError) {
      toast.error(validationError)
      return
    }
    commentMutation.mutate(commentNote.trim())
  }

  if (!jobId) {
    return <Navigate to={getRepairTrackingPath()} replace />
  }

  if (isLoading) {
    return (
      <section className="mx-auto w-full min-w-0 max-w-4xl space-y-5">
        <Skeleton className="h-9 w-40" />
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-2 gap-3">
          {Array.from({ length: 8 }).map((_, index) => (
            <Skeleton key={index} className="h-20 rounded-lg" />
          ))}
        </div>
      </section>
    )
  }

  if (isError || !job) {
    return (
      <section className="mx-auto w-full min-w-0 max-w-4xl space-y-5">
        <Button variant="ghost" className="-ml-2 h-9 w-fit px-2" onClick={() => navigate(getRepairTrackingPath())}>
          <ArrowLeft className="h-4 w-4 shrink-0" />
          Back to repair tracking
        </Button>
        <Card className="border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          {error instanceof Error ? error.message : 'Repair job not found.'}
        </Card>
      </section>
    )
  }

  const jobParts = job.parts ?? []
  const jobComments = [...getJobComments(job.activityLogs ?? [])].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  )
  const isRepeatEditMode = hasPendingRepeatSchedule(job)
  const prioritySeverity = getPrioritySeverityClass(job.priority)
  const assignedLabel = job.assignedToOfficeStaff
    ? `${job.assignedToOfficeStaff.nickName}${job.assignedToOfficeStaff.designation ? ` (${job.assignedToOfficeStaff.designation})` : ''}`
    : 'Unassigned'
  const driverLabel = job.reportedDriver
    ? `${job.reportedDriver.driverIdNumber} — ${job.reportedDriver.aadharName || job.reportedDriver.dlName}`
    : 'None'

  return (
    <section className="mx-auto w-full min-w-0 max-w-4xl space-y-5">
      <header className="space-y-3">
        <Button
          variant="ghost"
          className="-ml-2 h-9 w-fit px-2 sm:-ml-3 sm:px-4"
          onClick={() => navigate(getRepairTrackingPath())}
        >
          <ArrowLeft className="h-4 w-4 shrink-0" />
          <span className="sm:hidden">Back</span>
          <span className="hidden sm:inline">Back to repair tracking</span>
        </Button>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 flex-1 items-start gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-orange-500/10 text-orange-600 shadow-sm dark:text-orange-400 sm:size-11">
              <Wrench className="size-5" />
            </div>
            <div className="min-w-0 flex-1 space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="font-mono text-xl font-semibold tracking-tight sm:text-2xl">{job.jobIdNumber}</h1>
                <span
                  className={`ticket-grid__severity-badge ticket-grid__severity-badge--${prioritySeverity}`}
                >
                  {formatJobPriority(job.priority).toUpperCase()}
                </span>
                {job.isRepeatJob ? (
                  <span className="ticket-grid__severity-badge ticket-grid__severity-badge--medium">
                    Repeat job
                  </span>
                ) : null}
                {hasPendingRepeatSchedule(job) ? (
                  <span className="ticket-grid__severity-badge ticket-grid__severity-badge--high">
                    <CalendarClock className="mr-1 inline h-3 w-3" />
                    Repeat {formatRepeatScheduledDate(job.repeatScheduledFor)}
                  </span>
                ) : null}
                {hasProcessedRepeatSchedule(job) ? (
                  <span className="ticket-grid__severity-badge ticket-grid__severity-badge--low">
                    Repeat created
                  </span>
                ) : null}
              </div>
              {job.isRepeatJob && job.previousJob ? (
                <p className="text-sm text-muted-foreground">
                  Follow-up from{' '}
                  <Link
                    to={getJobDetailsPath(job.previousJob.id)}
                    className="font-medium text-primary hover:underline"
                  >
                    {job.previousJob.jobIdNumber}
                  </Link>
                </p>
              ) : null}
              <p className="text-sm text-muted-foreground capitalize">{formatJobStatus(job.status)}</p>
            </div>
          </div>
          <div className="flex w-full gap-2 sm:w-auto">
            {jobActions.canEdit ? (
              <Button
                className="min-w-0 flex-1 sm:w-auto sm:flex-none"
                onClick={() => navigate(getJobEditPath(job.id))}
              >
                <Pencil className="h-4 w-4 shrink-0" />
                Edit Job
              </Button>
            ) : null}
            {canViewJob ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    className={cn('shrink-0 gap-1.5 sm:hidden', !jobActions.canEdit && 'flex-1')}
                    aria-label="Job actions"
                  >
                    <MoreHorizontal className="h-4 w-4" />
                    Actions
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem disabled={!canAddParts} onClick={() => setAddPartOpen(true)}>
                    <PackagePlus className="h-4 w-4" />
                    Add Spare Parts
                  </DropdownMenuItem>
                  {!job.isRepeatJob ? (
                    <DropdownMenuItem
                      disabled={!canAddParts}
                      onClick={() => {
                        if (!canAddParts) {
                          toast.error('You do not have permission to schedule repeat jobs.')
                          return
                        }
                        setRepeatJobOpen(true)
                      }}
                    >
                      <Repeat2 className="h-4 w-4" />
                      {isRepeatEditMode ? 'Edit Repeat Job' : 'Create Repeat Job'}
                    </DropdownMenuItem>
                  ) : null}
                  <DropdownMenuItem onClick={() => toast.info('Download will be available soon.')}>
                    <Download className="h-4 w-4" />
                    Download
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => toast.info('Job history will be available soon.')}>
                    <History className="h-4 w-4" />
                    History
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setShowCommentForm((open) => !open)}>
                    <MessageSquarePlus className="h-4 w-4" />
                    Add Comment
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : null}
          </div>
        </div>
      </header>

      <Card className="space-y-4 p-4 sm:p-5">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Job Details</h2>
        <MasterDetailGrid columns="threeColLg">
          <DetailItem label="Bus Number" value={job.bus.busNumber} />
          <DetailItem label="Repair Category" value={job.repairCategory.name} />
          <DetailItem label="Status" value={formatJobStatus(job.status)} className="capitalize" />
          <DetailItem label="Odometer (km)" value={job.odometerReading.toLocaleString()} />
          <DetailItem label="Assigned To" value={assignedLabel} />
          <DetailItem label="Reported Driver" value={driverLabel} />
          <DetailItem label="Created By" value={job.createdBy.displayName || job.createdBy.username || 'Unknown'} />
          <DetailItem label="Created At" value={formatJobDate(job.createdAt)} />
          <DetailItem label="Updated At" value={formatJobDate(job.updatedAt)} />
          <DetailItem label="Repeat Job" value={job.isRepeatJob ? 'Yes' : 'No'} />
        </MasterDetailGrid>

        <div className="space-y-3">
          <div className="space-y-1 rounded-lg border bg-background px-3 py-2.5">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Description</p>
            <p className="text-sm leading-6 text-foreground">{job.description}</p>
          </div>

          {jobComments.length > 0 ? (
            <div className="space-y-2">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Comments</p>
              <ul className="divide-y rounded-lg border">
                {jobComments.map((comment) => (
                  <li key={comment.id} className="space-y-1 px-3 py-2.5">
                    <p className="text-sm leading-6 text-foreground">{comment.note}</p>
                    <p className="text-xs text-muted-foreground">{formatCommentMeta(comment)}</p>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {showCommentForm ? (
            <div className="space-y-2 rounded-lg border bg-muted/20 px-3 py-3">
              <label htmlFor="jobCommentNote" className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Add comment
              </label>
              <Textarea
                id="jobCommentNote"
                className="min-h-24 bg-background"
                value={commentNote}
                onChange={(event) => setCommentNote(event.target.value)}
                disabled={commentMutation.isPending}
                placeholder="Enter your comment..."
                maxLength={2000}
              />
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  size="sm"
                  onClick={handleSubmitComment}
                  disabled={commentMutation.isPending || !commentNote.trim()}
                >
                  {commentMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  Submit
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={commentMutation.isPending}
                  onClick={() => {
                    setShowCommentForm(false)
                    setCommentNote('')
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : null}
        </div>

        {canViewJob ? (
          <div className="hidden flex-wrap gap-2 border-t pt-4 sm:flex">
            <Button
              type="button"
              variant="outline"
              onClick={() => setAddPartOpen(true)}
              disabled={!canAddParts}
            >
              <PackagePlus className="h-4 w-4" />
              Add Spare Parts
            </Button>
            {!job.isRepeatJob ? (
              <Button
                type="button"
                variant="outline"
                disabled={!canAddParts}
                onClick={() => {
                  if (!canAddParts) {
                    toast.error('You do not have permission to schedule repeat jobs.')
                    return
                  }
                  setRepeatJobOpen(true)
                }}
              >
                <Repeat2 className="h-4 w-4" />
                {isRepeatEditMode ? 'Edit Repeat Job' : 'Create Repeat Job'}
              </Button>
            ) : null}
            <Button
              type="button"
              variant="outline"
              onClick={() => toast.info('Download will be available soon.')}
            >
              <Download className="h-4 w-4" />
              Download
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => toast.info('Job history will be available soon.')}
            >
              <History className="h-4 w-4" />
              History
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowCommentForm((open) => !open)}
            >
              <MessageSquarePlus className="h-4 w-4" />
              Add Comment
            </Button>
          </div>
        ) : null}

        {jobParts.length > 0 ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Spare Parts Used
              </h3>
              <p className="text-sm font-semibold text-primary">
                Total: {formatJobPartsTotal(jobParts)}
              </p>
            </div>
            <ul className="divide-y rounded-lg border">
              {jobParts.map((part) => (
                <li key={part.id} className="space-y-1 px-3 py-2.5 text-sm">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <p className="min-w-0 flex-1 font-medium text-foreground">{part.repairPart.partName}</p>
                    <div className="flex shrink-0 items-center gap-2">
                      <p className="font-semibold text-primary">{formatJobPartLineTotal(part)}</p>
                      {canAddParts ? (
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
                          aria-label={`Remove ${part.repairPart.partName}`}
                          onClick={() => setRemovePartTarget(part)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      ) : null}
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Qty {part.quantity} × {formatRepairPartPrice(part.unitPrice)} · Added by{' '}
                    {part.addedBy.displayName || part.addedBy.username || 'Unknown'} ·{' '}
                    {formatJobPartAddedAt(part.createdAt)}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </Card>

      {jobId ? (
        <>
          <AddJobPartDialog open={addPartOpen} jobId={jobId} onOpenChange={setAddPartOpen} />
          {!job.isRepeatJob ? (
            <ScheduleRepeatJobDialog
              open={repeatJobOpen}
              onOpenChange={setRepeatJobOpen}
              jobId={job.id}
              jobIdNumber={job.jobIdNumber}
              repeatScheduledFor={job.repeatScheduledFor ?? null}
              repeatProcessedAt={job.repeatProcessedAt ?? null}
            />
          ) : null}
        </>
      ) : null}

      <AlertDialog
        open={Boolean(removePartTarget)}
        onOpenChange={(open) => !open && setRemovePartTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove spare part?</AlertDialogTitle>
            <AlertDialogDescription>
              {removePartTarget
                ? `Remove "${removePartTarget.repairPart.partName}" (qty ${removePartTarget.quantity}) from this repair job? This cannot be undone.`
                : 'This action cannot be undone.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={removePartMutation.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="border-red-600 bg-red-600 text-white hover:bg-red-700"
              onClick={confirmRemovePart}
              disabled={removePartMutation.isPending}
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <p className="text-center text-xs text-muted-foreground">
        <Link to={getRepairTrackingPath()} className="font-medium text-primary hover:underline">
          Return to repair tracking
        </Link>
      </p>
    </section>
  )
}
