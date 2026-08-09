import { describe, expect, it } from 'vitest'

import type { TicketStatus } from '@/features/tickets/types/ticket'

import {
  getInvalidStatusTransitionMessage,
  isNoteRequiredForTransition,
  REOPEN_ONLY_FROM_CLOSED_MESSAGE,
  RESOLVE_BEFORE_CLOSE_MESSAGE,
} from './ticket-status-transition'

const ALL_STATUSES: TicketStatus[] = [
  'CREATED',
  'ASSIGNED',
  'IN_PROGRESS',
  'BLOCKED',
  'RESOLVED',
  'CLOSED',
  'REOPENED',
]

describe('isNoteRequiredForTransition', () => {
  it.each(ALL_STATUSES)('requires note only for RESOLVED (status=%s)', (status) => {
    expect(isNoteRequiredForTransition(status)).toBe(status === 'RESOLVED')
  })
})

describe('getInvalidStatusTransitionMessage matrix', () => {
  it('blocks IN_PROGRESS → CLOSED', () => {
    expect(getInvalidStatusTransitionMessage('IN_PROGRESS', 'CLOSED')).toBe(RESOLVE_BEFORE_CLOSE_MESSAGE)
  })

  it.each(ALL_STATUSES.filter((s) => s !== 'CLOSED'))(
    'blocks %s → REOPENED',
    (fromStatus) => {
      expect(getInvalidStatusTransitionMessage(fromStatus, 'REOPENED')).toBe(REOPEN_ONLY_FROM_CLOSED_MESSAGE)
    },
  )

  it('allows CLOSED → REOPENED', () => {
    expect(getInvalidStatusTransitionMessage('CLOSED', 'REOPENED')).toBeNull()
  })

  it.each(
    ALL_STATUSES.flatMap((from) =>
      ALL_STATUSES.map((to) => [from, to] as const).filter(([from, to]) => {
        if (from === 'IN_PROGRESS' && to === 'CLOSED') return false
        if (to === 'REOPENED' && from !== 'CLOSED') return false
        return true
      }),
    ),
  )('allows %s → %s', (from, to) => {
    expect(getInvalidStatusTransitionMessage(from, to)).toBeNull()
  })
})
