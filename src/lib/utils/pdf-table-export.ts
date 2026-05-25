import { jsPDF } from 'jspdf'

export type PdfTableColumn<T> = {
  header: string
  width: number
  value: (row: T) => string
}

export type DownloadPdfTableOptions<T> = {
  title: string
  filename: string
  columns: PdfTableColumn<T>[]
  rows: T[]
  orientation?: 'portrait' | 'landscape'
}

const MARGIN = 12

function formatGeneratedAt(): string {
  return new Intl.DateTimeFormat(undefined, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date())
}

function getPageDimensions(orientation: 'portrait' | 'landscape') {
  const pageWidth = orientation === 'landscape' ? 297 : 210
  const footerY = (orientation === 'landscape' ? 210 : 297) - 10
  return { pageWidth, footerY }
}

export function downloadPdfTable<T>(options: DownloadPdfTableOptions<T>): void {
  if (options.rows.length === 0) return

  const orientation = options.orientation ?? 'portrait'
  const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation })
  const { pageWidth, footerY } = getPageDimensions(orientation)
  const bodyFontSize = orientation === 'landscape' ? 6.5 : 8
  const headerFontSize = orientation === 'landscape' ? 7 : 9
  const lineHeight = bodyFontSize * 0.45
  const headerBlockHeight = 8
  const tableWidth = options.columns.reduce((sum, column) => sum + column.width, 0)

  let y = MARGIN

  const drawPageHeader = () => {
    doc.setFontSize(16)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(17, 24, 39)
    doc.text(options.title, MARGIN, y)

    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(107, 114, 128)
    doc.text(`Generated on ${formatGeneratedAt()} · ${options.rows.length} record(s)`, MARGIN, y + 7)
    y += 16
  }

  const drawTableHeader = () => {
    let x = MARGIN
    doc.setFillColor(243, 244, 246)
    doc.rect(MARGIN, y - 4.5, tableWidth, headerBlockHeight, 'F')
    doc.setFontSize(headerFontSize)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(55, 65, 81)

    for (const column of options.columns) {
      doc.text(column.header, x + 1, y)
      x += column.width
    }

    y += headerBlockHeight
  }

  const startNewPage = (includeTableHeader: boolean) => {
    doc.addPage()
    y = MARGIN
    if (includeTableHeader) {
      drawTableHeader()
    }
  }

  drawPageHeader()
  drawTableHeader()

  for (const row of options.rows) {
    const cellLines = options.columns.map((column) => {
      const text = column.value(row) || '—'
      return doc.splitTextToSize(text, column.width - 2)
    })
    const maxLines = Math.max(1, ...cellLines.map((lines) => lines.length))
    const rowHeight = maxLines * lineHeight + 2

    if (y + rowHeight > footerY - 4) {
      startNewPage(true)
    }

    let x = MARGIN
    doc.setFontSize(bodyFontSize)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(17, 24, 39)

    for (let index = 0; index < options.columns.length; index += 1) {
      doc.text(cellLines[index], x + 1, y)
      x += options.columns[index].width
    }

    y += rowHeight
  }

  const pageCount = doc.getNumberOfPages()
  for (let page = 1; page <= pageCount; page += 1) {
    doc.setPage(page)
    doc.setFontSize(8)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(156, 163, 175)
    doc.text('Samanvi Ticketing', MARGIN, footerY)
    doc.text(`Page ${page} of ${pageCount}`, pageWidth - MARGIN, footerY, { align: 'right' })
  }

  doc.save(options.filename)
}
