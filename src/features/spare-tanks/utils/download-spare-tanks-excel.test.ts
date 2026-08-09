import { beforeEach, describe, expect, it, vi } from 'vitest'

import { makeSpareTank } from '@/test/fixtures/masters'
import { downloadSpareTanksExcel } from './download-spare-tanks-excel'

const { mockWriteFile, mockJsonToSheet, mockBookNew, mockBookAppendSheet } = vi.hoisted(() => {
  const worksheet = {}
  return {
    mockWriteFile: vi.fn(),
    mockJsonToSheet: vi.fn(() => worksheet),
    mockBookNew: vi.fn(() => ({})),
    mockBookAppendSheet: vi.fn(),
  }
})

vi.mock('xlsx', () => {
  const utils = {
    json_to_sheet: mockJsonToSheet,
    book_new: mockBookNew,
    book_append_sheet: mockBookAppendSheet,
  }
  return {
    default: { utils, writeFile: mockWriteFile },
    utils,
    writeFile: mockWriteFile,
  }
})

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
