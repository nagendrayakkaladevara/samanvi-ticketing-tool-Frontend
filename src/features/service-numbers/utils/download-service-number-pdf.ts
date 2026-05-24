import { jsPDF } from 'jspdf'

import type { ServiceNumber } from '@/features/service-numbers/types/service-number'
import {
  formatAmount,
  formatDateTime,
  formatDistance,
} from '@/features/service-numbers/utils/service-number-model'

const MARGIN = 16
const PAGE_WIDTH = 210
const LABEL_X = MARGIN
const VALUE_X = MARGIN + 58
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2

function sanitizeFilename(value: string): string {
  return value.replace(/[/\\?%*:|"<>]/g, '-').trim() || 'service-number'
}

function addSectionTitle(doc: jsPDF, title: string, y: number): number {
  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(5, 150, 105)
  doc.text(title.toUpperCase(), MARGIN, y)
  doc.setDrawColor(209, 213, 219)
  doc.line(MARGIN, y + 1.5, PAGE_WIDTH - MARGIN, y + 1.5)
  return y + 8
}

function addDetailRow(doc: jsPDF, label: string, value: string, y: number): number {
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(107, 114, 128)
  doc.text(label, LABEL_X, y)

  doc.setFont('helvetica', 'bold')
  doc.setTextColor(17, 24, 39)
  const lines = doc.splitTextToSize(value, CONTENT_WIDTH - (VALUE_X - MARGIN))
  doc.text(lines, VALUE_X, y)

  return y + Math.max(6, lines.length * 5)
}

function ensureSpace(doc: jsPDF, y: number, needed: number): number {
  if (y + needed <= 280) return y
  doc.addPage()
  return MARGIN
}

export function downloadServiceNumberPdf(item: ServiceNumber): void {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const generatedAt = formatDateTime(new Date().toISOString())
  let y = MARGIN

  doc.setFontSize(18)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(17, 24, 39)
  doc.text('Service Number Report', MARGIN, y)

  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(107, 114, 128)
  doc.text(`Generated on ${generatedAt}`, MARGIN, y + 7)

  y += 16
  doc.setDrawColor(209, 213, 219)
  doc.line(MARGIN, y, PAGE_WIDTH - MARGIN, y)
  y += 10

  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(17, 24, 39)
  doc.text(item.serviceNo, MARGIN, y)

  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(75, 85, 99)
  doc.text(`${item.from} → ${item.to} via ${item.via}`, MARGIN, y + 6)
  y += 14

  y = addSectionTitle(doc, 'Route Details', y)
  y = addDetailRow(doc, 'Service For', item.serviceFor.serviceFor, y)
  y = addDetailRow(doc, 'Service Number', item.serviceNo, y)
  y = addDetailRow(doc, 'From', item.from, y)
  y = addDetailRow(doc, 'To', item.to, y)
  y = addDetailRow(doc, 'Via', item.via, y)
  y = addDetailRow(doc, 'Distance', formatDistance(item.distance), y)

  y = ensureSpace(doc, y, 40)
  y += 4
  y = addSectionTitle(doc, 'Amounts', y)
  y = addDetailRow(doc, 'Parking Amount', formatAmount(item.parkingAmount), y)
  y = addDetailRow(doc, 'Driver One Beta', formatAmount(item.driverOneBeta), y)
  y = addDetailRow(doc, 'Driver Two Beta', formatAmount(item.driverTwoBeta), y)
  y = addDetailRow(doc, 'Helper Beta', formatAmount(item.helperBeta), y)
  y = addDetailRow(doc, 'Conductor Beta', formatAmount(item.conductorBeta), y)

  y = ensureSpace(doc, y, 30)
  y += 4
  y = addSectionTitle(doc, 'Crew', y)
  y = addDetailRow(doc, 'Optional Driver', item.optDriver, y)
  y = addDetailRow(doc, 'Optional Helper', item.optHelper, y)

  y = ensureSpace(doc, y, 24)
  y += 4
  y = addSectionTitle(doc, 'Remarks', y)
  y = addDetailRow(doc, 'Notes', item.remarks, y)

  y = ensureSpace(doc, y, 20)
  y += 6
  y = addSectionTitle(doc, 'Record Info', y)
  y = addDetailRow(doc, 'Created', formatDateTime(item.createdAt), y)
  y = addDetailRow(doc, 'Last Updated', formatDateTime(item.updatedAt), y)

  const pageCount = doc.getNumberOfPages()
  for (let page = 1; page <= pageCount; page += 1) {
    doc.setPage(page)
    doc.setFontSize(8)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(156, 163, 175)
    doc.text(`Samanvi Ticketing · Service No ${item.serviceNo}`, MARGIN, 290)
    doc.text(`Page ${page} of ${pageCount}`, PAGE_WIDTH - MARGIN, 290, { align: 'right' })
  }

  doc.save(`ServiceNo-${sanitizeFilename(item.serviceNo)}.pdf`)
}
