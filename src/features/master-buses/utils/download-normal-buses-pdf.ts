import type { MasterBus } from '@/features/master-buses/types/master-bus'
import { compareMasterBusesByNumber, toMasterBusGridRow } from '@/features/master-buses/utils/master-bus-model'
import { downloadPdfTable } from '@/lib/utils/pdf-table-export'

export function downloadNormalBusesPdf(buses: MasterBus[]): void {
  if (buses.length === 0) return

  const sorted = [...buses].sort(compareMasterBusesByNumber)
  const rows = sorted.map((bus, index) => ({ index: index + 1, grid: toMasterBusGridRow(bus) }))
  const dateStamp = new Date().toISOString().slice(0, 10)

  downloadPdfTable({
    title: 'Normal Buses',
    filename: `normal-buses-${dateStamp}.pdf`,
    orientation: 'landscape',
    columns: [
      { header: 'S.No.', width: 10, value: (row) => String(row.index) },
      { header: 'Bus No', width: 18, value: (row) => row.grid.busNumber },
      { header: 'Engine No', width: 22, value: (row) => row.grid.engineNumber },
      { header: 'Chassis No', width: 22, value: (row) => row.grid.chassisNumber },
      { header: 'Purchase', width: 18, value: (row) => row.grid.purchaseDateLabel },
      {
        header: 'Odometer',
        width: 16,
        value: (row) => row.grid.odometer.toLocaleString(),
      },
      { header: 'Insurance', width: 18, value: (row) => row.grid.insuranceValidityLabel },
      { header: 'Pollution', width: 18, value: (row) => row.grid.pollutionValidityLabel },
      { header: 'FC', width: 14, value: (row) => row.grid.fcValidityLabel },
      { header: 'Base Permit', width: 18, value: (row) => row.grid.basePermitValidityLabel },
      { header: 'Home Tax', width: 16, value: (row) => row.grid.homeTaxValidityLabel },
      { header: 'AITP', width: 14, value: (row) => row.grid.aitpValidityLabel },
      { header: 'AITP Auth', width: 18, value: (row) => row.grid.aitpAuthorizationValidityLabel },
      { header: 'Service Out', width: 18, value: (row) => row.grid.serviceOutDateLabel },
      {
        header: 'Remarks',
        width: 28,
        value: (row) => (row.grid.remarks?.trim() ? row.grid.remarks.trim() : '—'),
      },
    ],
    rows,
  })
}
