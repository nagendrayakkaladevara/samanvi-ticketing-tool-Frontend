import type { jsPDF } from 'jspdf'

export const PDF_A4 = {
  width: 210,
  height: 297,
  margin: 14,
  footerY: 287,
  contentBottom: 278,
} as const

export const PDF_COLORS = {
  primary: [234, 88, 12] as const,
  text: [17, 24, 39] as const,
  textMuted: [107, 114, 128] as const,
  textSubtle: [75, 85, 99] as const,
  border: [229, 231, 235] as const,
  surface: [249, 250, 251] as const,
  surfaceAlt: [243, 244, 246] as const,
  footer: [156, 163, 175] as const,
  white: [255, 255, 255] as const,
  success: [22, 163, 74] as const,
  info: [37, 99, 235] as const,
  warning: [217, 119, 6] as const,
  danger: [220, 38, 38] as const,
  neutral: [107, 114, 128] as const,
} as const

export type PdfDetailField = {
  label: string
  value: string
}

export type PdfTableColumn<T> = {
  header: string
  width: number
  align?: 'left' | 'right'
  value: (row: T) => string
}

type PdfSpaceOptions = {
  doc: jsPDF
  y: number
  needed: number
  margin?: number
}

export function getPdfContentWidth(margin = PDF_A4.margin): number {
  return PDF_A4.width - margin * 2
}

export function ensurePdfSpace(options: PdfSpaceOptions): number {
  const margin = options.margin ?? PDF_A4.margin
  if (options.y + options.needed <= PDF_A4.contentBottom) return options.y
  options.doc.addPage()
  return margin
}

export function drawPdfSectionTitle(
  doc: jsPDF,
  title: string,
  y: number,
  margin = PDF_A4.margin,
  pageWidth = PDF_A4.width,
): number {
  doc.setFillColor(...PDF_COLORS.surfaceAlt)
  doc.rect(margin, y - 4.5, pageWidth - margin * 2, 7, 'F')

  doc.setFontSize(8.5)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...PDF_COLORS.textSubtle)
  doc.text(title.toUpperCase(), margin + 2, y)

  return y + 6
}

export function drawPdfBadge(
  doc: jsPDF,
  text: string,
  x: number,
  y: number,
  color: readonly [number, number, number],
): number {
  const paddingX = 2.5
  const badgeHeight = 5.5
  doc.setFontSize(7.5)
  doc.setFont('helvetica', 'bold')
  const textWidth = doc.getTextWidth(text)
  const badgeWidth = textWidth + paddingX * 2

  doc.setFillColor(...color)
  doc.roundedRect(x, y - 3.8, badgeWidth, badgeHeight, 1, 1, 'F')
  doc.setTextColor(...PDF_COLORS.white)
  doc.text(text, x + paddingX, y)

  return badgeWidth + 2
}

export type PdfSummaryBandOptions = {
  doc: jsPDF
  margin: number
  pageWidth: number
  title: string
  subtitle: string
  badges: Array<{ label: string; color: readonly [number, number, number] }>
  y: number
}

export function drawPdfSummaryBand(options: PdfSummaryBandOptions): number {
  const { doc, margin, pageWidth, title, subtitle, badges } = options
  let y = options.y
  const contentWidth = pageWidth - margin * 2
  const bandHeight = 22

  doc.setFillColor(...PDF_COLORS.surface)
  doc.setDrawColor(...PDF_COLORS.border)
  doc.roundedRect(margin, y, contentWidth, bandHeight, 2, 2, 'FD')

  doc.setFontSize(15)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...PDF_COLORS.text)
  doc.text(title, margin + 4, y + 8)

  let badgeX = pageWidth - margin - 4
  for (let index = badges.length - 1; index >= 0; index -= 1) {
    const badge = badges[index]
    doc.setFontSize(7.5)
    doc.setFont('helvetica', 'bold')
    const textWidth = doc.getTextWidth(badge.label)
    const badgeWidth = textWidth + 5
    badgeX -= badgeWidth
    doc.setFillColor(...badge.color)
    doc.roundedRect(badgeX, y + 3.5, badgeWidth, 5.5, 1, 1, 'F')
    doc.setTextColor(...PDF_COLORS.white)
    doc.text(badge.label, badgeX + 2.5, y + 7.2)
    badgeX -= 2
  }

  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...PDF_COLORS.textSubtle)
  const subtitleLines = doc.splitTextToSize(subtitle, contentWidth - 8)
  doc.text(subtitleLines, margin + 4, y + 14.5)

  return y + bandHeight + 6
}

export type PdfDetailCardOptions = {
  doc: jsPDF
  margin: number
  contentWidth: number
  fields: PdfDetailField[]
  y: number
  columns?: 1 | 2
}

function measureDetailCardHeight(
  doc: jsPDF,
  fields: PdfDetailField[],
  contentWidth: number,
  columns: 1 | 2,
): number {
  const columnGap = 8
  const columnWidth =
    columns === 2 ? (contentWidth - columnGap - 8) / 2 : contentWidth - 8
  const labelWidth = columns === 2 ? 28 : 46
  const valueWidth = columnWidth - labelWidth - 2
  const rowGap = 1.5
  let height = 6

  const rows = columns === 2 ? Math.ceil(fields.length / 2) : fields.length
  for (let row = 0; row < rows; row += 1) {
    let maxLines = 1

    if (columns === 2) {
      for (const col of [0, 1]) {
        const field = fields[row + col * Math.ceil(fields.length / 2)]
        if (!field) continue
        const lines = doc.splitTextToSize(field.value || '—', valueWidth)
        maxLines = Math.max(maxLines, lines.length)
      }
    } else {
      const field = fields[row]
      const lines = doc.splitTextToSize(field.value || '—', contentWidth - labelWidth - 10)
      maxLines = Math.max(maxLines, lines.length)
    }

    height += Math.max(7, maxLines * 4.2) + rowGap
  }

  return height + 2
}

export function drawPdfDetailCard(options: PdfDetailCardOptions): number {
  const { doc, margin, contentWidth, fields } = options
  const columns = options.columns ?? 2
  let y = options.y

  doc.setFontSize(8.5)
  const cardHeight = measureDetailCardHeight(doc, fields, contentWidth, columns)

  doc.setFillColor(...PDF_COLORS.white)
  doc.setDrawColor(...PDF_COLORS.border)
  doc.roundedRect(margin, y, contentWidth, cardHeight, 2, 2, 'FD')

  y += 5
  const columnGap = 8
  const columnWidth =
    columns === 2 ? (contentWidth - columnGap - 8) / 2 : contentWidth - 8
  const labelWidth = columns === 2 ? 28 : 46
  const valueWidth = columnWidth - labelWidth - 2
  const rowGap = 1.5
  const leftX = margin + 4
  const rightX = margin + 4 + columnWidth + columnGap
  const rows = columns === 2 ? Math.ceil(fields.length / 2) : fields.length

  for (let row = 0; row < rows; row += 1) {
    let rowHeight = 7

    const drawField = (field: PdfDetailField | undefined, x: number) => {
      if (!field) return

      doc.setFontSize(8)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(...PDF_COLORS.textMuted)
      doc.text(field.label, x, y)

      doc.setFont('helvetica', 'bold')
      doc.setTextColor(...PDF_COLORS.text)
      const lines = doc.splitTextToSize(field.value || '—', valueWidth)
      doc.text(lines, x + labelWidth, y)
      rowHeight = Math.max(rowHeight, lines.length * 4.2 + 2)
    }

    if (columns === 2) {
      drawField(fields[row], leftX)
      drawField(fields[row + rows], rightX)
    } else {
      drawField(fields[row], leftX)
    }

    y += rowHeight + rowGap
  }

  return options.y + cardHeight + 6
}

export type PdfTextPanelOptions = {
  doc: jsPDF
  margin: number
  contentWidth: number
  text: string
  y: number
}

export function drawPdfTextPanel(options: PdfTextPanelOptions): number {
  const { doc, margin, contentWidth, text } = options
  let y = options.y

  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  const lines = doc.splitTextToSize(text || '—', contentWidth - 8)
  const panelHeight = Math.max(14, lines.length * 4.6 + 8)

  doc.setFillColor(...PDF_COLORS.white)
  doc.setDrawColor(...PDF_COLORS.border)
  doc.roundedRect(margin, y, contentWidth, panelHeight, 2, 2, 'FD')

  doc.setTextColor(...PDF_COLORS.text)
  doc.text(lines, margin + 4, y + 6)

  return y + panelHeight + 6
}

export type PdfCommentItem = {
  meta: string
  note: string
}

export type PdfCommentCardsOptions = {
  doc: jsPDF
  margin: number
  contentWidth: number
  comments: PdfCommentItem[]
  y: number
}

export function drawPdfCommentCards(options: PdfCommentCardsOptions): number {
  const { doc, margin, contentWidth, comments } = options
  let y = options.y

  for (const comment of comments) {
    doc.setFontSize(8.5)
    doc.setFont('helvetica', 'normal')
    const noteLines = doc.splitTextToSize(comment.note || '—', contentWidth - 8)
    const cardHeight = Math.max(14, noteLines.length * 4.4 + 10)

    y = ensurePdfSpace({ doc, y, needed: cardHeight + 4, margin })

    doc.setFillColor(...PDF_COLORS.surface)
    doc.setDrawColor(...PDF_COLORS.border)
    doc.roundedRect(margin, y, contentWidth, cardHeight, 2, 2, 'FD')

    doc.setFontSize(7.5)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...PDF_COLORS.primary)
    doc.text(comment.meta, margin + 4, y + 5)

    doc.setFontSize(8.5)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...PDF_COLORS.text)
    doc.text(noteLines, margin + 4, y + 10.5)

    y += cardHeight + 3
  }

  return y
}

export type PdfDataTableOptions<T> = {
  doc: jsPDF
  margin: number
  contentWidth: number
  columns: PdfTableColumn<T>[]
  rows: T[]
  y: number
  footerLabel?: string
  footerValue?: string
}

export function drawPdfDataTable<T>(options: PdfDataTableOptions<T>): number {
  const { doc, margin, columns, rows, footerLabel, footerValue } = options
  let y = options.y
  const tableWidth = columns.reduce((sum, column) => sum + column.width, 0)
  const headerHeight = 7
  const bodyFontSize = 8
  const lineHeight = 3.8

  const drawHeader = () => {
    doc.setFillColor(...PDF_COLORS.surfaceAlt)
    doc.rect(margin, y, tableWidth, headerHeight, 'F')
    doc.setDrawColor(...PDF_COLORS.border)
    doc.rect(margin, y, tableWidth, headerHeight)

    let x = margin
    doc.setFontSize(7.5)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...PDF_COLORS.textSubtle)

    for (const column of columns) {
      const textX = column.align === 'right' ? x + column.width - 2 : x + 2
      doc.text(column.header, textX, y + 4.8, { align: column.align ?? 'left' })
      x += column.width
    }

    y += headerHeight
  }

  y = ensurePdfSpace({ doc, y, needed: headerHeight + 8, margin })
  drawHeader()

  for (let rowIndex = 0; rowIndex < rows.length; rowIndex += 1) {
    const row = rows[rowIndex]
    const cellLines = columns.map((column) => {
      const text = column.value(row) || '—'
      return doc.splitTextToSize(text, column.width - 4)
    })
    const maxLines = Math.max(1, ...cellLines.map((lines) => lines.length))
    const rowHeight = maxLines * lineHeight + 3

    if (y + rowHeight > PDF_A4.contentBottom) {
      doc.addPage()
      y = margin
      drawHeader()
    }

    if (rowIndex % 2 === 1) {
      doc.setFillColor(...PDF_COLORS.surface)
      doc.rect(margin, y, tableWidth, rowHeight, 'F')
    }

    let x = margin
    doc.setFontSize(bodyFontSize)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...PDF_COLORS.text)

    for (let index = 0; index < columns.length; index += 1) {
      const column = columns[index]
      const textX = column.align === 'right' ? x + column.width - 2 : x + 2
      doc.text(cellLines[index], textX, y + 4, { align: column.align ?? 'left' })
      x += column.width
    }

    doc.setDrawColor(...PDF_COLORS.border)
    doc.line(margin, y + rowHeight, margin + tableWidth, y + rowHeight)
    y += rowHeight
  }

  if (footerLabel && footerValue) {
    const footerHeight = 8
    y = ensurePdfSpace({ doc, y, needed: footerHeight + 2, margin })

    doc.setFillColor(...PDF_COLORS.surfaceAlt)
    doc.rect(margin, y, tableWidth, footerHeight, 'F')
    doc.setDrawColor(...PDF_COLORS.border)
    doc.rect(margin, y, tableWidth, footerHeight)

    doc.setFontSize(8)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...PDF_COLORS.textSubtle)
    doc.text(footerLabel, margin + tableWidth - 52, y + 5.2)

    doc.setFontSize(9)
    doc.setTextColor(...PDF_COLORS.text)
    doc.text(footerValue, margin + tableWidth - 2, y + 5.2, { align: 'right' })

    y += footerHeight
  }

  return y + 6
}

export function drawPdfPageFooters(
  doc: jsPDF,
  leftText: string,
  margin = PDF_A4.margin,
  pageWidth = PDF_A4.width,
  footerY = PDF_A4.footerY,
): void {
  const pageCount = doc.getNumberOfPages()

  for (let page = 1; page <= pageCount; page += 1) {
    doc.setPage(page)
    doc.setDrawColor(...PDF_COLORS.border)
    doc.line(margin, footerY - 4, pageWidth - margin, footerY - 4)

    doc.setFontSize(7.5)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...PDF_COLORS.footer)
    doc.text(leftText, margin, footerY)
    doc.text(`Page ${page} of ${pageCount}`, pageWidth - margin, footerY, { align: 'right' })
  }
}

export function getJobPriorityBadgeColor(
  priority: string,
): readonly [number, number, number] {
  switch (priority.toLowerCase()) {
    case 'urgent':
      return PDF_COLORS.danger
    case 'high':
      return PDF_COLORS.primary
    case 'medium':
      return PDF_COLORS.warning
    default:
      return PDF_COLORS.neutral
  }
}

export function getJobStatusBadgeColor(status: string): readonly [number, number, number] {
  switch (status.toLowerCase()) {
    case 'completed':
    case 'closed':
      return PDF_COLORS.success
    case 'in_progress':
    case 'assigned':
      return PDF_COLORS.info
    case 'on_hold':
      return PDF_COLORS.warning
    case 'cancelled':
      return PDF_COLORS.danger
    default:
      return PDF_COLORS.neutral
  }
}
