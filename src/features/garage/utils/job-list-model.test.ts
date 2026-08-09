import { describe, expect, it } from 'vitest'

import { makeRepairJob } from '@/test/fixtures/garage'
import {
  compareJobsNewestFirst,
  formatJobDate,
  formatJobPriority,
  formatJobStatus,
  getPrioritySeverityClass,
  toJobGridRow,
} from './job-list-model'

describe('getPrioritySeverityClass', () => {
  it('maps known priorities', () => {
    expect(getPrioritySeverityClass('low')).toBe('low')
    expect(getPrioritySeverityClass('urgent')).toBe('critical')
  })

  it('falls back to low for unknown priority', () => {
    expect(getPrioritySeverityClass('bogus' as 'low')).toBe('low')
  })
})

describe('formatJobStatus', () => {
  it('replaces underscores with spaces', () => {
    expect(formatJobStatus('in_progress')).toBe('in progress')
    expect(formatJobStatus('on_hold')).toBe('on hold')
  })
})

describe('formatJobPriority', () => {
  it('capitalizes first letter', () => {
    expect(formatJobPriority('medium')).toBe('Medium')
    expect(formatJobPriority('urgent')).toBe('Urgent')
  })
})

describe('formatJobDate', () => {
  it('returns em dash for empty or invalid dates', () => {
    expect(formatJobDate(undefined)).toBe('—')
    expect(formatJobDate('')).toBe('—')
    expect(formatJobDate('not-a-date')).toBe('—')
  })

  it('formats valid ISO dates', () => {
    const formatted = formatJobDate('2024-06-15T10:30:00Z')
    expect(formatted).toMatch(/2024/)
    expect(formatted).not.toBe('—')
  })
})

describe('compareJobsNewestFirst', () => {
  it('sorts by createdAt descending', () => {
    const older = makeRepairJob({ id: '1', createdAt: '2024-01-01T00:00:00Z' })
    const newer = makeRepairJob({ id: '2', createdAt: '2024-06-01T00:00:00Z' })
    expect(compareJobsNewestFirst(older, newer)).toBeGreaterThan(0)
    expect(compareJobsNewestFirst(newer, older)).toBeLessThan(0)
  })

  it('treats invalid dates as zero', () => {
    const invalid = makeRepairJob({ createdAt: 'invalid' })
    const valid = makeRepairJob({ createdAt: '2024-06-01T00:00:00Z' })
    expect(compareJobsNewestFirst(invalid, valid)).toBeGreaterThan(0)
  })
})

describe('toJobGridRow', () => {
  it('maps repair job to grid row with formatted fields', () => {
    const job = makeRepairJob({
      priority: 'high',
      status: 'in_progress',
      assignedToOfficeStaff: {
        id: 's1',
        staffIdNumber: 'S1',
        nickName: 'Alex',
        aadharName: 'Alex',
        designation: 'Mech',
      },
      createdBy: { id: 'u1', username: 'admin', displayName: '' },
    })

    const row = toJobGridRow(job)

    expect(row.id).toBe('job-1')
    expect(row.priority).toBe('High')
    expect(row.priorityRaw).toBe('high')
    expect(row.status).toBe('in progress')
    expect(row.statusRaw).toBe('in_progress')
    expect(row.assignedTo).toBe('Alex')
    expect(row.createdBy).toBe('admin')
    expect(row.busNumber).toBe('BUS-01')
  })

  it('uses fallbacks for unassigned and unknown creator', () => {
    const job = makeRepairJob({
      assignedToOfficeStaff: null,
      createdBy: { id: 'u1', username: '', displayName: '' },
    })
    const row = toJobGridRow(job)
    expect(row.assignedTo).toBe('Unassigned')
    expect(row.createdBy).toBe('Unknown')
  })
})
