import type { SpareTank } from '@/features/spare-tanks/types/spare-tank'
import { compareSpareTanksByBusNumber, toSpareTankGridRow } from '@/features/spare-tanks/utils/spare-tank-model'
import { downloadPdfTable } from '@/lib/utils/pdf-table-export'

export function downloadSpareTanksPdf(spareTanks: SpareTank[]): void {
  if (spareTanks.length === 0) return

  const sorted = [...spareTanks].sort(compareSpareTanksByBusNumber)
  const rows = sorted.map((item, index) => ({ index: index + 1, grid: toSpareTankGridRow(item) }))
  const dateStamp = new Date().toISOString().slice(0, 10)

  downloadPdfTable({
    title: 'Spare Tanks',
    filename: `spare-tanks-${dateStamp}.pdf`,
    columns: [
      { header: 'S.No.', width: 14, value: (row) => String(row.index) },
      { header: 'Bus No', width: 32, value: (row) => row.grid.busNumber },
      { header: 'Owner Name', width: 80, value: (row) => row.grid.ownerName },
      { header: 'Last Updated', width: 48, value: (row) => row.grid.updatedAtLabel },
    ],
    rows,
  })
}
