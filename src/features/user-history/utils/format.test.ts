import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  formatActivityNote,
  formatActivityTicketHeading,
  formatDateTime,
  formatDurationMs,
  formatPercent,
  formatPriorityLabel,
  formatSeverityLabel,
  formatShortDate,
  formatStatusLabel,
  getDisplayTicketNumber,
  isInternalRecordId,
} from './format'

describe('user-history format utils', () => {
  beforeEach(() => {
    vi.useRealTimers()
  })

  describe('formatDateTime', () => {
    it('returns em dash for empty or invalid dates', () => {
      expect(formatDateTime()).toBe('—')
      expect(formatDateTime('')).toBe('—')
      expect(formatDateTime('not-a-date')).toBe('—')
    })

    it('formats valid ISO dates', () => {
      vi.setSystemTime(new Date('2024-06-15T12:00:00Z'))
      const formatted = formatDateTime('2024-06-15T10:30:00Z')
      expect(formatted).toMatch(/15/)
      expect(formatted).not.toBe('—')
    })
  })

  describe('formatShortDate', () => {
    it('returns em dash for missing values', () => {
      expect(formatShortDate()).toBe('—')
    })

    it('formats date-only strings', () => {
      const formatted = formatShortDate('2024-06-15')
      expect(formatted).toMatch(/15/)
    })

    it('returns raw value when parsing fails', () => {
      expect(formatShortDate('invalid-date')).toBe('invalid-date')
    })
  })

  describe('formatDurationMs', () => {
    it.each([
      [null, '—'],
      [Number.NaN, '—'],
      [-1, '—'],
      [30 * 60 * 1000, '30m'],
      [2 * 60 * 60 * 1000, '2h'],
      [2 * 60 * 60 * 1000 + 15 * 60 * 1000, '2h 15m'],
      [50 * 60 * 60 * 1000, '2d 2h'],
      [48 * 60 * 60 * 1000, '2d'],
    ] as const)('formatDurationMs(%s) => %s', (input, expected) => {
      expect(formatDurationMs(input)).toBe(expected)
    })
  })

  describe('formatPercent', () => {
    it('returns em dash for nullish or non-finite values', () => {
      expect(formatPercent(null)).toBe('—')
      expect(formatPercent(Number.POSITIVE_INFINITY)).toBe('—')
    })

    it('formats finite percentages with one decimal', () => {
      expect(formatPercent(95.456)).toBe('95.5%')
    })
  })

  describe('label helpers', () => {
    it('formats status, severity, and priority labels', () => {
      expect(formatStatusLabel('in_progress')).toBe('in progress')
      expect(formatSeverityLabel('high')).toBe('HIGH')
      expect(formatPriorityLabel('p1')).toBe('P1')
    })
  })

  describe('isInternalRecordId', () => {
    it.each([
      ['', true],
      ['   ', true],
      ['cabcdefghijklmnopqrstuvwxyz', true],
      ['550e8400-e29b-41d4-a716-446655440000', true],
      ['tkt_abc123', true],
      ['12345', false],
      ['TKT-100', false],
    ] as const)('isInternalRecordId(%s) => %s', (value, expected) => {
      expect(isInternalRecordId(value)).toBe(expected)
    })
  })

  describe('getDisplayTicketNumber', () => {
    it('returns null for internal ids and ticket id matches', () => {
      expect(getDisplayTicketNumber('tkt_abc', 'ticket-1')).toBeNull()
      expect(getDisplayTicketNumber('ticket-1', 'ticket-1')).toBeNull()
      expect(getDisplayTicketNumber('  ', 'ticket-1')).toBeNull()
    })

    it('returns trimmed display number when valid', () => {
      expect(getDisplayTicketNumber(' 42 ', 'ticket-1')).toBe('42')
    })
  })

  describe('formatActivityTicketHeading', () => {
    it('includes ticket number when displayable', () => {
      expect(formatActivityTicketHeading('42', 't1', 'Brake issue')).toBe('42 · Brake issue')
    })

    it('falls back to title when number is internal', () => {
      expect(formatActivityTicketHeading('tkt_abc', 't1', 'Brake issue')).toBe('Brake issue')
    })
  })

  describe('formatActivityNote', () => {
    it('filters blank, ticket id, and internal record notes', () => {
      expect(formatActivityNote(null, 't1')).toBeNull()
      expect(formatActivityNote('   ', 't1')).toBeNull()
      expect(formatActivityNote('t1', 't1')).toBeNull()
      expect(formatActivityNote('tkt_secret', 't1')).toBeNull()
    })

    it('returns trimmed user-facing note', () => {
      expect(formatActivityNote('  Fixed pump  ', 't1')).toBe('Fixed pump')
    })
  })
})
