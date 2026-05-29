import type { RepairJobActivityLog } from '@/features/garage/types/job'
import { formatJobDate } from '@/features/garage/utils/job-list-model'

const COMMENT_NOTE_MAX = 2000

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

export function validateJobCommentNote(note: string): string | undefined {
  const trimmed = note.trim()
  if (!trimmed) return 'Comment is required.'
  if (trimmed.length > COMMENT_NOTE_MAX) {
    return `Comment must be ${COMMENT_NOTE_MAX} characters or fewer.`
  }
  return undefined
}
