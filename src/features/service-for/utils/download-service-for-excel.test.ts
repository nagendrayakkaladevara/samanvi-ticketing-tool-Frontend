import { beforeEach, describe, expect, it, vi } from 'vitest'

import { makeServiceFor } from '@/test/fixtures/masters'
import { downloadServiceForExcel } from './download-service-for-excel'

const mockWriteFile = vi.fn()
const mockJsonToSheet = vi.fn().mockReturnValue({})
const mockBookNew = vi.fn().mockReturnValue({})
const mockBookAppendSheet = vi.fn()

vi.mock('xlsx', () => ({
  default: {
    utils: {
      json_to_sheet: mockJsonToSheet,
      book_new: mockBookNew,
      book_append_sheet: mockBookAppendSheet,
    },
    writeFile: mockWriteFile,
  },
  utils: {
    json_to_sheet: mockJsonToSheet,
    book_new: mockBookNew,
    book_append_sheet: mockBookAppendSheet,
  },
  writeFile: mockWriteFile,
}))

describe('downloadServiceForExcel', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('does nothing for empty list', async () => {
    await downloadServiceForExcel([])
    expect(mockWriteFile).not.toHaveBeenCalled()
  })

  it('writes excel with service for rows', async () => {
    await downloadServiceForExcel([makeServiceFor()])
    expect(mockJsonToSheet).toHaveBeenCalled()
    expect(mockWriteFile).toHaveBeenCalledWith(expect.anything(), expect.stringMatching(/^service-for-/))
  })
})
