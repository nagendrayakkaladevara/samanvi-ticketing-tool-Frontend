import { describe, expect, it } from 'vitest'

import {
  extractArrayPayload,
  extractEntityPayload,
  normalizeString,
  resolveEntityId,
} from './master-api'

describe('normalizeString', () => {
  it.each([
    ['  hello  ', 'hello'],
    ['x', 'x'],
  ] as const)('trims and returns non-empty string for %j', (input, expected) => {
    expect(normalizeString(input)).toBe(expected)
  })

  it.each([null, undefined, 0, {}, '', '   ', false])('returns undefined for %j', (input) => {
    expect(normalizeString(input)).toBeUndefined()
  })
})

describe('extractArrayPayload', () => {
  it('returns array as-is', () => {
    expect(extractArrayPayload([1, 2])).toEqual([1, 2])
  })

  it.each([
    [null, []],
    [undefined, []],
    ['text', []],
    [42, []],
  ] as const)('returns empty array for non-object %j', (input, expected) => {
    expect(extractArrayPayload(input)).toEqual(expected)
  })

  it('extracts from data array', () => {
    expect(extractArrayPayload({ data: [{ id: 1 }] })).toEqual([{ id: 1 }])
  })

  it('extracts from nested data.items', () => {
    expect(extractArrayPayload({ data: { items: ['a'] } })).toEqual(['a'])
  })

  it('extracts from top-level items', () => {
    expect(extractArrayPayload({ items: ['b'] })).toEqual(['b'])
  })

  it('returns empty array when no known keys exist', () => {
    expect(extractArrayPayload({ other: [] })).toEqual([])
  })

  it('prefers data array over items', () => {
    expect(extractArrayPayload({ data: ['from-data'], items: ['from-items'] })).toEqual(['from-data'])
  })
})

describe('extractEntityPayload', () => {
  it('returns raw when not an object', () => {
    expect(extractEntityPayload(null)).toBeNull()
    expect(extractEntityPayload('x')).toBe('x')
  })

  it('unwraps data object', () => {
    expect(extractEntityPayload({ data: { id: '1' } })).toEqual({ id: '1' })
  })

  it('returns raw when data is not an object', () => {
    const raw = { data: 'not-object', id: '1' }
    expect(extractEntityPayload(raw)).toBe(raw)
  })

  it('returns raw object without data key', () => {
    const raw = { id: '1' }
    expect(extractEntityPayload(raw)).toBe(raw)
  })
})

describe('resolveEntityId', () => {
  it.each([
    [{ id: 'abc' }, 'abc'],
    [{ driverId: 'd-1' }, 'd-1'],
    [{ helperId: 'h-1' }, 'h-1'],
    [{ staffId: 's-1' }, 's-1'],
    [{ _id: 'mongo-1' }, 'mongo-1'],
    [{ id: 42 }, '42'],
  ] as const)('resolves id from %j', (value, expected) => {
    expect(resolveEntityId(value)).toBe(expected)
  })

  it('prefers id over alternate keys', () => {
    expect(resolveEntityId({ id: 'primary', driverId: 'secondary' })).toBe('primary')
  })

  it.each([
    [{}],
    [{ id: null }],
    [{ id: true }],
    [{ driverId: {} }],
  ] as const)('returns undefined when no valid id in %j', (value) => {
    expect(resolveEntityId(value)).toBeUndefined()
  })
})
