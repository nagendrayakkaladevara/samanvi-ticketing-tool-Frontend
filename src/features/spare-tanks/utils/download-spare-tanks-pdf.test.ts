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

  it('exports sorted spare tanks', () => {
    downloadSpareTanksPdf([
      makeSpareTank({ busNumber: 'BUS-10' }),
      makeSpareTank({ id: 'st2', busNumber: 'BUS-2' }),
    ])

    expect(mockDownloadPdfTable).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Spare Tanks' }),
    )
    const call = mockDownloadPdfTable.mock.calls[0][0]
    expect(call.rows[0].grid.busNumber).toBe('BUS-2')
  })
})
