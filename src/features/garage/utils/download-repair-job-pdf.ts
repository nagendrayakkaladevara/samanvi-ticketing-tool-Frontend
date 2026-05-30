import { jsPDF } from 'jspdf'

import type { RepairJob } from '@/features/garage/types/job'
import { getJobShareUrl } from '@/features/garage/utils/job-share'
import { getJobComments, formatCommentMeta } from '@/features/garage/utils/job-activity-model'
import {
  formatJobDate,
  formatJobPriority,
  formatJobStatus,
} from '@/features/garage/utils/job-list-model'
import {
  formatJobPartAddedAt,
  formatJobPartLineTotal,
  formatJobPartsTotal,
} from '@/features/garage/utils/job-part-model'
import { formatRepeatScheduledDate } from '@/features/garage/utils/job-repeat-model'
import { formatRepairPartPrice } from '@/features/garage/utils/repair-part-model'
import { drawPdfQrSection, drawPdfReportHeader } from '@/lib/utils/pdf-report-branding'

const MARGIN = 16
const PAGE_WIDTH = 210
const LABEL_X = MARGIN
const VALUE_X = MARGIN + 58
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2

function sanitizeFilename(value: string): string {
  return value.replace(/[/\\?%*:|"<>]/g, '-').trim() || 'repair-job'
}

function addSectionTitle(doc: jsPDF, title: string, y: number): number {
  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(234, 88, 12)
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

export async function downloadRepairJobPdf(job: RepairJob): Promise<void> {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const generatedAt = formatJobDate(new Date().toISOString())
  const jobViewUrl = getJobShareUrl(job.id)
  let y = MARGIN

  y = await drawPdfReportHeader({
    doc,
    margin: MARGIN,
    pageWidth: PAGE_WIDTH,
    title: 'Repair Job Report',
    subtitle: `Generated on ${generatedAt}`,
    y,
  })

  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(17, 24, 39)
  doc.text(job.jobIdNumber, MARGIN, y)

  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(75, 85, 99)
  doc.text(
    `${formatJobPriority(job.priority)} · ${formatJobStatus(job.status)}${job.isRepeatJob ? ' · Repeat job' : ''}`,
    MARGIN,
    y + 6,
  )
  y += 14

  y = ensureSpace(doc, y, 40)
  y = await drawPdfQrSection({
    doc,
    margin: MARGIN,
    pageWidth: PAGE_WIDTH,
    contentWidth: CONTENT_WIDTH,
    url: jobViewUrl,
    y,
  })

  y = addSectionTitle(doc, 'Job Details', y)
  y = addDetailRow(doc, 'Bus Number', job.bus.busNumber, y)
  y = addDetailRow(doc, 'Repair Category', job.repairCategory.name, y)
  y = addDetailRow(doc, 'Status', formatJobStatus(job.status), y)
  y = addDetailRow(doc, 'Priority', formatJobPriority(job.priority), y)
  y = addDetailRow(doc, 'Odometer (km)', job.odometerReading.toLocaleString(), y)
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

  if (job.isRepeatJob && job.previousJob) {
    y = addDetailRow(doc, 'Previous Job', job.previousJob.jobIdNumber, y)
  }

  if (job.repeatScheduledFor) {
    y = addDetailRow(doc, 'Repeat Scheduled For', formatRepeatScheduledDate(job.repeatScheduledFor), y)
  }

  if (job.repeatProcessedAt) {
    y = addDetailRow(doc, 'Repeat Processed At', formatJobDate(job.repeatProcessedAt), y)
  }

  y = ensureSpace(doc, y, 30)
  y += 4
  y = addSectionTitle(doc, 'Description', y)
  y = addDetailRow(doc, 'Details', job.description, y)

  const comments = [...getJobComments(job.activityLogs ?? [])].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  )

  if (comments.length > 0) {
    y = ensureSpace(doc, y, 20)
    y += 4
    y = addSectionTitle(doc, 'Comments', y)
    for (const comment of comments) {
      y = ensureSpace(doc, y, 16)
      y = addDetailRow(doc, formatCommentMeta(comment), comment.note ?? '—', y)
      y += 2
    }
  }

  const parts = job.parts ?? []
  if (parts.length > 0) {
    y = ensureSpace(doc, y, 30)
    y += 4
    y = addSectionTitle(doc, 'Spare Parts Used', y)
    y = addDetailRow(doc, 'Total', formatJobPartsTotal(parts), y)
    y += 2

    for (const part of parts) {
      y = ensureSpace(doc, y, 20)
      y = addDetailRow(doc, part.repairPart.partName, formatJobPartLineTotal(part), y)
      y = addDetailRow(
        doc,
        'Qty & Price',
        `Qty ${part.quantity} × ${formatRepairPartPrice(part.unitPrice)}`,
        y,
      )
      y = addDetailRow(
        doc,
        'Added',
        `${part.addedBy.displayName || part.addedBy.username || 'Unknown'} · ${formatJobPartAddedAt(part.createdAt)}`,
        y,
      )
      y += 2
    }
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
