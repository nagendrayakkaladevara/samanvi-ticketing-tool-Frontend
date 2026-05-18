import type { TicketStatus } from '@/features/tickets/types/ticket'

export const RESOLVE_BEFORE_CLOSE_MESSAGE =
  'Move the ticket to Resolved first, then close it.'

export const REOPEN_ONLY_FROM_CLOSED_MESSAGE =
  'Only closed tickets can be moved to Reopened.'

export function isNoteRequiredForTransition(targetStatus: TicketStatus): boolean {
  return targetStatus === 'RESOLVED'
}

export function getInvalidStatusTransitionMessage(
  fromStatus: TicketStatus,
  toStatus: TicketStatus,
): string | null {
  if (fromStatus === 'IN_PROGRESS' && toStatus === 'CLOSED') {
    return RESOLVE_BEFORE_CLOSE_MESSAGE
  }
  if (toStatus === 'REOPENED' && fromStatus !== 'CLOSED') {
    return REOPEN_ONLY_FROM_CLOSED_MESSAGE
  }
  return null
}
