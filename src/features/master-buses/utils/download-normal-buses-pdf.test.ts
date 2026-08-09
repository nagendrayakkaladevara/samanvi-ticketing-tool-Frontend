import { beforeEach, describe, expect, it, vi } from 'vitest'

import { makeMasterBus } from '@/test/fixtures/masters'
import { downloadNormalBusesPdf } from './download-normal-buses-pdf'

const mockDownloadPdfTable = vi.fn()

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
})
