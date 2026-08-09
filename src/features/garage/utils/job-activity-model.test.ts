import { describe, expect, it } from 'vitest'

import { makeActivityLog } from '@/test/fixtures/garage'
import {
  formatActivityActor,
  formatActivityLabel,
  formatCommentActor,
  formatCommentMeta,
  formatPartActivityDetail,
  formatStatusTransition,
  getActivityDotClass,
  getActivityToneClass,
  getJobComments,
  getPartActivityMetadata,
  getRepeatCreatedMetadata,
  getRepeatScheduledMetadata,
  getRepeatSourceMetadata,
  getActivityActorInitials,
  validateJobCommentNote,
} from './job-activity-model'

describe('getJobComments', () => {
  it('returns empty array for undefined or empty logs', () => {
    expect(getJobComments(undefined)).toEqual([])
    expect(getJobComments([])).toEqual([])
  })

  it('filters only commented action types', () => {
    const logs = [
      makeActivityLog({ id: '1', actionType: 'commented' }),
      makeActivityLog({ id: '2', actionType: 'created' }),
    ]
    expect(getJobComments(logs)).toHaveLength(1)
    expect(getJobComments(logs)[0].id).toBe('1')
  })
})

describe('formatCommentActor', () => {
  it('prefers displayName over username', () => {
    expect(formatCommentActor(makeActivityLog())).toBe('Admin User')
    expect(
      formatCommentActor(
        makeActivityLog({ actor: { id: 'u1', username: 'tech', displayName: '' } }),
      ),
    ).toBe('tech')
    expect(
      formatCommentActor(makeActivityLog({ actor: { id: 'u1', username: '', displayName: '' } })),
    ).toBe('Unknown')
  })
})

describe('formatActivityActor', () => {
  it('includes username when present', () => {
    expect(formatActivityActor(makeActivityLog())).toBe('Admin User (@admin)')
    expect(
      formatActivityActor(makeActivityLog({ actor: { id: 'u1', username: '', displayName: 'Only Name' } })),
    ).toBe('Only Name')
  })
})

describe('getActivityActorInitials', () => {
  it('uses first letters of two-word names', () => {
    expect(
      getActivityActorInitials(makeActivityLog({ actor: { id: 'u1', username: '', displayName: 'John Smith' } })),
    ).toBe('JS')
  })

  it('uses first two characters for single-word names', () => {
    expect(
      getActivityActorInitials(makeActivityLog({ actor: { id: 'u1', username: 'admin', displayName: '' } })),
    ).toBe('AD')
  })

  it('falls back to System', () => {
    expect(
      getActivityActorInitials(makeActivityLog({ actor: { id: 'u1', username: '', displayName: '' } })),
    ).toBe('SY')
  })
})

describe('formatStatusTransition', () => {
  it('handles null combinations', () => {
    expect(formatStatusTransition(null, null)).toBeNull()
    expect(formatStatusTransition(null, 'assigned')).toBe('assigned')
    expect(formatStatusTransition('created', null)).toBe('created')
    expect(formatStatusTransition('created', 'assigned')).toBe('created → assigned')
  })
})

describe('formatCommentMeta', () => {
  it('formats createdAt timestamps', () => {
    const meta = formatCommentMeta(makeActivityLog({ createdAt: '2024-06-01T10:00:00.000Z' }))
    expect(meta).toMatch(/2024/)
  })
})

describe('getPartActivityMetadata', () => {
  it('returns metadata for part_added with valid fields', () => {
    const log = makeActivityLog({
      actionType: 'part_added',
      metadata: {
        repairJobPartId: 'pl-1',
        repairPartId: 'rp-1',
        partName: 'Filter',
        quantity: 2,
        unitPrice: '10.00',
      },
    })
    expect(getPartActivityMetadata(log)).toEqual(log.metadata)
  })

  it('returns null for wrong action type or incomplete metadata', () => {
    expect(getPartActivityMetadata(makeActivityLog({ actionType: 'created' }))).toBeNull()
    expect(
      getPartActivityMetadata(
        makeActivityLog({ actionType: 'part_added', metadata: { partName: 'x' } as never }),
      ),
    ).toBeNull()
  })
})

describe('repeat metadata helpers', () => {
  it('getRepeatScheduledMetadata requires scheduledFor', () => {
    expect(
      getRepeatScheduledMetadata(
        makeActivityLog({ actionType: 'repeat_scheduled', metadata: { scheduledFor: '2024-07-01' } }),
      ),
    ).toEqual({ scheduledFor: '2024-07-01' })
    expect(getRepeatScheduledMetadata(makeActivityLog({ actionType: 'repeat_scheduled' }))).toBeNull()
  })

  it('getRepeatCreatedMetadata requires related job fields', () => {
    expect(
      getRepeatCreatedMetadata(
        makeActivityLog({
          actionType: 'repeat_created',
          metadata: { relatedJobId: 'j2', relatedJobIdNumber: 'RJ-002' },
        }),
      ),
    ).toEqual({ relatedJobId: 'j2', relatedJobIdNumber: 'RJ-002' })
  })

  it('getRepeatSourceMetadata requires repeat source fields on created', () => {
    expect(
      getRepeatSourceMetadata(
        makeActivityLog({
          actionType: 'created',
          metadata: {
            isRepeatJob: true,
            previousJobId: 'j0',
            previousJobIdNumber: 'RJ-000',
          },
        }),
      ),
    ).toEqual({
      isRepeatJob: true,
      previousJobId: 'j0',
      previousJobIdNumber: 'RJ-000',
    })
    expect(getRepeatSourceMetadata(makeActivityLog({ actionType: 'created' }))).toBeNull()
  })
})

describe('formatPartActivityDetail', () => {
  it('formats part line detail', () => {
    const detail = formatPartActivityDetail({
      repairJobPartId: 'pl-1',
      repairPartId: 'rp-1',
      partName: 'Brake Pad',
      quantity: 2,
      unitPrice: '10.50',
    })
    expect(detail).toContain('Brake Pad')
    expect(detail).toContain('Qty 2')
  })
})

describe('activity tone and dot classes', () => {
  const actionTypes = [
    'created',
    'status_changed',
    'commented',
    'closed',
    'cancelled',
    'part_added',
    'part_removed',
    'repeat_scheduled',
    'repeat_created',
  ] as const

  it.each(actionTypes)('returns classes for %s', (actionType) => {
    expect(getActivityToneClass(actionType)).toContain('border')
    expect(getActivityDotClass(actionType)).toContain('bg-')
  })

  it('returns default classes for unknown action type', () => {
    expect(getActivityToneClass('unknown' as 'created')).toContain('border-border')
    expect(getActivityDotClass('unknown' as 'created')).toContain('bg-muted-foreground')
  })
})

describe('formatActivityLabel', () => {
  it('returns known labels and falls back for unknown', () => {
    expect(formatActivityLabel('created')).toBe('Job created')
    expect(formatActivityLabel('unknown' as 'created')).toBe('unknown')
  })
})

describe('validateJobCommentNote', () => {
  it('requires non-empty trimmed comment', () => {
    expect(validateJobCommentNote('')).toBe('Comment is required.')
    expect(validateJobCommentNote('   ')).toBe('Comment is required.')
  })

  it('rejects comments over 2000 characters', () => {
    expect(validateJobCommentNote('a'.repeat(2001))).toBe('Comment must be 2000 characters or fewer.')
  })

  it('accepts valid comments', () => {
    expect(validateJobCommentNote('Valid comment')).toBeUndefined()
    expect(validateJobCommentNote('a'.repeat(2000))).toBeUndefined()
  })
})
