import { describe, expect, it, vi } from 'vitest'

import { toast } from '@/lib/toast'
import {
  formatEmployeeDateTime,
  handleEmployeeFormError,
  parseOptionalMasterDate,
  parseOptionalMobile,
  parseOptionalText,
  parseRequiredAadhar,
  parseRequiredDocument,
  parseRequiredIfsc,
  parseRequiredMasterDate,
  parseRequiredMobile,
  parseRequiredText,
} from './employee-model'

vi.mock('@/lib/toast', () => ({
  toast: { error: vi.fn() },
}))

describe('formatEmployeeDateTime', () => {
  it('returns em dash for empty values', () => {
    expect(formatEmployeeDateTime(null)).toBe('—')
    expect(formatEmployeeDateTime(undefined)).toBe('—')
  })

  it('returns raw string for invalid dates', () => {
    expect(formatEmployeeDateTime('not-a-date')).toBe('not-a-date')
  })

  it('formats valid ISO dates', () => {
    expect(formatEmployeeDateTime('2024-06-01T10:00:00Z')).toMatch(/2024/)
  })
})

describe('parseRequiredText', () => {
  it('requires non-empty trimmed text within max length', () => {
    expect(() => parseRequiredText('', 'Name', 10)).toThrow('Name is required.')
    expect(() => parseRequiredText('   ', 'Name', 10)).toThrow('Name is required.')
    expect(() => parseRequiredText('a'.repeat(11), 'Name', 10)).toThrow(
      'Name must be 10 characters or fewer.',
    )
    expect(parseRequiredText('  John  ', 'Name', 10)).toBe('John')
  })
})

describe('parseOptionalText', () => {
  it('returns undefined for empty and validates max length', () => {
    expect(parseOptionalText('', 10)).toBeUndefined()
    expect(() => parseOptionalText('a'.repeat(11), 10)).toThrow(
      'Value must be 10 characters or fewer.',
    )
    expect(parseOptionalText('ok', 10)).toBe('ok')
  })
})

describe('parseRequiredMobile', () => {
  it('requires exactly 10 digits', () => {
    expect(() => parseRequiredMobile('123', 'Mobile')).toThrow(
      'Mobile must be exactly 10 digits.',
    )
    expect(parseRequiredMobile('9876543210', 'Mobile')).toBe('9876543210')
  })
})

describe('parseOptionalMobile', () => {
  it('returns undefined for empty and validates format', () => {
    expect(parseOptionalMobile('', 'Alt')).toBeUndefined()
    expect(() => parseOptionalMobile('123', 'Alt')).toThrow('Alt must be exactly 10 digits.')
    expect(parseOptionalMobile('9876543210', 'Alt')).toBe('9876543210')
  })
})

describe('parseRequiredAadhar', () => {
  it('requires exactly 12 digits', () => {
    expect(() => parseRequiredAadhar('123')).toThrow('Aadhar number must be exactly 12 digits.')
    expect(parseRequiredAadhar('123456789012')).toBe('123456789012')
  })
})

describe('parseRequiredIfsc', () => {
  it('validates IFSC format and uppercases', () => {
    expect(() => parseRequiredIfsc('invalid')).toThrow('IFSC code must match the format SBIN0001234.')
    expect(parseRequiredIfsc('sbin0001234')).toBe('SBIN0001234')
  })
})

describe('parseRequiredMasterDate', () => {
  it('requires valid master date from input value', () => {
    expect(() => parseRequiredMasterDate('', 'DOB')).toThrow(
      'DOB is required and must be a valid date.',
    )
    expect(() => parseRequiredMasterDate('invalid', 'DOB')).toThrow(
      'DOB is required and must be a valid date.',
    )
    expect(parseRequiredMasterDate('1990-01-01', 'DOB')).toBe('01-01-1990')
  })
})

describe('parseOptionalMasterDate', () => {
  it('returns undefined for empty and validates optional date', () => {
    expect(parseOptionalMasterDate('')).toBeUndefined()
    expect(() => parseOptionalMasterDate('bad')).toThrow('Date of leaving must be a valid date.')
    expect(parseOptionalMasterDate('2020-06-01')).toBe('01-06-2020')
  })
})

describe('parseRequiredDocument', () => {
  it('requires non-empty document value', () => {
    expect(() => parseRequiredDocument('', 'Doc')).toThrow('Doc is required.')
    expect(parseRequiredDocument('file.jpg', 'Doc')).toBe('file.jpg')
  })
})

describe('handleEmployeeFormError', () => {
  it('shows error message from Error instance', () => {
    handleEmployeeFormError(new Error('Boom'), 'Fallback')
    expect(toast.error).toHaveBeenCalledWith('Boom')
  })

  it('shows fallback for non-Error values', () => {
    handleEmployeeFormError('x', 'Fallback')
    expect(toast.error).toHaveBeenCalledWith('Fallback')
  })
})
