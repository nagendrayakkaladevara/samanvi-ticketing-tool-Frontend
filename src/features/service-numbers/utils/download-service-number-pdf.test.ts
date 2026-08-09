import { beforeEach, describe, expect, it, vi } from 'vitest'

import { makeServiceNumber } from '@/test/fixtures/masters'
import { downloadServiceNumberPdf } from './download-service-number-pdf'

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

describe('downloadServiceNumberPdf', () => {
  beforeEach(() => {
    mockSave.mockClear()
    mockSplitTextToSize.mockReturnValue(['line'])
  })

  it('generates and saves service number PDF', () => {
    downloadServiceNumberPdf(makeServiceNumber({ serviceNo: '101' }))
    expect(mockSave).toHaveBeenCalledWith('ServiceNo-101.pdf')
  })

  it('sanitizes unsafe filename characters', () => {
    downloadServiceNumberPdf(makeServiceNumber({ serviceNo: '10/1' }))
    expect(mockSave).toHaveBeenCalledWith('ServiceNo-10-1.pdf')
  })

  it('uses fallback filename when service number sanitizes to empty', () => {
    downloadServiceNumberPdf(makeServiceNumber({ serviceNo: '   ' }))
    expect(mockSave).toHaveBeenCalledWith('ServiceNo-service-number.pdf')
  })

  it('adds pages when content exceeds page height', () => {
    mockSplitTextToSize.mockReturnValue(Array.from({ length: 40 }, () => 'line'))

    downloadServiceNumberPdf(makeServiceNumber({ serviceNo: '101', remarks: 'Long remarks block' }))

    expect(mockSave).toHaveBeenCalled()
  })

  it('uses multi-line detail row height when text wraps', () => {
    mockSplitTextToSize.mockReturnValue(['line1', 'line2', 'line3'])

    downloadServiceNumberPdf(makeServiceNumber({ serviceNo: '102' }))

    expect(mockSave).toHaveBeenCalledWith('ServiceNo-102.pdf')
  })
})
