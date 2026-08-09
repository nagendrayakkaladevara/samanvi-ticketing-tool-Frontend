import { beforeEach, describe, expect, it, vi } from 'vitest'

import { makeSpareTank } from '@/test/fixtures/masters'
import { downloadSpareTanksPdf } from './download-spare-tanks-pdf'

const { mockDownloadPdfTable } = vi.hoisted(() => ({
  mockDownloadPdfTable: vi.fn(),
}))

vi.mock('@/lib/utils/pdf-table-export', () => ({
  downloadPdfTable: mockDownloadPdfTable,
}))

describe('downloadSpareTanksPdf', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('does nothing for empty list', () => {
    downloadSpareTanksPdf([])
    expect(mockDownloadPdfTable).not.toHaveBeenCalled()
  })

  it('exports sorted spare tanks and evaluates column callbacks', () => {
    downloadSpareTanksPdf([
      makeSpareTank({ busNumber: 'BUS-10', ownerName: 'Owner A' }),
      makeSpareTank({ id: 'st2', busNumber: 'BUS-2', ownerName: 'Owner B' }),
    ])

    expect(mockDownloadPdfTable).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Spare Tanks' }),
    )
    const call = mockDownloadPdfTable.mock.calls[0][0]
    expect(call.rows[0].grid.busNumber).toBe('BUS-2')

    expect(call.columns).toHaveLength(4)
    expect(call.columns[0].value(call.rows[0])).toBe('1')
    expect(call.columns[1].value(call.rows[0])).toBe('BUS-2')
    expect(call.columns[2].value(call.rows[0])).toBe('Owner B')
    expect(call.columns[3].value(call.rows[0])).toEqual(expect.any(String))
  })

  it('invokes every column value callback on exported rows', () => {
    downloadSpareTanksPdf([makeSpareTank({ busNumber: 'KA-01', ownerName: 'Owner' })])

    const call = mockDownloadPdfTable.mock.calls[0][0]
    const row = call.rows[0]

    for (const column of call.columns) {
      expect(column.value(row)).toEqual(expect.any(String))
    }
    expect(call.columns[0].value(row)).toBe('1')
    expect(call.columns[1].value(row)).toBe('KA-01')
    expect(call.columns[2].value(row)).toBe('Owner')
  })
})
