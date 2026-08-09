import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  PDF_A4,
  PDF_COLORS,
  drawPdfBadge,
  drawPdfCommentCards,
  drawPdfDataTable,
  drawPdfDetailCard,
  drawPdfPageFooters,
  drawPdfSectionTitle,
  drawPdfSummaryBand,
  drawPdfTextPanel,
  ensurePdfSpace,
  getJobPriorityBadgeColor,
  getJobStatusBadgeColor,
  getPdfContentWidth,
} from './pdf-report-layout'

function createMockDoc() {
  let pageCount = 1
  return {
    addPage: vi.fn(() => {
      pageCount += 1
    }),
    getNumberOfPages: vi.fn(() => pageCount),
    setPage: vi.fn(),
    setFillColor: vi.fn(),
    setDrawColor: vi.fn(),
    setFontSize: vi.fn(),
    setFont: vi.fn(),
    setTextColor: vi.fn(),
    rect: vi.fn(),
    roundedRect: vi.fn(),
    line: vi.fn(),
    text: vi.fn(),
    splitTextToSize: vi.fn((value: string) => [value]),
    getTextWidth: vi.fn((value: string) => value.length * 2),
  }
}

describe('pdf-report-layout', () => {
  let doc: ReturnType<typeof createMockDoc>

  beforeEach(() => {
    doc = createMockDoc()
  })

  it('exports PDF constants', () => {
    expect(PDF_A4.width).toBe(210)
    expect(PDF_COLORS.primary).toEqual([234, 88, 12])
  })

  it('getPdfContentWidth subtracts margins', () => {
    expect(getPdfContentWidth(14)).toBe(210 - 28)
    expect(getPdfContentWidth()).toBe(210 - PDF_A4.margin * 2)
  })

  it('ensurePdfSpace returns same y when enough space', () => {
    expect(ensurePdfSpace({ doc: doc as never, y: 10, needed: 5 })).toBe(10)
    expect(doc.addPage).not.toHaveBeenCalled()
  })

  it('ensurePdfSpace adds page when insufficient space', () => {
    const y = ensurePdfSpace({ doc: doc as never, y: PDF_A4.contentBottom, needed: 10 })
    expect(doc.addPage).toHaveBeenCalled()
    expect(y).toBe(PDF_A4.margin)
  })

  it('drawPdfSectionTitle renders title band', () => {
    const nextY = drawPdfSectionTitle(doc as never, 'Details', 20)
    expect(doc.rect).toHaveBeenCalled()
    expect(doc.text).toHaveBeenCalledWith('DETAILS', PDF_A4.margin + 2, 20)
    expect(nextY).toBe(26)
  })

  it('drawPdfBadge renders badge and returns width', () => {
    const width = drawPdfBadge(doc as never, 'OPEN', 10, 20, PDF_COLORS.info)
    expect(doc.roundedRect).toHaveBeenCalled()
    expect(doc.text).toHaveBeenCalledWith('OPEN', 12.5, 20)
    expect(width).toBeGreaterThan(0)
  })

  it('drawPdfSummaryBand renders title, badges, and subtitle', () => {
    const nextY = drawPdfSummaryBand({
      doc: doc as never,
      margin: PDF_A4.margin,
      pageWidth: PDF_A4.width,
      title: 'Job #1',
      subtitle: 'Summary text',
      badges: [{ label: 'HIGH', color: PDF_COLORS.danger }],
      y: 30,
    })
    expect(doc.text).toHaveBeenCalledWith('Job #1', PDF_A4.margin + 4, 38)
    expect(nextY).toBeGreaterThan(30)
  })

  it('drawPdfDetailCard renders fields in two columns by default', () => {
    const nextY = drawPdfDetailCard({
      doc: doc as never,
      margin: PDF_A4.margin,
      contentWidth: getPdfContentWidth(),
      fields: [
        { label: 'Bus', value: 'B-1' },
        { label: 'Status', value: 'Open' },
      ],
      y: 40,
    })
    expect(doc.roundedRect).toHaveBeenCalled()
    expect(doc.text).toHaveBeenCalled()
    expect(nextY).toBeGreaterThan(40)
  })

  it('drawPdfDetailCard supports single column layout', () => {
    drawPdfDetailCard({
      doc: doc as never,
      margin: PDF_A4.margin,
      contentWidth: getPdfContentWidth(),
      fields: [{ label: 'Note', value: 'Long value' }],
      y: 40,
      columns: 1,
    })
    expect(doc.text).toHaveBeenCalledWith('Note', PDF_A4.margin + 4, expect.any(Number))
  })

  it('drawPdfTextPanel renders text with fallback em dash', () => {
    const nextY = drawPdfTextPanel({
      doc: doc as never,
      margin: PDF_A4.margin,
      contentWidth: getPdfContentWidth(),
      text: '',
      y: 50,
    })
    expect(doc.splitTextToSize).toHaveBeenCalledWith('—', expect.any(Number))
    expect(nextY).toBeGreaterThan(50)
  })

  it('drawPdfCommentCards renders each comment', () => {
    const nextY = drawPdfCommentCards({
      doc: doc as never,
      margin: PDF_A4.margin,
      contentWidth: getPdfContentWidth(),
      comments: [{ meta: 'User · Today', note: 'Looks good' }],
      y: 60,
    })
    expect(doc.text).toHaveBeenCalledWith('User · Today', PDF_A4.margin + 4, 65)
    expect(nextY).toBeGreaterThan(60)
  })

  it('drawPdfDataTable renders rows and optional footer', () => {
    type Row = { name: string; qty: string }
    const columns = [
      { header: 'Name', width: 80, value: (row: Row) => row.name },
      { header: 'Qty', width: 40, align: 'right' as const, value: (row: Row) => row.qty },
    ]

    const nextY = drawPdfDataTable({
      doc: doc as never,
      margin: PDF_A4.margin,
      contentWidth: 120,
      columns,
      rows: [
        { name: 'Part A', qty: '2' },
        { name: 'Part B', qty: '1' },
      ],
      y: 70,
      footerLabel: 'Total',
      footerValue: '3',
    })

    expect(doc.text).toHaveBeenCalledWith('Name', PDF_A4.margin + 2, expect.any(Number), { align: 'left' })
    expect(doc.text).toHaveBeenCalledWith('Total', expect.any(Number), expect.any(Number))
    expect(nextY).toBeGreaterThan(70)
  })

  it('drawPdfDataTable paginates when row exceeds content bottom', () => {
    type Row = { name: string }
    const columns = [{ header: 'Name', width: 80, value: (row: Row) => row.name }]
    doc.splitTextToSize.mockImplementation((value: string) => Array(20).fill(value))

    drawPdfDataTable({
      doc: doc as never,
      margin: PDF_A4.margin,
      contentWidth: 80,
      columns,
      rows: [{ name: 'Very long row' }],
      y: PDF_A4.contentBottom - 5,
    })

    expect(doc.addPage).toHaveBeenCalled()
  })

  it('drawPdfPageFooters renders on every page', () => {
    doc.getNumberOfPages.mockReturnValue(2)
    drawPdfPageFooters(doc as never, 'Samanvi Ticketing')
    expect(doc.setPage).toHaveBeenCalledTimes(2)
    expect(doc.text).toHaveBeenCalledWith('Samanvi Ticketing', PDF_A4.margin, PDF_A4.footerY)
    expect(doc.text).toHaveBeenCalledWith('Page 1 of 2', PDF_A4.width - PDF_A4.margin, PDF_A4.footerY, {
      align: 'right',
    })
  })

  describe('badge color helpers', () => {
    it.each([
      ['urgent', PDF_COLORS.danger],
      ['high', PDF_COLORS.primary],
      ['medium', PDF_COLORS.warning],
      ['low', PDF_COLORS.neutral],
      ['unknown', PDF_COLORS.neutral],
    ] as const)('getJobPriorityBadgeColor(%s)', (priority, expected) => {
      expect(getJobPriorityBadgeColor(priority)).toBe(expected)
    })

    it.each([
      ['completed', PDF_COLORS.success],
      ['closed', PDF_COLORS.success],
      ['in_progress', PDF_COLORS.info],
      ['assigned', PDF_COLORS.info],
      ['on_hold', PDF_COLORS.warning],
      ['cancelled', PDF_COLORS.danger],
      ['created', PDF_COLORS.neutral],
    ] as const)('getJobStatusBadgeColor(%s)', (status, expected) => {
      expect(getJobStatusBadgeColor(status)).toBe(expected)
    })
  })
})
