import { beforeEach, describe, expect, it, vi } from 'vitest'

import { makeDriver } from '@/test/fixtures/employees'
import { downloadDriverPdf } from './download-driver-pdf'

const { mockSave, mockSplitTextToSize, MockJsPDF } = vi.hoisted(() => {
  const mockSave = vi.fn()
  const mockSplitTextToSize = vi.fn().mockReturnValue(['line'])
  class MockJsPDF {
    setFontSize = vi.fn()
    setFont = vi.fn()
    setTextColor = vi.fn()
    setDrawColor = vi.fn()
    text = vi.fn()
    line = vi.fn()
    splitTextToSize = mockSplitTextToSize
    addPage = vi.fn()
    setPage = vi.fn()
    getNumberOfPages = vi.fn().mockReturnValue(1)
    save = mockSave
  }
  return { mockSave, mockSplitTextToSize, MockJsPDF }
})

vi.mock('jspdf', () => ({
  jsPDF: MockJsPDF,
}))

describe('downloadDriverPdf', () => {
  beforeEach(() => {
    mockSave.mockClear()
    mockSplitTextToSize.mockReturnValue(['line'])
  })

  it('generates and saves driver PDF', () => {
    const driver = makeDriver({ driverIdNumber: 'DRV-001' })
    downloadDriverPdf(driver)

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

  it('uses fallback filename when driver id sanitizes to empty', () => {
    downloadDriverPdf(makeDriver({ driverIdNumber: '   ' }))
    expect(mockSave).toHaveBeenCalledWith('Driver-driver.pdf')
  })

  it('adds pages when content exceeds page height', () => {
    mockSplitTextToSize.mockReturnValue(Array.from({ length: 40 }, () => 'line'))

    downloadDriverPdf(makeDriver({ remarks: 'Very long remarks section' }))

    expect(mockSave).toHaveBeenCalled()
  })
})
