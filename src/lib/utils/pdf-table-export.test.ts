import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const saveMock = vi.fn()
let pageCount = 1
let splitLineCount = 1

vi.mock('jspdf', () => ({
  jsPDF: vi.fn(() => ({
    setFontSize: vi.fn(),
    setFont: vi.fn(),
    setTextColor: vi.fn(),
    setFillColor: vi.fn(),
    text: vi.fn(),
    rect: vi.fn(),
    splitTextToSize: vi.fn(() => Array(splitLineCount).fill('line')),
    addPage: vi.fn(() => {
      pageCount += 1
    }),
    getNumberOfPages: () => pageCount,
    setPage: vi.fn(),
    save: saveMock,
  })),
}))

import { downloadPdfTable } from './pdf-table-export'

describe('downloadPdfTable', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    pageCount = 1
    splitLineCount = 1
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 7, 9, 10, 30, 0))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('does nothing when rows are empty', () => {
    downloadPdfTable({
      title: 'Report',
      filename: 'report.pdf',
      columns: [{ header: 'Name', width: 50, value: () => 'x' }],
      rows: [],
    })
    expect(saveMock).not.toHaveBeenCalled()
  })

  it('generates and saves pdf for portrait rows', () => {
    downloadPdfTable({
      title: 'Tickets',
      filename: 'tickets.pdf',
      columns: [
        { header: 'ID', width: 40, value: (row: { id: string; title: string }) => row.id },
        { header: 'Title', width: 80, value: (row: { id: string; title: string }) => row.title },
      ],
      rows: [
        { id: '1', title: 'First' },
        { id: '2', title: 'Second' },
      ],
    })

    expect(saveMock).toHaveBeenCalledWith('tickets.pdf')
    expect(pageCount).toBeGreaterThanOrEqual(1)
  })

  it('supports landscape orientation', () => {
    downloadPdfTable({
      title: 'Wide Report',
      filename: 'wide.pdf',
      orientation: 'landscape',
      columns: [{ header: 'Col', width: 100, value: () => 'value' }],
      rows: [{ id: '1' }],
    })

    expect(saveMock).toHaveBeenCalledWith('wide.pdf')
  })

  it('uses em dash for empty cell values', async () => {
    downloadPdfTable({
      title: 'Report',
      filename: 'report.pdf',
      columns: [{ header: 'Value', width: 50, value: () => '' }],
      rows: [{ id: '1' }],
    })

    const { jsPDF } = await import('jspdf')
    const instance = vi.mocked(jsPDF).mock.results.at(-1)?.value as {
      splitTextToSize: ReturnType<typeof vi.fn>
    }
    expect(instance.splitTextToSize).toHaveBeenCalledWith('—', expect.any(Number))
    expect(saveMock).toHaveBeenCalled()
  })

  it('adds new page when row would overflow footer', async () => {
    splitLineCount = 80

    downloadPdfTable({
      title: 'Long Report',
      filename: 'long.pdf',
      columns: [{ header: 'Col', width: 100, value: () => 'very long content' }],
      rows: [{ id: '1' }, { id: '2' }],
    })

    const { jsPDF } = await import('jspdf')
    const instance = vi.mocked(jsPDF).mock.results.at(-1)?.value as { addPage: ReturnType<typeof vi.fn> }
    expect(instance.addPage).toHaveBeenCalled()
    expect(saveMock).toHaveBeenCalledWith('long.pdf')
  })
})
