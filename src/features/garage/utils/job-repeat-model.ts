import { dateToInputValue, inputValueToDate, masterDateToInputValue } from '@/lib/utils/master-dates'

import { formatJobDate } from '@/features/garage/utils/job-list-model'
import type { RepairJob } from '@/features/garage/types/job'

export function formatRepeatScheduledDate(value?: string | null): string {
  if (!value) return '—'
  return formatJobDate(value)
}

export function getMinRepeatScheduleDateInput(): string {
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  tomorrow.setHours(0, 0, 0, 0)
  return dateToInputValue(tomorrow)
}

export function isValidRepeatScheduleDateInput(dateInput: string): boolean {
  const selected = inputValueToDate(dateInput)
  if (!selected) return false

  const min = inputValueToDate(getMinRepeatScheduleDateInput())
  if (!min) return false

  selected.setHours(0, 0, 0, 0)
  min.setHours(0, 0, 0, 0)
  return selected.getTime() >= min.getTime()
}

export function repeatScheduleDateInputToIso(dateInput: string): string {
  const selected = inputValueToDate(dateInput)
  if (!selected) {
    throw new Error('Select a valid date for the repeat job.')
  }

  const scheduled = new Date(
    selected.getFullYear(),
    selected.getMonth(),
    selected.getDate(),
    12,
    0,
    0,
    0,
  )

  if (scheduled.getTime() <= Date.now()) {
    throw new Error('Repeat job must be scheduled for a future date.')
  }

  return scheduled.toISOString()
}

export function repeatScheduledForToDateInput(value?: string | null): string {
  if (!value) return ''
  return masterDateToInputValue(value)
}

export function hasPendingRepeatSchedule(job: Pick<RepairJob, 'repeatScheduledFor' | 'repeatProcessedAt'>): boolean {
  return Boolean(job.repeatScheduledFor && !job.repeatProcessedAt)
}

export function hasProcessedRepeatSchedule(job: Pick<RepairJob, 'repeatProcessedAt'>): boolean {
  return Boolean(job.repeatProcessedAt)
}
