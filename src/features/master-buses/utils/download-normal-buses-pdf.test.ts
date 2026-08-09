import { beforeEach, describe, expect, it, vi } from 'vitest'

import { makeMasterBus } from '@/test/fixtures/masters'
import { downloadNormalBusesPdf } from './download-normal-buses-pdf'

const { mockDownloadPdfTable } = vi.hoisted(() => ({
  mockDownloadPdfTable: vi.fn(),
}))

vi.mock('@/lib/utils/pdf-table-export', () => ({
  downloadPdfTable: mockDownloadPdfTable,
}))

describe('downloadNormalBusesPdf', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('does nothing for empty bus list', () => {
    downloadNormalBusesPdf([])
    expect(mockDownloadPdfTable).not.toHaveBeenCalled()
  })

  it('exports sorted buses to PDF table', () => {
    const buses = [
      makeMasterBus({ busNumber: 'BUS-10' }),
      makeMasterBus({ id: 'b2', busNumber: 'BUS-2' }),
    ]

    downloadNormalBusesPdf(buses)

    expect(mockDownloadPdfTable).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Normal Buses',
        orientation: 'landscape',
      }),
    )

    const call = mockDownloadPdfTable.mock.calls[0][0]
    expect(call.rows[0].grid.busNumber).toBe('BUS-2')
    expect(call.rows[1].grid.busNumber).toBe('BUS-10')
  })

  it('evaluates every column value callback including empty remarks fallback', () => {
    const bus = makeMasterBus({
      busNumber: 'KA-01',
      remarks: '  note  ',
      odometer: 1234,
    })
    downloadNormalBusesPdf([bus])

    const call = mockDownloadPdfTable.mock.calls[0][0]
    const row = call.rows[0]

    expect(call.columns.map((column: { header: string }) => column.header)).toEqual([
      'S.No.',
      'Bus No',
      'Engine No',
      'Chassis No',
      'Purchase',
      'Odometer',
      'Insurance',
      'Pollution',
      'FC',
      'Base Permit',
      'Home Tax',
      'AITP',
      'AITP Auth',
      'Service Out',
      'Remarks',
    ])

    for (const column of call.columns) {
      expect(column.value(row)).toEqual(expect.any(String))
    }

    expect(call.columns[0].value(row)).toBe('1')
    expect(call.columns[1].value(row)).toBe('KA-01')
    expect(call.columns[5].value(row)).toBe((1234).toLocaleString())
    expect(call.columns[14].value(row)).toBe('note')

    mockDownloadPdfTable.mockClear()
    downloadNormalBusesPdf([makeMasterBus({ remarks: '   ' })])
    const blankRemarksRow = mockDownloadPdfTable.mock.calls[0][0].rows[0]
    expect(mockDownloadPdfTable.mock.calls[0][0].columns[14].value(blankRemarksRow)).toBe('—')
  })
})
