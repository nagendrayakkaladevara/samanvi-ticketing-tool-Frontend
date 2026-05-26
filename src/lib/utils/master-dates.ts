const DD_MM_YYYY = /^(0[1-9]|[12]\d|3[01])-(0[1-9]|1[0-2])-\d{4}$/

function parseMasterDateValue(value?: string | null): Date | null {
  if (!value) return null

  if (DD_MM_YYYY.test(value)) {
    const [day, month, year] = value.split('-')
    const parsed = new Date(Number(year), Number(month) - 1, Number(day))
    return Number.isNaN(parsed.getTime()) ? null : parsed
  }

  const isoParsed = new Date(value)
  return Number.isNaN(isoParsed.getTime()) ? null : isoParsed
}

export const MASTER_DATE_WARNING_DAYS = 6

export type MasterDateHighlightStatus = 'expired' | 'warning' | null

function startOfDay(date: Date): Date {
  const normalized = new Date(date)
  normalized.setHours(0, 0, 0, 0)
  return normalized
}

export function isMasterDateBeforeToday(value?: string | null): boolean {
  return getMasterDateHighlightStatus(value) === 'expired'
}

/** Past dates are expired; dates within the next six days (inclusive) are warning. */
export function getMasterDateHighlightStatus(value?: string | null): MasterDateHighlightStatus {
  const parsed = parseMasterDateValue(value)
  if (!parsed) return null

  const today = startOfDay(new Date())
  const target = startOfDay(parsed)

  if (target < today) return 'expired'

  const warningEnd = new Date(today)
  warningEnd.setDate(warningEnd.getDate() + MASTER_DATE_WARNING_DAYS)
  if (target <= warningEnd) return 'warning'

  return null
}

export function masterDateHighlightClassName(status: MasterDateHighlightStatus): string {
  if (status === 'expired') {
    return 'font-medium text-red-600 dark:text-red-400'
  }
  if (status === 'warning') {
    return 'font-medium text-orange-600 dark:text-orange-400'
  }
  return ''
}

export function formatMasterDateDisplay(value?: string | null): string {
  if (!value) return '—'

  if (DD_MM_YYYY.test(value)) {
    const [day, month, year] = value.split('-')
    const parsed = new Date(Number(year), Number(month) - 1, Number(day))
    if (!Number.isNaN(parsed.getTime())) {
      return new Intl.DateTimeFormat(undefined, {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }).format(parsed)
    }
  }

  const isoParsed = new Date(value)
  if (!Number.isNaN(isoParsed.getTime())) {
    return new Intl.DateTimeFormat(undefined, {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(isoParsed)
  }

  return value
}

export function masterDateToInputValue(value?: string | null): string {
  if (!value) return ''
  if (DD_MM_YYYY.test(value)) {
    const [day, month, year] = value.split('-')
    return `${year}-${month}-${day}`
  }

  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return ''

  const year = parsed.getFullYear()
  const month = String(parsed.getMonth() + 1).padStart(2, '0')
  const day = String(parsed.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function inputValueToMasterDate(value: string): string | undefined {
  const trimmed = value.trim()
  if (!trimmed) return undefined

  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed)
  if (!match) return undefined

  const [, year, month, day] = match
  return `${day}-${month}-${year}`
}

export function isValidMasterDate(value: string): boolean {
  return DD_MM_YYYY.test(value.trim())
}

export function inputValueToDate(value?: string | null): Date | undefined {
  if (!value) return undefined

  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim())
  if (!match) return undefined

  const [, year, month, day] = match
  const parsed = new Date(Number(year), Number(month) - 1, Number(day))
  if (Number.isNaN(parsed.getTime())) return undefined

  return parsed
}

export function dateToInputValue(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}
