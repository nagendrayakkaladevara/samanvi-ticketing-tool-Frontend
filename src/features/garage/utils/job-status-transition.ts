import type { JobStatus } from '@/features/garage/types/job'
import { formatJobStatus } from '@/features/garage/utils/job-list-model'

export const STATUS_NOTE_MAX_LENGTH = 2000

export const TERMINAL_JOB_STATUSES: JobStatus[] = ['closed', 'cancelled']

export const ALLOWED_STATUS_TRANSITIONS: Record<JobStatus, JobStatus[]> = {
  created: ['assigned', 'cancelled'],
  assigned: ['in_progress', 'on_hold', 'cancelled'],
  in_progress: ['on_hold', 'completed', 'cancelled'],
  on_hold: ['in_progress', 'assigned', 'cancelled'],
  completed: ['closed'],
  closed: [],
  cancelled: [],
}

export const COMPLETED_NOTE_REQUIRED_MESSAGE =
  'A note is required before changing status to Completed. Please add a short completion note and try again.'

export const ON_HOLD_NOTE_REQUIRED_MESSAGE =
  'A note is required before changing status to On Hold. Please explain why the job is on hold and try again.'

export function isTerminalJobStatus(status: JobStatus): boolean {
  return TERMINAL_JOB_STATUSES.includes(status)
}

export function getAllowedStatusTransitions(fromStatus: JobStatus): JobStatus[] {
  return ALLOWED_STATUS_TRANSITIONS[fromStatus] ?? []
}

export function isValidStatusTransition(fromStatus: JobStatus, toStatus: JobStatus): boolean {
  if (fromStatus === toStatus) return true
  return getAllowedStatusTransitions(fromStatus).includes(toStatus)
}

export function getInvalidStatusTransitionMessage(
  fromStatus: JobStatus,
  toStatus: JobStatus,
): string | null {
  if (fromStatus === toStatus || isValidStatusTransition(fromStatus, toStatus)) {
    return null
  }
  return `Cannot transition repair job from ${formatJobStatus(fromStatus)} to ${formatJobStatus(toStatus)}`
}

export function isNoteRequiredForTransition(targetStatus: JobStatus): boolean {
  return targetStatus === 'completed' || targetStatus === 'on_hold'
}

export function getRequiredNoteMessage(targetStatus: JobStatus): string | null {
  if (targetStatus === 'completed') return COMPLETED_NOTE_REQUIRED_MESSAGE
  if (targetStatus === 'on_hold') return ON_HOLD_NOTE_REQUIRED_MESSAGE
  return null
}

export function getSelectableStatusOptions(currentStatus: JobStatus): JobStatus[] {
  if (isTerminalJobStatus(currentStatus)) {
    return [currentStatus]
  }
  return [currentStatus, ...getAllowedStatusTransitions(currentStatus)]
}

export function validateStatusChangeNote(
  targetStatus: JobStatus,
  note: string,
): string | undefined {
  const trimmed = note.trim()

  if (isNoteRequiredForTransition(targetStatus)) {
    if (!trimmed) {
      return getRequiredNoteMessage(targetStatus) ?? 'A note is required for this status change.'
    }
  } else if (note.length > 0 && !trimmed) {
    return 'Note cannot be blank.'
  }

  if (trimmed.length > STATUS_NOTE_MAX_LENGTH) {
    return `Note must be ${STATUS_NOTE_MAX_LENGTH} characters or fewer.`
  }

  return undefined
}
