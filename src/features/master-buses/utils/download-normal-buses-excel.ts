import type { MasterBus } from '@/features/master-buses/types/master-bus'
import { compareMasterBusesByNumber, toMasterBusGridRow } from '@/features/master-buses/utils/master-bus-model'

export async function downloadNormalBusesExcel(buses: MasterBus[]): Promise<void> {
  if (buses.length === 0) return

  const XLSX = await import('xlsx')
  const sorted = [...buses].sort(compareMasterBusesByNumber)

  const rows = sorted.map((bus, index) => {
    const row = toMasterBusGridRow(bus)
    return {
      'S.No.': index + 1,
      'Bus No': row.busNumber,
      'Engine No': row.engineNumber,
      'Chassis No': row.chassisNumber,
      'Purchase Date': row.purchaseDateLabel,
      Odometer: row.odometer,
      Insurance: row.insuranceValidityLabel,
      Pollution: row.pollutionValidityLabel,
      FC: row.fcValidityLabel,
      'Base Permit': row.basePermitValidityLabel,
      'Home Tax': row.homeTaxValidityLabel,
      AITP: row.aitpValidityLabel,
      'AITP Auth': row.aitpAuthorizationValidityLabel,
      'Service Out': row.serviceOutDateLabel,
      Remarks: row.remarks?.trim() ? row.remarks.trim() : '—',
    }
  })

  const worksheet = XLSX.utils.json_to_sheet(rows)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Normal Buses')

  worksheet['!cols'] = [
    { wch: 8 },
    { wch: 14 },
    { wch: 16 },
    { wch: 16 },
    { wch: 14 },
    { wch: 12 },
    { wch: 14 },
    { wch: 14 },
    { wch: 12 },
    { wch: 14 },
    { wch: 14 },
    { wch: 12 },
    { wch: 14 },
    { wch: 14 },
    { wch: 24 },
  ]

  const dateStamp = new Date().toISOString().slice(0, 10)
  XLSX.writeFile(workbook, `normal-buses-${dateStamp}.xlsx`)
}
