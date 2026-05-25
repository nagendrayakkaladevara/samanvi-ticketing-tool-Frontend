import { jsPDF } from 'jspdf'

import type { Driver } from '@/features/employees/types/driver'
import { formatEmployeeDateTime } from '@/features/employees/utils/employee-model'
import { formatMasterDateDisplay } from '@/lib/utils/master-dates'

const MARGIN = 16
const PAGE_WIDTH = 210
const LABEL_X = MARGIN
const VALUE_X = MARGIN + 58
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2

function sanitizeFilename(value: string): string {
  return value.replace(/[/\\?%*:|"<>]/g, '-').trim() || 'driver'
}

function displayValue(value?: string | null): string {
  const trimmed = value?.trim()
  return trimmed ? trimmed : '—'
}

function addSectionTitle(doc: jsPDF, title: string, y: number): number {
  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(124, 58, 237)
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

export function downloadDriverPdf(driver: Driver): void {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const generatedAt = formatEmployeeDateTime(new Date().toISOString())
  let y = MARGIN

  doc.setFontSize(18)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(17, 24, 39)
  doc.text('Driver Report', MARGIN, y)

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
  doc.text(driver.driverIdNumber, MARGIN, y)

  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(75, 85, 99)
  doc.text(`${driver.aadharName} · ${driver.mobileNumber}`, MARGIN, y + 6)
  y += 14

  y = addSectionTitle(doc, 'Personal Details', y)
  y = addDetailRow(doc, 'Driver ID', driver.driverIdNumber, y)
  y = addDetailRow(doc, 'Aadhar Name', driver.aadharName, y)
  y = addDetailRow(doc, 'DL Name', driver.dlName, y)
  y = addDetailRow(doc, 'Date of Birth', formatMasterDateDisplay(driver.dateOfBirth), y)
  y = addDetailRow(doc, 'Mobile Number', driver.mobileNumber, y)
  y = addDetailRow(doc, 'Alternate Mobile', displayValue(driver.alternateMobile), y)
  y = addDetailRow(doc, 'Emergency Number', displayValue(driver.emergencyNumber), y)
  y = addDetailRow(doc, 'Aadhar Number', driver.aadharNumber, y)
  y = addDetailRow(doc, 'DL Number', driver.dlNumber, y)
  y = addDetailRow(doc, 'DL Issue Date', formatMasterDateDisplay(driver.dlIssueDate), y)
  y = addDetailRow(doc, 'DL Expiry Date', formatMasterDateDisplay(driver.dlExpiryDate), y)
  y = addDetailRow(doc, 'Transport Valid To', formatMasterDateDisplay(driver.transportValidTo), y)
  y = addDetailRow(doc, 'Date of Joining', formatMasterDateDisplay(driver.dateOfJoining), y)
  y = addDetailRow(doc, 'Date of Leaving', formatMasterDateDisplay(driver.dateOfLeaving), y)
  y = addDetailRow(doc, 'Reference Name', driver.referenceName, y)
  y = addDetailRow(doc, 'Remarks', displayValue(driver.remarks), y)

  y = ensureSpace(doc, y, 40)
  y += 4
  y = addSectionTitle(doc, 'Bank Details', y)
  y = addDetailRow(doc, 'Account Holder', driver.accountHolderName, y)
  y = addDetailRow(doc, 'Account Number', driver.accountNumber, y)
  y = addDetailRow(doc, 'Bank Name', driver.bankName, y)
  y = addDetailRow(doc, 'Branch Name', driver.branchName, y)
  y = addDetailRow(doc, 'IFSC Code', driver.ifscCode, y)
  y = addDetailRow(doc, 'UPI ID', displayValue(driver.upiId), y)

  if (driver.createdAt || driver.updatedAt) {
    y = ensureSpace(doc, y, 20)
    y += 6
    y = addSectionTitle(doc, 'Record Info', y)
    y = addDetailRow(doc, 'Created', formatEmployeeDateTime(driver.createdAt), y)
    y = addDetailRow(doc, 'Last Updated', formatEmployeeDateTime(driver.updatedAt), y)
  }

  const pageCount = doc.getNumberOfPages()
  for (let page = 1; page <= pageCount; page += 1) {
    doc.setPage(page)
    doc.setFontSize(8)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(156, 163, 175)
    doc.text(`Samanvi Ticketing · Driver ${driver.driverIdNumber}`, MARGIN, 290)
    doc.text(`Page ${page} of ${pageCount}`, PAGE_WIDTH - MARGIN, 290, { align: 'right' })
  }

  doc.save(`Driver-${sanitizeFilename(driver.driverIdNumber)}.pdf`)
}
