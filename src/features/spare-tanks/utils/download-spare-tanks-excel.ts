import type { SpareTank } from '@/features/spare-tanks/types/spare-tank'
import { compareSpareTanksByBusNumber, toSpareTankGridRow } from '@/features/spare-tanks/utils/spare-tank-model'

export async function downloadSpareTanksExcel(spareTanks: SpareTank[]): Promise<void> {
  if (spareTanks.length === 0) return

  const XLSX = await import('xlsx')
  const sorted = [...spareTanks].sort(compareSpareTanksByBusNumber)

  const rows = sorted.map((item, index) => {
    const row = toSpareTankGridRow(item)
    return {
      'S.No.': index + 1,
      'Bus No': row.busNumber,
      'Owner Name': row.ownerName,
      'Last Updated': row.updatedAtLabel,
    }
  })

  const worksheet = XLSX.utils.json_to_sheet(rows)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Spare Tanks')

  worksheet['!cols'] = [{ wch: 8 }, { wch: 14 }, { wch: 28 }, { wch: 22 }]

  const dateStamp = new Date().toISOString().slice(0, 10)
  XLSX.writeFile(workbook, `spare-tanks-${dateStamp}.xlsx`)
}
