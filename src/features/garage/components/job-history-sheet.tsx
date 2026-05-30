import { useQuery } from '@tanstack/react-query'
import {
  ArrowRightLeft,
  CheckCircle2,
  History,
  MessageSquare,
  PlusCircle,
  RefreshCw,
  XCircle,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Skeleton } from '@/components/ui/skeleton'
import { garageService } from '@/features/garage/api/garage.service'
import type { JobStatus, RepairJobActivityLog, RepairJobActivityType } from '@/features/garage/types/job'
import {
  formatActivityActor,
  formatActivityLabel,
  formatStatusTransition,
  getActivityActorInitials,
  getActivityDotClass,
  getActivityToneClass,
} from '@/features/garage/utils/job-activity-model'
import { formatJobDate, formatJobStatus } from '@/features/garage/utils/job-list-model'
import { cn } from '@/lib/utils'

type JobHistorySheetProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  jobId: string
  jobIdNumber: string
  currentStatus: JobStatus
}

const ACTIVITY_ICONS: Record<RepairJobActivityType, typeof History> = {
  created: PlusCircle,
  status_changed: ArrowRightLeft,
  commented: MessageSquare,
  closed: CheckCircle2,
  cancelled: XCircle,
}

function TimelineEntry({ entry, isLast }: { entry: RepairJobActivityLog; isLast: boolean }) {
  const Icon = ACTIVITY_ICONS[entry.actionType] ?? History
  const statusTransition = formatStatusTransition(entry.fromStatus, entry.toStatus)
  const showNote = Boolean(entry.note) && entry.actionType !== 'commented' ? entry.note : null
  const commentNote = entry.actionType === 'commented' ? entry.note : null

  return (
    <li className="relative pl-11">
      {!isLast ? (
        <span
          className="absolute left-[1.125rem] top-9 bottom-0 w-px bg-border"
          aria-hidden
        />
      ) : null}
      <span
        className={cn(
          'absolute left-0 top-1 flex size-9 items-center justify-center rounded-full ring-4',
          getActivityDotClass(entry.actionType),
        )}
        aria-hidden
      >
        <Icon className="size-4 text-white" strokeWidth={2.25} />
      </span>
      <article className="rounded-lg border border-border/80 bg-card p-3 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <span
            className={cn(
              'inline-flex rounded-md border px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide',
              getActivityToneClass(entry.actionType),
            )}
          >
            {formatActivityLabel(entry.actionType)}
          </span>
          <time className="text-xs text-muted-foreground" dateTime={entry.createdAt}>
            {formatJobDate(entry.createdAt)}
          </time>
        </div>
        <div className="mt-2 flex items-center gap-2">
          <span className="flex size-7 shrink-0 items-center justify-center rounded-full border border-border bg-muted/40 text-[10px] font-semibold uppercase tracking-wide text-foreground">
            {getActivityActorInitials(entry)}
          </span>
          <p className="text-xs text-muted-foreground">{formatActivityActor(entry)}</p>
        </div>
        {statusTransition ? (
          <p className="mt-2 inline-flex items-center gap-1.5 rounded-md border border-border bg-muted/30 px-2.5 py-1 text-xs capitalize text-foreground">
            {statusTransition}
          </p>
        ) : null}
        {commentNote ? (
          <p className="mt-2 rounded-md border border-border bg-muted/30 p-2.5 text-sm leading-6 text-foreground">
            {commentNote}
          </p>
        ) : null}
        {showNote ? (
          <p className="mt-2 rounded-md border border-dashed border-border/80 bg-muted/20 p-2.5 text-sm leading-6 text-muted-foreground">
            {showNote}
          </p>
        ) : null}
      </article>
    </li>
  )
}

export function JobHistorySheet({
  open,
  onOpenChange,
  jobId,
  jobIdNumber,
  currentStatus,
}: JobHistorySheetProps) {
  const {
    data: timeline,
    isLoading,
    isError,
    error,
    isFetching,
    refetch,
  } = useQuery({
    queryKey: ['garage', 'jobs', jobId, 'timeline'],
    queryFn: () => garageService.getJobTimeline(jobId),
    enabled: open && Boolean(jobId),
  })

  const items = timeline?.items ?? []

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex w-full flex-col gap-0 overflow-hidden p-0 sm:max-w-md">
        <SheetHeader className="space-y-3 border-b px-5 py-5 text-left">
          <div className="flex items-start gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-orange-500/10 text-orange-600 dark:text-orange-400">
              <History className="size-5" />
            </div>
            <div className="min-w-0 space-y-1">
              <SheetTitle className="font-mono text-lg tracking-tight">{jobIdNumber}</SheetTitle>
              <SheetDescription>Full activity timeline for this repair job.</SheetDescription>
            </div>
          </div>
          <div className="flex items-center justify-between gap-2 rounded-lg border bg-muted/20 px-3 py-2">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Current status</p>
            <span className="rounded-md border border-border bg-background px-2 py-0.5 text-xs font-semibold capitalize text-foreground">
              {formatJobStatus(currentStatus)}
            </span>
          </div>
        </SheetHeader>

        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-5 py-4">
          {isLoading ? (
            <div className="space-y-4" aria-busy="true" aria-label="Loading job history">
              {Array.from({ length: 4 }).map((_, index) => (
                <Skeleton key={index} className="h-24 w-full rounded-lg" />
              ))}
            </div>
          ) : isError ? (
            <div className="flex flex-col items-center gap-3 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-8 text-center">
              <p className="text-sm text-destructive">
                {error instanceof Error ? error.message : 'Failed to load job history.'}
              </p>
              <Button type="button" size="sm" variant="outline" onClick={() => refetch()}>
                <RefreshCw className={cn('h-4 w-4', isFetching && 'animate-spin')} />
                Try again
              </Button>
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed px-4 py-12 text-center">
              <History className="size-8 text-muted-foreground/60" />
              <p className="text-sm font-medium text-foreground">No activity yet</p>
              <p className="max-w-xs text-xs text-muted-foreground">
                Status changes, comments, and other updates will appear here as the job progresses.
              </p>
            </div>
          ) : (
            <ul className="space-y-4">
              {items.map((entry, index) => (
                <TimelineEntry key={entry.id} entry={entry} isLast={index === items.length - 1} />
              ))}
            </ul>
          )}
        </div>

        {items.length > 0 ? (
          <div className="border-t px-5 py-3">
            <p className="text-center text-xs text-muted-foreground">
              {items.length} {items.length === 1 ? 'event' : 'events'} · oldest first
            </p>
          </div>
        ) : null}
      </SheetContent>
    </Sheet>
  )
}
