import type { JobStatus, RepairJobActivityLog, RepairJobActivityType } from '@/features/garage/types/job'
import { formatJobDate, formatJobStatus } from '@/features/garage/utils/job-list-model'

const COMMENT_NOTE_MAX = 2000

const ACTIVITY_LABELS: Record<RepairJobActivityType, string> = {
  created: 'Job created',
  status_changed: 'Status changed',
  commented: 'Comment added',
  closed: 'Job closed',
  cancelled: 'Job cancelled',
}

export function getJobComments(activityLogs: RepairJobActivityLog[] | undefined): RepairJobActivityLog[] {
  if (!activityLogs?.length) return []
  return activityLogs.filter((log) => log.actionType === 'commented')
}

export function formatCommentActor(log: RepairJobActivityLog): string {
  return log.actor.displayName || log.actor.username || 'Unknown'
}

export function formatCommentMeta(log: RepairJobActivityLog): string {
  return `${formatCommentActor(log)} · ${formatJobDate(log.createdAt)}`
}

export function formatActivityLabel(actionType: RepairJobActivityType): string {
  return ACTIVITY_LABELS[actionType] ?? actionType.replace(/_/g, ' ')
}

export function formatActivityActor(log: RepairJobActivityLog): string {
  const name = log.actor.displayName || 'Unknown'
  const username = log.actor.username
  return username ? `${name} (@${username})` : name
}

export function getActivityActorInitials(log: RepairJobActivityLog): string {
  const name = log.actor.displayName || log.actor.username || 'System'
  const words = name.trim().split(/\s+/).filter(Boolean)

  if (words.length >= 2) {
    return `${words[0]?.[0] ?? ''}${words[1]?.[0] ?? ''}`.toUpperCase()
  }

  return name.slice(0, 2).toUpperCase()
}

export function formatStatusTransition(
  fromStatus: JobStatus | null,
  toStatus: JobStatus | null,
): string | null {
  if (!fromStatus && !toStatus) return null
  if (!fromStatus && toStatus) return formatJobStatus(toStatus)
  if (fromStatus && toStatus) {
    return `${formatJobStatus(fromStatus)} → ${formatJobStatus(toStatus)}`
  }
  return fromStatus ? formatJobStatus(fromStatus) : null
}

export function getActivityToneClass(actionType: RepairJobActivityType): string {
  switch (actionType) {
    case 'created':
      return 'border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-800/60 dark:bg-orange-950/40 dark:text-orange-300'
    case 'status_changed':
      return 'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800/60 dark:bg-blue-950/40 dark:text-blue-300'
    case 'commented':
      return 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800/60 dark:bg-emerald-950/40 dark:text-emerald-300'
    case 'closed':
      return 'border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-800/60 dark:bg-violet-950/40 dark:text-violet-300'
    case 'cancelled':
      return 'border-red-200 bg-red-50 text-red-700 dark:border-red-800/60 dark:bg-red-950/40 dark:text-red-300'
    default:
      return 'border-border bg-muted/50 text-foreground'
  }
}

export function getActivityDotClass(actionType: RepairJobActivityType): string {
  switch (actionType) {
    case 'created':
      return 'bg-orange-500 ring-orange-500/25'
    case 'status_changed':
      return 'bg-blue-500 ring-blue-500/25'
    case 'commented':
      return 'bg-emerald-500 ring-emerald-500/25'
    case 'closed':
      return 'bg-violet-500 ring-violet-500/25'
    case 'cancelled':
      return 'bg-red-500 ring-red-500/25'
    default:
      return 'bg-muted-foreground ring-muted-foreground/25'
  }
}

export function validateJobCommentNote(note: string): string | undefined {
  const trimmed = note.trim()
  if (!trimmed) return 'Comment is required.'
  if (trimmed.length > COMMENT_NOTE_MAX) {
    return `Comment must be ${COMMENT_NOTE_MAX} characters or fewer.`
  }
  return undefined
}
