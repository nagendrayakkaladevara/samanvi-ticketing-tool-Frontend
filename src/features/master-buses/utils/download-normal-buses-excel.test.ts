import { beforeEach, describe, expect, it, vi } from 'vitest'

import { makeMasterBus } from '@/test/fixtures/masters'
import { downloadNormalBusesExcel } from './download-normal-buses-excel'

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

describe('downloadNormalBusesExcel', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('does nothing for empty list', async () => {
    await downloadNormalBusesExcel([])
    expect(mockWriteFile).not.toHaveBeenCalled()
  })

  it('writes excel file with bus rows', async () => {
    await downloadNormalBusesExcel([makeMasterBus()])

    expect(mockJsonToSheet).toHaveBeenCalled()
    expect(mockBookNew).toHaveBeenCalled()
    expect(mockBookAppendSheet).toHaveBeenCalled()
    expect(mockWriteFile).toHaveBeenCalledWith(expect.anything(), expect.stringMatching(/^normal-buses-/))
  })

  it('uses em dash for blank remarks and trims whitespace remarks', async () => {
    await downloadNormalBusesExcel([
      makeMasterBus({ remarks: '' }),
      makeMasterBus({ busNumber: 'BUS-02', remarks: '  trimmed  ' }),
      makeMasterBus({ busNumber: 'BUS-03', remarks: '   ' }),
    ])

    const rows = mockJsonToSheet.mock.calls[0]?.[0] as Array<Record<string, string>>
    expect(rows[0]?.Remarks).toBe('—')
    expect(rows[1]?.Remarks).toBe('trimmed')
    expect(rows[2]?.Remarks).toBe('—')
  })
})
