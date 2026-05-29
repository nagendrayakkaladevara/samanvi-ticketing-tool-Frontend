import type { RepairJobPart } from '@/features/garage/types/job'
import { formatRepairPartPrice } from '@/features/garage/utils/repair-part-model'

export function getJobPartLineTotal(part: RepairJobPart): number {
  const unitPrice = Number.parseFloat(part.unitPrice)
  if (Number.isNaN(unitPrice)) return 0
  return part.quantity * unitPrice
}

export function formatJobPartLineTotal(part: RepairJobPart): string {
  return formatRepairPartPrice(getJobPartLineTotal(part).toFixed(2))
}

export function getJobPartsTotal(parts: RepairJobPart[]): number {
  return parts.reduce((sum, part) => sum + getJobPartLineTotal(part), 0)
}

export function formatJobPartsTotal(parts: RepairJobPart[]): string {
  return formatRepairPartPrice(getJobPartsTotal(parts).toFixed(2))
}

export function formatJobPartAddedAt(value?: string): string {
  if (!value) return '—'
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return '—'

  return new Intl.DateTimeFormat(undefined, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(parsed)
}
