import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { Ticket } from '@/features/tickets/types/ticket'

import {
  compareTicketsNewestFirst,
  formatSlaDueAt,
  isSlaOverdue,
  toTicketGridRow,
} from './ticket-list-model'

function makeTicket(overrides: Partial<Ticket> = {}): Ticket {
  return {
    id: 't1',
    busNumber: 'BUS-1',
    title: 'Title',
    description: 'Desc',
    status: 'CREATED',
    severity: 'LOW',
    priority: 'P3',
    category: 'General',
    slaDueAt: '',
    ...overrides,
  }
}

describe('compareTicketsNewestFirst', () => {
  it('sorts by createdAt descending', () => {
    const a = makeTicket({ id: 'a', createdAt: '2024-01-01T00:00:00Z' })
    const b = makeTicket({ id: 'b', createdAt: '2024-02-01T00:00:00Z' })
    expect(compareTicketsNewestFirst(a, b)).toBeGreaterThan(0)
  })

  it('tie-breaks by id when createdAt is equal', () => {
    const a = makeTicket({ id: 'a', createdAt: '2024-01-01T00:00:00Z' })
    const b = makeTicket({ id: 'b', createdAt: '2024-01-01T00:00:00Z' })
    expect(compareTicketsNewestFirst(a, b)).toBeGreaterThan(0)
  })

  it('treats missing createdAt as epoch', () => {
    const a = makeTicket({ id: 'a' })
    const b = makeTicket({ id: 'b', createdAt: '2024-01-01T00:00:00Z' })
    expect(compareTicketsNewestFirst(a, b)).toBeGreaterThan(0)
  })
})

describe('formatSlaDueAt', () => {
  it('returns No SLA for empty or invalid dates', () => {
    expect(formatSlaDueAt('')).toBe('No SLA')
    expect(formatSlaDueAt('not-a-date')).toBe('No SLA')
  })

  it('formats valid ISO date', () => {
    const formatted = formatSlaDueAt('2024-06-15T10:30:00.000Z')
    expect(formatted).not.toBe('No SLA')
    expect(formatted.length).toBeGreaterThan(0)
  })
})

describe('isSlaOverdue', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2024-06-15T12:00:00.000Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('returns false for empty or invalid sla', () => {
    expect(isSlaOverdue('')).toBe(false)
    expect(isSlaOverdue('invalid')).toBe(false)
  })

  it('returns true for past sla and false for future', () => {
    expect(isSlaOverdue('2024-06-15T11:00:00.000Z')).toBe(true)
    expect(isSlaOverdue('2024-06-15T13:00:00.000Z')).toBe(false)
  })
})

describe('toTicketGridRow', () => {
  it('maps ticket fields with fallbacks', () => {
    const row = toTicketGridRow(
      makeTicket({
        ticketNumber: undefined,
        busNumber: '',
        createdByName: undefined,
        assignedToName: undefined,
        assignedToUserId: 'worker-1',
        createdAt: '2024-01-01',
        slaDueAt: '2024-06-15T11:00:00.000Z',
      }),
    )

    expect(row.ticketNumber).toBe('—')
    expect(row.busNumber).toBe('N/A')
    expect(row.createdBy).toBe('Unknown')
    expect(row.assignedTo).toBe('worker-1')
    expect(row.isOverdue).toBe(true)
  })

  it('uses assignedToName when present and handles invalid createdAt in sort', () => {
    const row = toTicketGridRow(
      makeTicket({
        assignedToName: 'Alex',
        assignedToUserId: 'w1',
      }),
    )
    expect(row.assignedTo).toBe('Alex')

    const invalidDate = makeTicket({ id: 'x', createdAt: 'not-a-date' })
    const valid = makeTicket({ id: 'y', createdAt: '2024-01-01T00:00:00Z' })
    expect(compareTicketsNewestFirst(invalidDate, valid)).toBeGreaterThan(0)
  })
})
