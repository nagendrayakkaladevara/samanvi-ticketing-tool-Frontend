import { describe, expect, it } from 'vitest'

import type { JobStatus } from '@/features/garage/types/job'
import { ALL_JOB_STATUSES } from '@/test/fixtures/garage'
import {
  ALLOWED_STATUS_TRANSITIONS,
  COMPLETED_NOTE_REQUIRED_MESSAGE,
  ON_HOLD_NOTE_REQUIRED_MESSAGE,
  STATUS_NOTE_MAX_LENGTH,
  getAllowedStatusTransitions,
  getInvalidStatusTransitionMessage,
  getRequiredNoteMessage,
  getSelectableStatusOptions,
  isNoteRequiredForTransition,
  isTerminalJobStatus,
  isValidStatusTransition,
  validateStatusChangeNote,
} from './job-status-transition'

describe('isValidStatusTransition matrix', () => {
  describe.each(ALL_JOB_STATUSES)('from %s', (from) => {
    it.each(ALL_JOB_STATUSES)('to %s', (to) => {
      const expected = from === to || ALLOWED_STATUS_TRANSITIONS[from].includes(to)
      expect(isValidStatusTransition(from, to)).toBe(expected)
    })
  })
})

describe('getAllowedStatusTransitions', () => {
  it('returns allowed targets for created', () => {
    expect(getAllowedStatusTransitions('created')).toEqual(['assigned', 'cancelled'])
  })

  it('returns empty array for unknown status key', () => {
    expect(getAllowedStatusTransitions('bogus' as JobStatus)).toEqual([])
  })
})

describe('isTerminalJobStatus', () => {
  it('identifies closed and cancelled as terminal', () => {
    expect(isTerminalJobStatus('closed')).toBe(true)
    expect(isTerminalJobStatus('cancelled')).toBe(true)
    expect(isTerminalJobStatus('in_progress')).toBe(false)
  })
})

describe('getInvalidStatusTransitionMessage', () => {
  it('returns null for same status', () => {
    expect(getInvalidStatusTransitionMessage('created', 'created')).toBeNull()
  })

  it('returns null for allowed transitions', () => {
    expect(getInvalidStatusTransitionMessage('created', 'assigned')).toBeNull()
  })

  it('returns message for illegal transitions', () => {
    expect(getInvalidStatusTransitionMessage('closed', 'assigned')).toBe(
      'Cannot transition repair job from closed to assigned',
    )
    expect(getInvalidStatusTransitionMessage('in_progress', 'created')).toBe(
      'Cannot transition repair job from in progress to created',
    )
  })
})

describe('isNoteRequiredForTransition', () => {
  it('requires note for completed and on_hold only', () => {
    expect(isNoteRequiredForTransition('completed')).toBe(true)
    expect(isNoteRequiredForTransition('on_hold')).toBe(true)
    expect(isNoteRequiredForTransition('assigned')).toBe(false)
  })
})

describe('getRequiredNoteMessage', () => {
  it('returns specific messages for completed and on_hold', () => {
    expect(getRequiredNoteMessage('completed')).toBe(COMPLETED_NOTE_REQUIRED_MESSAGE)
    expect(getRequiredNoteMessage('on_hold')).toBe(ON_HOLD_NOTE_REQUIRED_MESSAGE)
    expect(getRequiredNoteMessage('assigned')).toBeNull()
  })
})

describe('getSelectableStatusOptions', () => {
  it('returns only current status for terminal states', () => {
    expect(getSelectableStatusOptions('closed')).toEqual(['closed'])
    expect(getSelectableStatusOptions('cancelled')).toEqual(['cancelled'])
  })

  it('includes current status plus allowed transitions for active jobs', () => {
    expect(getSelectableStatusOptions('created')).toEqual(['created', 'assigned', 'cancelled'])
  })
})

describe('validateStatusChangeNote', () => {
  it('requires non-empty trimmed note for completed', () => {
    expect(validateStatusChangeNote('completed', '')).toBe(COMPLETED_NOTE_REQUIRED_MESSAGE)
    expect(validateStatusChangeNote('completed', '   ')).toBe(COMPLETED_NOTE_REQUIRED_MESSAGE)
  })

  it('requires non-empty trimmed note for on_hold', () => {
    expect(validateStatusChangeNote('on_hold', '')).toBe(ON_HOLD_NOTE_REQUIRED_MESSAGE)
  })

  it('accepts valid note when required', () => {
    expect(validateStatusChangeNote('completed', 'Job finished')).toBeUndefined()
  })

  it('rejects whitespace-only note when not required', () => {
    expect(validateStatusChangeNote('assigned', '   ')).toBe('Note cannot be blank.')
  })

  it('allows empty note when not required', () => {
    expect(validateStatusChangeNote('assigned', '')).toBeUndefined()
  })

  it('rejects note exceeding max length', () => {
    const longNote = 'a'.repeat(STATUS_NOTE_MAX_LENGTH + 1)
    expect(validateStatusChangeNote('assigned', longNote)).toBe(
      `Note must be ${STATUS_NOTE_MAX_LENGTH} characters or fewer.`,
    )
  })

  it('accepts note at max length boundary', () => {
    const maxNote = 'a'.repeat(STATUS_NOTE_MAX_LENGTH)
    expect(validateStatusChangeNote('assigned', maxNote)).toBeUndefined()
  })
})
