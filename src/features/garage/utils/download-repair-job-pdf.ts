import { jsPDF } from 'jspdf'

import type { RepairJob, RepairJobPart } from '@/features/garage/types/job'
import {
  formatJobDate,
  formatJobPriority,
  formatJobStatus,
} from '@/features/garage/utils/job-list-model'
import { addSamanviLogoToPdf, PDF_LOGO_HEIGHT_MM } from '@/lib/utils/pdf-branding'

const MARGIN = 16
const PAGE_WIDTH = 210
const LABEL_X = MARGIN
const VALUE_X = MARGIN + 58
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2
const SECTION_COLOR: [number, number, number] = [234, 88, 12]

function sanitizeFilename(value: string): string {
  return value.replace(/[/\\?%*:|"<>]/g, '-').trim() || 'repair-job'
}

function displayValue(value?: string | null): string {
  const trimmed = value?.trim()
  return trimmed ? trimmed : '—'
}

function formatCurrency(value: string): string {
  const amount = Number.parseFloat(value)
  if (Number.isNaN(amount)) return value || '—'
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(amount)
}

function formatPartLineTotal(part: RepairJobPart): string {
  const unitPrice = Number.parseFloat(part.unitPrice)
  if (Number.isNaN(unitPrice)) return '—'
  return formatCurrency(String(unitPrice * part.quantity))
}

function addSectionTitle(doc: jsPDF, title: string, y: number): number {
  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...SECTION_COLOR)
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

function getAssignedLabel(job: RepairJob): string {
  if (!job.assignedToOfficeStaff) return 'Unassigned'
  const { nickName, designation } = job.assignedToOfficeStaff
  return designation ? `${nickName} (${designation})` : nickName
}

function getDriverLabel(job: RepairJob): string {
  if (!job.reportedDriver) return 'None'
  const name = job.reportedDriver.aadharName || job.reportedDriver.dlName
  return `${job.reportedDriver.driverIdNumber} — ${name}`
}

function addPartsSection(doc: jsPDF, parts: RepairJobPart[], y: number): number {
  y = ensureSpace(doc, y, 24)
  y = addSectionTitle(doc, 'Parts Used', y)

  for (const part of parts) {
    y = ensureSpace(doc, y, 28)
    y = addDetailRow(doc, 'Part', part.repairPart.partName, y)
    y = addDetailRow(doc, 'Quantity', String(part.quantity), y)
    y = addDetailRow(doc, 'Unit Price', formatCurrency(part.unitPrice), y)
    y = addDetailRow(doc, 'Line Total', formatPartLineTotal(part), y)
    const addedBy = part.addedBy.displayName || part.addedBy.username
    y = addDetailRow(doc, 'Added By', displayValue(addedBy), y)
    y = addDetailRow(doc, 'Added At', formatJobDate(part.createdAt), y)
    y += 2
  }

  const total = parts.reduce((sum, part) => {
    const unitPrice = Number.parseFloat(part.unitPrice)
    if (Number.isNaN(unitPrice)) return sum
    return sum + unitPrice * part.quantity
  }, 0)

  if (parts.length > 0 && total > 0) {
    y = ensureSpace(doc, y, 10)
    y = addDetailRow(doc, 'Parts Total', formatCurrency(String(total)), y)
  }

  return y
}

export async function downloadRepairJobPdf(job: RepairJob): Promise<void> {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const generatedAt = formatJobDate(new Date().toISOString())
  let y = MARGIN

  await addSamanviLogoToPdf(doc, { pageWidth: PAGE_WIDTH, margin: MARGIN, y })

  doc.setFontSize(18)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(17, 24, 39)
  doc.text('Repair Job Report', MARGIN, y + PDF_LOGO_HEIGHT_MM + 4)

  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(107, 114, 128)
  doc.text(`Generated on ${generatedAt}`, MARGIN, y + PDF_LOGO_HEIGHT_MM + 11)

  y += PDF_LOGO_HEIGHT_MM + 18
  doc.setDrawColor(209, 213, 219)
  doc.line(MARGIN, y, PAGE_WIDTH - MARGIN, y)
  y += 10

  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(17, 24, 39)
  doc.text(job.jobIdNumber, MARGIN, y)

  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(75, 85, 99)
  doc.text(
    `${formatJobStatus(job.status)} · ${formatJobPriority(job.priority)} priority`,
    MARGIN,
    y + 6,
  )
  y += 14

  y = addSectionTitle(doc, 'Job Details', y)
  y = addDetailRow(doc, 'Bus Number', job.bus.busNumber, y)
  y = addDetailRow(doc, 'Repair Category', job.repairCategory.name, y)
  y = addDetailRow(doc, 'Odometer (km)', job.odometerReading.toLocaleString(), y)
  y = addDetailRow(doc, 'Status', formatJobStatus(job.status), y)
  y = addDetailRow(doc, 'Priority', formatJobPriority(job.priority), y)
  y = addDetailRow(doc, 'Assigned To', getAssignedLabel(job), y)
  y = addDetailRow(doc, 'Reported Driver', getDriverLabel(job), y)
  y = addDetailRow(
    doc,
    'Created By',
    job.createdBy.displayName || job.createdBy.username || 'Unknown',
    y,
  )
  y = addDetailRow(doc, 'Created At', formatJobDate(job.createdAt), y)
  y = addDetailRow(doc, 'Updated At', formatJobDate(job.updatedAt), y)
  y = addDetailRow(doc, 'Repeat Job', job.isRepeatJob ? 'Yes' : 'No', y)

  y = ensureSpace(doc, y, 30)
  y += 4
  y = addSectionTitle(doc, 'Description', y)
  y = addDetailRow(doc, 'Details', job.description, y)

  if (job.parts?.length) {
    y += 4
    y = addPartsSection(doc, job.parts, y)
  }

  const pageCount = doc.getNumberOfPages()
  for (let page = 1; page <= pageCount; page += 1) {
    doc.setPage(page)
    doc.setFontSize(8)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(156, 163, 175)
    doc.text(`Samanvi Ticketing · Repair Job ${job.jobIdNumber}`, MARGIN, 290)
    doc.text(`Page ${page} of ${pageCount}`, PAGE_WIDTH - MARGIN, 290, { align: 'right' })
  }

  doc.save(`RepairJob-${sanitizeFilename(job.jobIdNumber)}.pdf`)
}
