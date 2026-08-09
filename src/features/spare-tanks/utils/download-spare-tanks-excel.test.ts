import { beforeEach, describe, expect, it, vi } from 'vitest'

import { makeSpareTank } from '@/test/fixtures/masters'
import { downloadSpareTanksExcel } from './download-spare-tanks-excel'

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

describe('downloadSpareTanksExcel', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('does nothing for empty list', async () => {
    await downloadSpareTanksExcel([])
    expect(mockWriteFile).not.toHaveBeenCalled()
  })

  it('writes excel file', async () => {
    await downloadSpareTanksExcel([makeSpareTank()])
    expect(mockWriteFile).toHaveBeenCalledWith(expect.anything(), expect.stringMatching(/^spare-tanks-/))
  })
})
