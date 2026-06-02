import {
  ArrowLeft,
  ArrowRightLeft,
  CalendarClock,
  Download,
  History,
  MessageSquarePlus,
  MoreHorizontal,
  PackagePlus,
  Pencil,
  Repeat2,
  Wrench,
} from 'lucide-react'
import { Link } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  formatJobPriority,
  formatJobStatus,
  getPrioritySeverityClass,
} from '@/features/garage/utils/job-list-model'
import {
  formatRepeatScheduledDate,
  hasPendingRepeatSchedule,
  hasProcessedRepeatSchedule,
} from '@/features/garage/utils/job-repeat-model'
import { isTerminalJobStatus } from '@/features/garage/utils/job-status-transition'
import { getJobDetailsPath } from '@/features/garage/utils/job-routes'
import type { JobPriority, JobStatus, RepairJob } from '@/features/garage/types/job'
import { cn } from '@/lib/utils'

type JobDetailsHeaderProps = {
  job: RepairJob
  canViewJob: boolean
  canEditJob: boolean
  canAddParts: boolean
  isRepeatEditMode: boolean
  onBack: () => void
  onEdit: () => void
  onAddPart: () => void
  onScheduleRepeat: () => void
  onDownload: () => void
  onHistory: () => void
  onToggleComment: () => void
  onUpdateStatus: () => void
}

function StatusPill({ status }: { status: JobStatus }) {
  return (
    <span className="inline-flex items-center rounded-md border border-border bg-background px-2.5 py-0.5 text-xs font-medium capitalize text-foreground">
      {formatJobStatus(status)}
    </span>
  )
}

function PriorityPill({ priority }: { priority: JobPriority }) {
  const severity = getPrioritySeverityClass(priority)

  return (
    <span
      className={cn(
        `ticket-grid__severity-badge ticket-grid__severity-badge--${severity}`,
        'text-[11px] font-semibold normal-case',
      )}
    >
      {formatJobPriority(priority)}
    </span>
  )
}

function RepeatContext({ job }: { job: RepairJob }) {
  if (job.isRepeatJob && job.previousJob) {
    return (
      <p className="text-sm text-muted-foreground">
        Follow-up from{' '}
        <Link
          to={getJobDetailsPath(job.previousJob.id)}
          className="font-medium text-primary hover:underline"
        >
          {job.previousJob.jobIdNumber}
        </Link>
      </p>
    )
  }

  if (hasPendingRepeatSchedule(job)) {
    return (
      <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <CalendarClock className="size-3.5 shrink-0 text-amber-600 dark:text-amber-400" aria-hidden />
        <span>
          Repeat scheduled for{' '}
          <span className="font-medium text-foreground">
            {formatRepeatScheduledDate(job.repeatScheduledFor)}
          </span>
        </span>
      </p>
    )
  }

  if (hasProcessedRepeatSchedule(job)) {
    return (
      <p className="text-sm text-muted-foreground">
        A follow-up repeat job was created from this job.
      </p>
    )
  }

  return null
}

function JobActionsMenu({
  job,
  canViewJob,
  canEditJob,
  canAddParts,
  isRepeatEditMode,
  onAddPart,
  onScheduleRepeat,
  onDownload,
  onHistory,
  onToggleComment,
  onUpdateStatus,
}: Pick<
  JobDetailsHeaderProps,
  | 'job'
  | 'canViewJob'
  | 'canEditJob'
  | 'canAddParts'
  | 'isRepeatEditMode'
  | 'onAddPart'
  | 'onScheduleRepeat'
  | 'onDownload'
  | 'onHistory'
  | 'onToggleComment'
  | 'onUpdateStatus'
>) {
  if (!canViewJob) return null

  const canUpdateStatus = canEditJob && !isTerminalJobStatus(job.status)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button type="button" variant="outline" size="sm" className="gap-1.5" aria-label="More job actions">
          <MoreHorizontal className="size-4" />
          <span className="hidden sm:inline">More</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        {canViewJob ? (
          <>
            <DropdownMenuItem disabled={!canAddParts} onClick={onAddPart}>
              <PackagePlus className="size-4" />
              Add spare parts
            </DropdownMenuItem>
            {!job.isRepeatJob ? (
              <DropdownMenuItem disabled={!canAddParts} onClick={onScheduleRepeat}>
                <Repeat2 className="size-4" />
                {isRepeatEditMode ? 'Edit repeat schedule' : 'Schedule repeat job'}
              </DropdownMenuItem>
            ) : null}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onDownload}>
              <Download className="size-4" />
              Download PDF
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onHistory}>
              <History className="size-4" />
              View history
            </DropdownMenuItem>
            {canUpdateStatus ? (
              <DropdownMenuItem onClick={onUpdateStatus}>
                <ArrowRightLeft className="size-4" />
                Update status
              </DropdownMenuItem>
            ) : null}
            <DropdownMenuItem onClick={onToggleComment}>
              <MessageSquarePlus className="size-4" />
              Add comment
            </DropdownMenuItem>
          </>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export function JobDetailsHeader({
  job,
  canViewJob,
  canEditJob,
  canAddParts,
  isRepeatEditMode,
  onBack,
  onEdit,
  onAddPart,
  onScheduleRepeat,
  onDownload,
  onHistory,
  onToggleComment,
  onUpdateStatus,
}: JobDetailsHeaderProps) {
  const repeatContext = <RepeatContext job={job} />
  const showActions = canViewJob || canEditJob

  return (
    <header className="space-y-3">
      <Button
        variant="ghost"
        className="-ml-2 h-9 w-fit px-2 text-muted-foreground hover:text-foreground sm:-ml-3 sm:px-4"
        onClick={onBack}
      >
        <ArrowLeft className="size-4 shrink-0" />
        <span className="sm:hidden">Back</span>
        <span className="hidden sm:inline">Repair tracking</span>
      </Button>

      <div className="rounded-xl border bg-card p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 space-y-3">
            <div className="flex items-start gap-3">
              <div
                className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-orange-500/10 text-orange-600 dark:text-orange-400 sm:size-11"
                aria-hidden
              >
                <Wrench className="size-5" />
              </div>
              <div className="min-w-0 space-y-1">
                <h1 className="font-mono text-xl font-semibold tracking-tight sm:text-2xl">
                  {job.jobIdNumber}
                </h1>
                <p className="text-sm text-muted-foreground">
                  Bus {job.bus.busNumber}
                  <span className="mx-1.5 text-border" aria-hidden>
                    ·
                  </span>
                  {job.repairCategory.name}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <StatusPill status={job.status} />
              <PriorityPill priority={job.priority} />
              {job.isRepeatJob ? (
                <span className="inline-flex items-center rounded-md border border-dashed border-border bg-muted/30 px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                  Repeat job
                </span>
              ) : null}
            </div>

            {repeatContext}
          </div>

          {showActions ? (
            <div className="flex w-full shrink-0 gap-2 sm:w-auto">
              {canEditJob ? (
                <>
                  {!isTerminalJobStatus(job.status) ? (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="min-w-0 flex-1 sm:flex-initial"
                      onClick={onUpdateStatus}
                    >
                      <ArrowRightLeft className="size-4 shrink-0" />
                      Update status
                    </Button>
                  ) : null}
                  <Button size="sm" className="min-w-0 flex-1 sm:flex-initial" onClick={onEdit}>
                    <Pencil className="size-4 shrink-0" />
                    Edit job
                  </Button>
                </>
              ) : null}
              <JobActionsMenu
                job={job}
                canViewJob={canViewJob}
                canEditJob={canEditJob}
                canAddParts={canAddParts}
                isRepeatEditMode={isRepeatEditMode}
                onAddPart={onAddPart}
                onScheduleRepeat={onScheduleRepeat}
                onDownload={onDownload}
                onHistory={onHistory}
                onToggleComment={onToggleComment}
                onUpdateStatus={onUpdateStatus}
              />
            </div>
          ) : null}
        </div>
      </div>
    </header>
  )
}
