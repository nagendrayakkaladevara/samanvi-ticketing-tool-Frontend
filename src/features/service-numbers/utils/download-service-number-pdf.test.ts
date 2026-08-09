import { beforeEach, describe, expect, it, vi } from 'vitest'

import { makeServiceNumber } from '@/test/fixtures/masters'
import { downloadServiceNumberPdf } from './download-service-number-pdf'

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

describe('downloadServiceNumberPdf', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('generates and saves service number PDF', () => {
    downloadServiceNumberPdf(makeServiceNumber({ serviceNo: '101' }))
    expect(mockJsPDF).toHaveBeenCalled()
    expect(mockSave).toHaveBeenCalledWith('ServiceNo-101.pdf')
  })

  it('sanitizes unsafe filename characters', () => {
    downloadServiceNumberPdf(makeServiceNumber({ serviceNo: '10/1' }))
    expect(mockSave).toHaveBeenCalledWith('ServiceNo-10-1.pdf')
  })
})
