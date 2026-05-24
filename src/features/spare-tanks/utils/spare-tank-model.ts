import type { SpareTank, SpareTankGridRow } from '@/features/spare-tanks/types/spare-tank'

export function toSpareTankGridRow(item: SpareTank): SpareTankGridRow {
  return {
    id: item.id,
    busNumber: item.busNumber,
    ownerName: item.ownerName,
    updatedAt: item.updatedAt ?? '',
    updatedAtLabel: formatSpareTankUpdatedAt(item.updatedAt),
  }
}

export function compareSpareTanksByBusNumber(a: SpareTank, b: SpareTank): number {
  return a.busNumber.localeCompare(b.busNumber, undefined, { numeric: true })
}

function formatDateTime(rawDate?: string): string {
  if (!rawDate) return '—'
  const parsed = new Date(rawDate)
  if (Number.isNaN(parsed.getTime())) return '—'

  return new Intl.DateTimeFormat(undefined, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(parsed)
}

export function formatSpareTankUpdatedAt(rawDate?: string): string {
  return formatDateTime(rawDate)
}
