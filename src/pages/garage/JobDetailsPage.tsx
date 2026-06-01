import { useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { ArrowLeft, Loader2, Trash2 } from 'lucide-react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { QRCodeSVG } from 'qrcode.react'
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
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'
import '@/features/tickets/styles/tickets-grid.css'

import { garageService } from '@/features/garage/api/garage.service'
import { AddJobPartDialog } from '@/features/garage/components/add-job-part-dialog'
import { EditableJobStatus } from '@/features/garage/components/editable-job-status'
import { JobDetailsHeader } from '@/features/garage/components/job-details-header'
import { JobHistorySheet } from '@/features/garage/components/job-history-sheet'
import { ScheduleRepeatJobDialog } from '@/features/garage/components/schedule-repeat-job-dialog'
import { formatJobDate } from '@/features/garage/utils/job-list-model'
import {
  formatJobPartAddedAt,
  formatJobPartLineTotal,
  formatJobPartsTotal,
} from '@/features/garage/utils/job-part-model'
import { formatRepairPartPrice } from '@/features/garage/utils/repair-part-model'
import { getJobEditPath, getRepairTrackingPath } from '@/features/garage/utils/job-routes'
import { getJobShareUrl } from '@/features/garage/utils/job-share'
import {
  formatCommentMeta,
  getJobComments,
  validateJobCommentNote,
} from '@/features/garage/utils/job-activity-model'
import { downloadRepairJobPdf } from '@/features/garage/utils/download-repair-job-pdf'
import { hasPendingRepeatSchedule } from '@/features/garage/utils/job-repeat-model'
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
  const [historyOpen, setHistoryOpen] = useState(false)
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
      queryClient.invalidateQueries({ queryKey: ['garage', 'jobs', jobId, 'timeline'] })
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

  async function handleDownloadPdf() {
    if (!job) return
    try {
      await downloadRepairJobPdf(job)
      toast.success('Repair job downloaded as PDF.')
    } catch (error) {
      console.error('Repair job PDF download failed:', error)
      toast.error('Failed to download PDF file.')
    }
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
  const assignedLabel = job.assignedToOfficeStaff
    ? `${job.assignedToOfficeStaff.nickName}${job.assignedToOfficeStaff.designation ? ` (${job.assignedToOfficeStaff.designation})` : ''}`
    : 'Unassigned'
  const driverLabel = job.reportedDriver
    ? `${job.reportedDriver.driverIdNumber} — ${job.reportedDriver.aadharName || job.reportedDriver.dlName}`
    : 'None'
  const jobViewUrl = getJobShareUrl(job.id)

  return (
    <section className="mx-auto w-full min-w-0 max-w-4xl space-y-5">
      <JobDetailsHeader
        job={job}
        canViewJob={canViewJob}
        canEditJob={jobActions.canEdit}
        canAddParts={canAddParts}
        isRepeatEditMode={isRepeatEditMode}
        onBack={() => navigate(getRepairTrackingPath())}
        onEdit={() => navigate(getJobEditPath(job.id))}
        onAddPart={() => setAddPartOpen(true)}
        onScheduleRepeat={() => {
          if (!canAddParts) {
            toast.error('You do not have permission to schedule repeat jobs.')
            return
          }
          setRepeatJobOpen(true)
        }}
        onDownload={handleDownloadPdf}
        onHistory={() => setHistoryOpen(true)}
        onToggleComment={() => setShowCommentForm((open) => !open)}
      />

      <Card className="space-y-4 p-4 sm:p-5">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Job Details</h2>
        <MasterDetailGrid columns="threeColLg">
          <DetailItem label="Bus Number" value={job.bus.busNumber} />
          <DetailItem label="Repair Category" value={job.repairCategory.name} />
          <div className="space-y-1 rounded-lg border bg-muted/20 px-3 py-2.5">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Status</p>
            <EditableJobStatus
              jobId={job.id}
              status={job.status}
              canEdit={jobActions.canEdit}
              className="text-sm"
            />
          </div>
          <DetailItem label="Odometer (km)" value={job.odometerReading.toLocaleString()} />
          <DetailItem label="Assigned To" value={assignedLabel} />
          <DetailItem label="Reported Driver" value={driverLabel} />
          <DetailItem label="Created By" value={job.createdBy.displayName || job.createdBy.username || 'Unknown'} />
          <DetailItem label="Created At" value={formatJobDate(job.createdAt)} />
          <DetailItem label="Updated At" value={formatJobDate(job.updatedAt)} />
          <DetailItem label="Repeat Job" value={job.isRepeatJob ? 'Yes' : 'No'} />
        </MasterDetailGrid>

        <div className="space-y-2 rounded-lg border bg-background px-3 py-2.5">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Repair Job QR</p>
          <div className="flex flex-col items-center gap-3 sm:flex-row sm:items-start">
            <div className="shrink-0 rounded-md border bg-white p-2">
              <QRCodeSVG value={jobViewUrl} size={76} />
            </div>
            <p className="w-full break-all text-center text-xs text-muted-foreground sm:text-left">{jobViewUrl}</p>
          </div>
        </div>

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
          <JobHistorySheet
            open={historyOpen}
            onOpenChange={setHistoryOpen}
            jobId={job.id}
            jobIdNumber={job.jobIdNumber}
            currentStatus={job.status}
          />
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
