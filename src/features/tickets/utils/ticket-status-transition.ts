import type { TicketStatus } from '@/features/tickets/types/ticket'

export const RESOLVE_BEFORE_CLOSE_MESSAGE =
  'Move the ticket to Resolved first, then close it.'

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
  return null
}
