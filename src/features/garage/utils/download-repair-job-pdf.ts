import { jsPDF } from 'jspdf'

import type { RepairJob, RepairJobPart } from '@/features/garage/types/job'
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
import {
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
  PDF_A4,
  type PdfDetailField,
} from '@/lib/utils/pdf-report-layout'

function sanitizeFilename(value: string): string {
  return value.replace(/[/\\?%*:|"<>]/g, '-').trim() || 'repair-job'
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

function buildJobDetailFields(job: RepairJob): PdfDetailField[] {
  const fields: PdfDetailField[] = [
    { label: 'Bus Number', value: job.bus.busNumber },
    { label: 'Repair Category', value: job.repairCategory.name },
    { label: 'Odometer (km)', value: job.odometerReading.toLocaleString() },
    { label: 'Assigned To', value: getAssignedLabel(job) },
    { label: 'Reported Driver', value: getDriverLabel(job) },
    {
      label: 'Created By',
      value: job.createdBy.displayName || job.createdBy.username || 'Unknown',
    },
    { label: 'Created At', value: formatJobDate(job.createdAt) },
    { label: 'Updated At', value: formatJobDate(job.updatedAt) },
    { label: 'Repeat Job', value: job.isRepeatJob ? 'Yes' : 'No' },
  ]

  if (job.isRepeatJob && job.previousJob) {
    fields.push({ label: 'Previous Job', value: job.previousJob.jobIdNumber })
  }

  if (job.repeatScheduledFor) {
    fields.push({
      label: 'Repeat Scheduled',
      value: formatRepeatScheduledDate(job.repeatScheduledFor),
    })
  }

  if (job.repeatProcessedAt) {
    fields.push({
      label: 'Repeat Processed',
      value: formatJobDate(job.repeatProcessedAt),
    })
  }

  return fields
}

function buildJobSubtitle(job: RepairJob): string {
  const parts = [
    `Bus ${job.bus.busNumber}`,
    job.repairCategory.name,
    `${job.odometerReading.toLocaleString()} km`,
  ]

  if (job.isRepeatJob) {
    parts.push('Repeat job')
  }

  return parts.join('  ·  ')
}

export async function downloadRepairJobPdf(job: RepairJob): Promise<void> {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const margin = PDF_A4.margin
  const contentWidth = getPdfContentWidth(margin)
  const generatedAt = formatJobDate(new Date().toISOString())
  const jobViewUrl = getJobShareUrl(job.id)
  let y: number = margin

  y = await drawPdfReportHeader({
    doc,
    margin,
    pageWidth: PDF_A4.width,
    title: 'Repair Job Report',
    subtitle: `Generated on ${generatedAt}`,
    y,
  })

  y = drawPdfSummaryBand({
    doc,
    margin,
    pageWidth: PDF_A4.width,
    title: job.jobIdNumber,
    subtitle: buildJobSubtitle(job),
    badges: [
      {
        label: formatJobPriority(job.priority).toUpperCase(),
        color: getJobPriorityBadgeColor(job.priority),
      },
      {
        label: formatJobStatus(job.status).toUpperCase(),
        color: getJobStatusBadgeColor(job.status),
      },
    ],
    y,
  })

  y = ensurePdfSpace({ doc, y, needed: 40, margin })
  y = await drawPdfQrSection({
    doc,
    margin,
    pageWidth: PDF_A4.width,
    contentWidth,
    url: jobViewUrl,
    y,
  })

  y = ensurePdfSpace({ doc, y, needed: 30, margin })
  y = drawPdfSectionTitle(doc, 'Job Details', y, margin, PDF_A4.width)
  y = drawPdfDetailCard({
    doc,
    margin,
    contentWidth,
    fields: buildJobDetailFields(job),
    y,
    columns: 2,
  })

  y = ensurePdfSpace({ doc, y, needed: 24, margin })
  y = drawPdfSectionTitle(doc, 'Description', y, margin, PDF_A4.width)
  y = drawPdfTextPanel({
    doc,
    margin,
    contentWidth,
    text: job.description,
    y,
  })

  const parts = job.parts ?? []
  if (parts.length > 0) {
    y = ensurePdfSpace({ doc, y, needed: 24, margin })
    y = drawPdfSectionTitle(doc, 'Spare Parts Used', y, margin, PDF_A4.width)
    y = drawPdfDataTable<RepairJobPart>({
      doc,
      margin,
      contentWidth,
      columns: [
        {
          header: 'Part Name',
          width: 58,
          value: (part) => part.repairPart.partName,
        },
        {
          header: 'Qty',
          width: 14,
          align: 'right',
          value: (part) => String(part.quantity),
        },
        {
          header: 'Unit Price',
          width: 30,
          align: 'right',
          value: (part) => formatRepairPartPrice(part.unitPrice),
        },
        {
          header: 'Line Total',
          width: 30,
          align: 'right',
          value: (part) => formatJobPartLineTotal(part),
        },
        {
          header: 'Added By',
          width: 50,
          value: (part) =>
            `${part.addedBy.displayName || part.addedBy.username || 'Unknown'} · ${formatJobPartAddedAt(part.createdAt)}`,
        },
      ],
      rows: parts,
      y,
      footerLabel: 'Total',
      footerValue: formatJobPartsTotal(parts),
    })
  }

  const comments = [...getJobComments(job.activityLogs ?? [])].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  )

  if (comments.length > 0) {
    y = ensurePdfSpace({ doc, y, needed: 20, margin })
    y = drawPdfSectionTitle(doc, `Comments (${comments.length})`, y, margin, PDF_A4.width)
    y = drawPdfCommentCards({
      doc,
      margin,
      contentWidth,
      comments: comments.map((comment) => ({
        meta: formatCommentMeta(comment),
        note: comment.note ?? '—',
      })),
      y,
    })
  }

  drawPdfPageFooters(doc, `Samanvi Ticketing · Repair Job ${job.jobIdNumber}`)
  doc.save(`RepairJob-${sanitizeFilename(job.jobIdNumber)}.pdf`)
}
