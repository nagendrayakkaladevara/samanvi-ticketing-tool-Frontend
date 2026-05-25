import type { ServiceFor } from '@/features/service-for/types/service-for'

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

export async function downloadServiceForExcel(items: ServiceFor[]): Promise<void> {
  if (items.length === 0) return

  const XLSX = await import('xlsx')

  const rows = items.map((item, index) => ({
    'S.No.': index + 1,
    'Service For': item.serviceFor,
    'Last Updated': formatDateTime(item.updatedAt),
  }))

  const worksheet = XLSX.utils.json_to_sheet(rows)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Service For')

  worksheet['!cols'] = [{ wch: 8 }, { wch: 36 }, { wch: 22 }]

  const dateStamp = new Date().toISOString().slice(0, 10)
  XLSX.writeFile(workbook, `service-for-${dateStamp}.xlsx`)
}
