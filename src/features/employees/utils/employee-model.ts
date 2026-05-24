import { toast } from '@/lib/toast'
import { inputValueToMasterDate, isValidMasterDate } from '@/lib/utils/master-dates'

const MOBILE_PATTERN = /^\d{10}$/
const AADHAR_PATTERN = /^\d{12}$/
const IFSC_PATTERN = /^[A-Z]{4}0[A-Z0-9]{6}$/

export function formatEmployeeDateTime(rawDate?: string | null): string {
  if (!rawDate) return '—'

  const parsed = new Date(rawDate)
  if (Number.isNaN(parsed.getTime())) return rawDate

  return new Intl.DateTimeFormat(undefined, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(parsed)
}

export function parseRequiredText(value: string, label: string, maxLength: number): string {
  const trimmed = value.trim()
  if (!trimmed) {
    throw new Error(`${label} is required.`)
  }
  if (trimmed.length > maxLength) {
    throw new Error(`${label} must be ${maxLength} characters or fewer.`)
  }
  return trimmed
}

export function parseOptionalText(value: string, maxLength: number): string | undefined {
  const trimmed = value.trim()
  if (!trimmed) return undefined
  if (trimmed.length > maxLength) {
    throw new Error(`Value must be ${maxLength} characters or fewer.`)
  }
  return trimmed
}

export function parseRequiredMobile(value: string, label: string): string {
  const trimmed = value.trim()
  if (!MOBILE_PATTERN.test(trimmed)) {
    throw new Error(`${label} must be exactly 10 digits.`)
  }
  return trimmed
}

export function parseOptionalMobile(value: string, label: string): string | undefined {
  const trimmed = value.trim()
  if (!trimmed) return undefined
  if (!MOBILE_PATTERN.test(trimmed)) {
    throw new Error(`${label} must be exactly 10 digits.`)
  }
  return trimmed
}

export function parseRequiredAadhar(value: string): string {
  const trimmed = value.trim()
  if (!AADHAR_PATTERN.test(trimmed)) {
    throw new Error('Aadhar number must be exactly 12 digits.')
  }
  return trimmed
}

export function parseRequiredIfsc(value: string): string {
  const trimmed = value.trim().toUpperCase()
  if (!IFSC_PATTERN.test(trimmed)) {
    throw new Error('IFSC code must match the format SBIN0001234.')
  }
  return trimmed
}

export function parseRequiredMasterDate(value: string, label: string): string {
  const masterDate = inputValueToMasterDate(value)
  if (!masterDate || !isValidMasterDate(masterDate)) {
    throw new Error(`${label} is required and must be a valid date.`)
  }
  return masterDate
}

export function parseOptionalMasterDate(value: string): string | null | undefined {
  const trimmed = value.trim()
  if (!trimmed) return undefined
  const masterDate = inputValueToMasterDate(trimmed)
  if (!masterDate || !isValidMasterDate(masterDate)) {
    throw new Error('Date of leaving must be a valid date.')
  }
  return masterDate
}

export function parseRequiredDocument(value: string, label: string): string {
  const trimmed = value.trim()
  if (!trimmed) {
    throw new Error(`${label} is required.`)
  }
  return trimmed
}

export function handleEmployeeFormError(error: unknown, fallback: string): void {
  toast.error(error instanceof Error ? error.message : fallback)
}

export const defaultBankFields = {
  accountHolderName: '',
  accountNumber: '',
  bankName: '',
  branchName: '',
  ifscCode: '',
  upiId: '',
}

export const defaultDocumentFields = {
  aadharCardFront: '',
  aadharCardBack: '',
  upiScanner: '',
}

export const defaultEmploymentFields = {
  dateOfJoining: '',
  dateOfLeaving: '',
  remarks: '',
}

export const defaultPersonalFields = {
  dateOfBirth: '',
  mobileNumber: '',
  aadharNumber: '',
}
