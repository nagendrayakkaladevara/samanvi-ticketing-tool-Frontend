import { beforeEach, describe, expect, it, vi } from 'vitest'

import { makeActivityLog, makeRepairJob, makeRepairJobPart } from '@/test/fixtures/garage'
import { downloadRepairJobPdf } from './download-repair-job-pdf'

const { mockSave, MockJsPDF } = vi.hoisted(() => {
  const mockSave = vi.fn()
  class MockJsPDF {
    setFontSize = vi.fn()
    setFont = vi.fn()
    setTextColor = vi.fn()
    setDrawColor = vi.fn()
    text = vi.fn()
    line = vi.fn()
    splitTextToSize = vi.fn().mockReturnValue(['line'])
    addPage = vi.fn()
    setPage = vi.fn()
    getNumberOfPages = vi.fn().mockReturnValue(1)
    save = mockSave
  }
  return { mockSave, MockJsPDF }
})

vi.mock('jspdf', () => ({
  jsPDF: MockJsPDF,
}))

vi.mock('@/lib/utils/pdf-report-branding', () => ({
  drawPdfQrSection: vi.fn().mockResolvedValue(50),
  drawPdfReportHeader: vi.fn().mockResolvedValue(30),
}))

vi.mock('@/lib/utils/pdf-report-layout', () => ({
  drawPdfSummaryBand: vi.fn().mockReturnValue(40),
  drawPdfSectionTitle: vi.fn().mockReturnValue(45),
  drawPdfDetailCard: vi.fn().mockReturnValue(60),
  drawPdfTextPanel: vi.fn().mockReturnValue(70),
  drawPdfDataTable: vi.fn().mockReturnValue(80),
  drawPdfCommentCards: vi.fn().mockReturnValue(90),
  drawPdfPageFooters: vi.fn(),
  ensurePdfSpace: vi.fn().mockImplementation(({ y }) => y),
  getPdfContentWidth: vi.fn().mockReturnValue(180),
  getJobPriorityBadgeColor: vi.fn().mockReturnValue('#000'),
  getJobStatusBadgeColor: vi.fn().mockReturnValue('#111'),
  PDF_A4: { margin: 16, width: 210 },
}))

describe('downloadRepairJobPdf', () => {
  beforeEach(() => {
    mockSave.mockClear()
  })

  it('generates PDF and saves with job id in filename', async () => {
    const job = makeRepairJob({ jobIdNumber: 'RJ-001' })
    await downloadRepairJobPdf(job)

    expect(mockSave).toHaveBeenCalledWith('RepairJob-RJ-001.pdf')
  })

  it('includes parts and comments sections when present', async () => {
    const job = makeRepairJob({
      parts: [makeRepairJobPart()],
      activityLogs: [makeActivityLog({ actionType: 'commented', note: 'Note' })],
      isRepeatJob: true,
      previousJob: { id: 'prev', jobIdNumber: 'RJ-000' },
      repeatScheduledFor: '2024-07-01T00:00:00Z',
      repeatProcessedAt: '2024-07-02T00:00:00Z',
      reportedDriver: {
        id: 'd1',
        driverIdNumber: 'DRV-1',
        aadharName: 'Driver',
        dlName: 'D',
      },
      assignedToOfficeStaff: {
        id: 's1',
        staffIdNumber: 'S1',
        nickName: 'Alex',
        aadharName: 'Alex',
        designation: 'Mech',
      },
    })

    await downloadRepairJobPdf(job)
    expect(mockSave).toHaveBeenCalled()
  })

  it('sanitizes unsafe filename characters', async () => {
    await downloadRepairJobPdf(makeRepairJob({ jobIdNumber: 'RJ/001' }))
    expect(mockSave).toHaveBeenCalledWith('RepairJob-RJ-001.pdf')
  })
})
