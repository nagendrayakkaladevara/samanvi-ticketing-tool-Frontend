import { beforeEach, describe, expect, it, vi } from 'vitest'

import { makeDriver } from '@/test/fixtures/employees'
import { downloadDriverPdf } from './download-driver-pdf'

const { mockSave, mockJsPDF } = vi.hoisted(() => {
  const mockSave = vi.fn()
  const mockJsPDF = vi.fn().mockImplementation(() => ({
    setFontSize: vi.fn(),
    setFont: vi.fn(),
    setTextColor: vi.fn(),
    setDrawColor: vi.fn(),
    text: vi.fn(),
    line: vi.fn(),
    splitTextToSize: vi.fn().mockReturnValue(['line']),
    addPage: vi.fn(),
    setPage: vi.fn(),
    getNumberOfPages: vi.fn().mockReturnValue(1),
    save: mockSave,
  }))
  return { mockSave, mockJsPDF }
})

vi.mock('jspdf', () => ({
  jsPDF: mockJsPDF,
}))

describe('downloadDriverPdf', () => {
  beforeEach(() => {
    mockSave.mockClear()
    mockJsPDF.mockClear()
  })

  it('generates and saves driver PDF', () => {
    const driver = makeDriver({ driverIdNumber: 'DRV-001' })
    downloadDriverPdf(driver)

    expect(mockJsPDF).toHaveBeenCalled()
    expect(mockSave).toHaveBeenCalledWith('Driver-DRV-001.pdf')
  })

  it('sanitizes unsafe filename characters', () => {
    downloadDriverPdf(makeDriver({ driverIdNumber: 'DRV/001' }))
    expect(mockSave).toHaveBeenCalledWith('Driver-DRV-001.pdf')
  })

  it('skips record info section when timestamps missing', () => {
    downloadDriverPdf(makeDriver({ createdAt: undefined, updatedAt: undefined }))
    expect(mockSave).toHaveBeenCalled()
  })
})
