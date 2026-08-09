import { beforeEach, describe, expect, it, vi } from 'vitest'

import { makeDriver } from '@/test/fixtures/employees'
import { downloadDriverPdf } from './download-driver-pdf'

const { mockSave, MockJsPDF } = vi.hoisted(() => {
  const mockSave = vi.fn()
  class MockJsPDF {
    setFontSize = vi.fn()
    setFont = vi.fn()
    setTextColor = vi.fn()
    setDrawColor = vi.fn()
    text = vi.fn()
    line = vi.fn()
    splitTextToSize = vi.fn().mockReturnValue(['line'])
    addPage = vi.fn()
    setPage = vi.fn()
    getNumberOfPages = vi.fn().mockReturnValue(1)
    save = mockSave
  }
  return { mockSave, MockJsPDF }
})

vi.mock('jspdf', () => ({
  jsPDF: MockJsPDF,
}))

describe('downloadDriverPdf', () => {
  beforeEach(() => {
    mockSave.mockClear()
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
})
