import { beforeEach, describe, expect, it, vi } from 'vitest'

function createMockJsPdf() {
  const doc = {
    addImage: vi.fn(),
    setFontSize: vi.fn(),
    setFont: vi.fn(),
    setTextColor: vi.fn(),
    text: vi.fn(),
    setDrawColor: vi.fn(),
    line: vi.fn(),
    getImageProperties: vi.fn(() => ({ width: 200, height: 100, fileType: 'PNG' })),
    splitTextToSize: vi.fn((text: string) => [text]),
    setFillColor: vi.fn(),
    roundedRect: vi.fn(),
  }
  return doc
}

function mockCanvasContext() {
  return {
    drawImage: vi.fn(),
  }
}

function mockImage(onLoad?: () => void) {
  class MockImage {
    naturalWidth = 100
    naturalHeight = 50
    onload: (() => void) | null = null
    onerror: (() => void) | null = null
    src = ''

    constructor() {
      queueMicrotask(() => {
        if (onLoad) {
          onLoad()
        } else {
          this.onload?.()
        }
      })
    }
  }
  return MockImage
}

describe('pdf-report-branding', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    vi.stubGlobal(
      'Image',
      mockImage(),
    )
    vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
      if (tag === 'canvas') {
        return {
          width: 0,
          height: 0,
          getContext: () => mockCanvasContext(),
          toDataURL: () => 'data:image/png;base64,abc',
        } as unknown as HTMLCanvasElement
      }
      return document.createElement.bind(document)(tag)
    })
    vi.stubGlobal('URL', {
      createObjectURL: vi.fn(() => 'blob:qr'),
      revokeObjectURL: vi.fn(),
    })
  })

  it('drawPdfReportHeader renders logo and text and returns next y', async () => {
    const { drawPdfReportHeader } = await import('./pdf-report-branding')
    const doc = createMockJsPdf()
    const nextY = await drawPdfReportHeader({
      doc: doc as never,
      margin: 14,
      pageWidth: 210,
      title: 'Report',
      subtitle: 'Generated',
      y: 10,
    })

    expect(doc.addImage).toHaveBeenCalled()
    expect(doc.text).toHaveBeenCalledWith('Report', 196, 14, { align: 'right' })
    expect(doc.text).toHaveBeenCalledWith('Generated', 196, 20, { align: 'right' })
    expect(doc.line).toHaveBeenCalled()
    expect(nextY).toBeGreaterThan(10)
  })

  it('drawPdfReportHeader uses JPEG format when image properties indicate JPEG', async () => {
    const { drawPdfReportHeader } = await import('./pdf-report-branding')
    const doc = createMockJsPdf()
    doc.getImageProperties.mockReturnValue({ width: 400, height: 100, fileType: 'JPEG' })

    await drawPdfReportHeader({
      doc: doc as never,
      margin: 14,
      pageWidth: 210,
      title: 'Report',
      subtitle: 'Generated',
      y: 10,
    })

    expect(doc.addImage).toHaveBeenCalledWith(expect.any(String), 'JPEG', 14, 10, expect.any(Number), expect.any(Number))
  })

  it('createQrDataUrl renders QR to png data url', async () => {
    const { createQrDataUrl } = await import('./pdf-report-branding')
    const dataUrl = await createQrDataUrl('https://example.com/job/1')
    expect(dataUrl).toBe('data:image/png;base64,abc')
    expect(URL.createObjectURL).toHaveBeenCalled()
    expect(URL.revokeObjectURL).toHaveBeenCalled()
  })

  it('drawPdfQrSection draws card, qr, and text', async () => {
    const { drawPdfQrSection } = await import('./pdf-report-branding')
    const doc = createMockJsPdf()

    const nextY = await drawPdfQrSection({
      doc: doc as never,
      margin: 14,
      pageWidth: 210,
      contentWidth: 182,
      url: 'https://example.com/job/1',
      y: 20,
    })

    expect(doc.roundedRect).toHaveBeenCalled()
    expect(doc.addImage).toHaveBeenCalled()
    expect(doc.text).toHaveBeenCalledWith('Scan to view this job', expect.any(Number), expect.any(Number))
    expect(nextY).toBeGreaterThan(20)
  })

  it('rejects when canvas context is unavailable for logo', async () => {
    vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
      if (tag === 'canvas') {
        return {
          width: 0,
          height: 0,
          getContext: () => null,
          toDataURL: () => 'data:image/png;base64,abc',
        } as unknown as HTMLCanvasElement
      }
      return document.createElement.bind(document)(tag)
    })

    const { drawPdfReportHeader } = await import('./pdf-report-branding')
    const doc = createMockJsPdf()

    await expect(
      drawPdfReportHeader({
        doc: doc as never,
        margin: 14,
        pageWidth: 210,
        title: 'Report',
        subtitle: 'Generated',
        y: 10,
      }),
    ).rejects.toThrow('Failed to render image for PDF.')
  })

  it('rejects when image fails to load', async () => {
    class FailingImage {
      onload: (() => void) | null = null
      onerror: (() => void) | null = null
      src = ''

      constructor() {
        queueMicrotask(() => this.onerror?.())
      }
    }
    vi.stubGlobal('Image', FailingImage)

    const { drawPdfReportHeader } = await import('./pdf-report-branding')
    const doc = createMockJsPdf()

    await expect(
      drawPdfReportHeader({
        doc: doc as never,
        margin: 14,
        pageWidth: 210,
        title: 'Report',
        subtitle: 'Generated',
        y: 10,
      }),
    ).rejects.toThrow('Failed to load image for PDF.')
  })
})
