import { useState, type ReactNode } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
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
import { JobDetailsHeader } from '@/features/garage/components/job-details-header'
import { JobHistorySheet } from '@/features/garage/components/job-history-sheet'
import { ScheduleRepeatJobDialog } from '@/features/garage/components/schedule-repeat-job-dialog'
import { UpdateJobStatusDialog } from '@/features/garage/components/update-job-status-dialog'
import { formatJobDate, formatJobStatus } from '@/features/garage/utils/job-list-model'
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
import { useIsMobile } from '@/hooks/use-mobile'
import { usePermissions, useSubmoduleActions } from '@/hooks/use-permissions'
import { queryClient } from '@/lib/query/query-client'
import { cn } from '@/lib/utils'

const easeOutExpo = [0.22, 1, 0.36, 1] as const

const pageVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.1, delayChildren: 0.04 },
  },
  exit: {
    opacity: 0,
    transition: { duration: 0.18 },
  },
}

const blockVariants = {
  hidden: { opacity: 0, y: 16, scale: 0.985 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.4, ease: easeOutExpo },
  },
}

const contentStaggerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.045, delayChildren: 0.08 },
  },
}

const fieldVariants = {
  hidden: { opacity: 0, y: 10, scale: 0.97 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.3, ease: easeOutExpo },
  },
}

const skeletonListVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.05, delayChildren: 0.04 },
  },
  exit: {
    opacity: 0,
    transition: { duration: 0.15 },
  },
}

const skeletonItemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, ease: easeOutExpo },
  },
}

function DetailItem({
  label,
  value,
  className,
  animate,
}: {
  label: string
  value: string
  className?: string
  animate?: boolean
}) {
  const content = (
    <div className={cn('space-y-1 rounded-lg border bg-muted/20 px-3 py-2.5', className)}>
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="text-sm font-medium text-foreground">{value}</p>
    </div>
  )

  if (!animate) return content

  return <motion.div variants={fieldVariants}>{content}</motion.div>
}

function AnimatedSection({
  animate,
  children,
  className,
}: {
  animate: boolean
  children: ReactNode
  className?: string
}) {
  if (!animate) {
    return <div className={className}>{children}</div>
  }

  return (
    <motion.div className={className} variants={fieldVariants}>
      {children}
    </motion.div>
  )
}

function JobDetailsSkeleton({ animate }: { animate: boolean }) {
  return (
    <motion.section
      key="job-details-loading"
      className="mx-auto w-full min-w-0 max-w-4xl space-y-5"
      variants={animate ? skeletonListVariants : undefined}
      initial={animate ? 'hidden' : false}
      animate={animate ? 'visible' : undefined}
      exit={animate ? 'exit' : undefined}
    >
      <motion.div variants={animate ? skeletonItemVariants : undefined}>
        <Skeleton className="h-9 w-40" />
      </motion.div>
      <motion.div variants={animate ? skeletonItemVariants : undefined}>
        <Skeleton className="h-28 w-full rounded-xl sm:h-32" />
      </motion.div>
      <motion.div
        className="grid grid-cols-2 gap-3"
        variants={animate ? skeletonListVariants : undefined}
      >
        {Array.from({ length: 8 }).map((_, index) => (
          <motion.div key={index} variants={animate ? skeletonItemVariants : undefined}>
            <Skeleton className="h-20 rounded-lg" />
          </motion.div>
        ))}
      </motion.div>
    </motion.section>
  )
}

export function JobDetailsPage() {
  const navigate = useNavigate()
  const { jobId } = useParams()
  const jobActions = useSubmoduleActions('garage', 'repair_job')
  const { has, can } = usePermissions()
  const canViewJob = has('garage', 'repair_job', 'view')
  const canAddParts = can('garage', 'repair_job', 'edit')
  const isMobile = useIsMobile()
  const shouldReduceMotion = useReducedMotion()
  const animateMobile = isMobile && !shouldReduceMotion
  const [addPartOpen, setAddPartOpen] = useState(false)
  const [repeatJobOpen, setRepeatJobOpen] = useState(false)
  const [historyOpen, setHistoryOpen] = useState(false)
  const [statusDialogOpen, setStatusDialogOpen] = useState(false)
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
    } catch (downloadError) {
      console.error('Repair job PDF download failed:', downloadError)
      toast.error('Failed to download PDF file.')
    }
  }

  if (!jobId) {
    return <Navigate to={getRepairTrackingPath()} replace />
  }

  if (isError || (!isLoading && !job)) {
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

  const jobParts = job?.parts ?? []
  const jobComments = job
    ? [...getJobComments(job.activityLogs ?? [])].sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      )
    : []
  const isRepeatEditMode = job ? hasPendingRepeatSchedule(job) : false
  const assignedLabel = job?.assignedToOfficeStaff
    ? `${job.assignedToOfficeStaff.nickName}${job.assignedToOfficeStaff.designation ? ` (${job.assignedToOfficeStaff.designation})` : ''}`
    : 'Unassigned'
  const driverLabel = job?.reportedDriver
    ? `${job.reportedDriver.driverIdNumber} — ${job.reportedDriver.aadharName || job.reportedDriver.dlName}`
    : 'None'
  const jobViewUrl = job ? getJobShareUrl(job.id) : ''

  const pageMotionProps = animateMobile
    ? {
        variants: pageVariants,
        initial: 'hidden' as const,
        animate: 'visible' as const,
        exit: 'exit' as const,
      }
    : {}

  const blockMotionProps = animateMobile ? { variants: blockVariants } : {}
  const contentMotionProps = animateMobile
    ? {
        variants: contentStaggerVariants,
        initial: 'hidden' as const,
        animate: 'visible' as const,
      }
    : {}

  return (
    <AnimatePresence mode="wait">
      {isLoading || !job ? (
        <JobDetailsSkeleton animate={animateMobile} />
      ) : (
        <motion.section
          key="job-details-content"
          className="mx-auto w-full min-w-0 max-w-4xl space-y-5"
          {...pageMotionProps}
        >
          <motion.div {...blockMotionProps}>
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
              onUpdateStatus={() => setStatusDialogOpen(true)}
            />
          </motion.div>

          <motion.div {...blockMotionProps}>
            <Card className="overflow-hidden p-0">
              <motion.div className="space-y-4 p-4 sm:p-5" {...contentMotionProps}>
                <AnimatedSection animate={animateMobile}>
                  <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Job Details</h2>
                </AnimatedSection>

                <motion.div
                  {...(animateMobile
                    ? {
                        variants: contentStaggerVariants,
                      }
                    : {})}
                >
                  <MasterDetailGrid columns="threeColLg">
                    <DetailItem label="Bus Number" value={job.bus.busNumber} animate={animateMobile} />
                    <DetailItem label="Repair Category" value={job.repairCategory.name} animate={animateMobile} />
                    <DetailItem
                      label="Status"
                      value={formatJobStatus(job.status)}
                      className="capitalize"
                      animate={animateMobile}
                    />
                    <DetailItem
                      label="Odometer (km)"
                      value={job.odometerReading.toLocaleString()}
                      animate={animateMobile}
                    />
                    <DetailItem label="Assigned To" value={assignedLabel} animate={animateMobile} />
                    <DetailItem label="Reported Driver" value={driverLabel} animate={animateMobile} />
                    <DetailItem
                      label="Created By"
                      value={job.createdBy.displayName || job.createdBy.username || 'Unknown'}
                      animate={animateMobile}
                    />
                    <DetailItem label="Created At" value={formatJobDate(job.createdAt)} animate={animateMobile} />
                    <DetailItem label="Updated At" value={formatJobDate(job.updatedAt)} animate={animateMobile} />
                    {job.closedAt ? (
                      <DetailItem label="Closed At" value={formatJobDate(job.closedAt)} animate={animateMobile} />
                    ) : null}
                    <DetailItem label="Repeat Job" value={job.isRepeatJob ? 'Yes' : 'No'} animate={animateMobile} />
                  </MasterDetailGrid>
                </motion.div>

                <AnimatedSection
                  animate={animateMobile}
                  className="space-y-2 rounded-lg border bg-background px-3 py-2.5"
                >
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Repair Job QR</p>
                  <div className="flex flex-col items-center gap-3 sm:flex-row sm:items-start">
                    <div className="shrink-0 rounded-md border bg-white p-2">
                      <QRCodeSVG value={jobViewUrl} size={76} />
                    </div>
                    <p className="w-full break-all text-center text-xs text-muted-foreground sm:text-left">
                      {jobViewUrl}
                    </p>
                  </div>
                </AnimatedSection>

                <AnimatedSection animate={animateMobile} className="space-y-3">
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
                      <label
                        htmlFor="jobCommentNote"
                        className="text-xs font-medium uppercase tracking-wide text-muted-foreground"
                      >
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
                </AnimatedSection>

                {jobParts.length > 0 ? (
                  <AnimatedSection animate={animateMobile} className="space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                        Spare Parts Used
                      </h3>
                      <p className="text-sm font-semibold text-primary">Total: {formatJobPartsTotal(jobParts)}</p>
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
                  </AnimatedSection>
                ) : null}
              </motion.div>
            </Card>
          </motion.div>

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
              <UpdateJobStatusDialog job={job} open={statusDialogOpen} onOpenChange={setStatusDialogOpen} />
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

          <motion.p
            className="text-center text-xs text-muted-foreground"
            {...(animateMobile ? { variants: fieldVariants } : {})}
          >
            <Link to={getRepairTrackingPath()} className="font-medium text-primary hover:underline">
              Return to repair tracking
            </Link>
          </motion.p>
        </motion.section>
      )}
    </AnimatePresence>
  )
}
