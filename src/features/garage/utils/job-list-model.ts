import type { JobPriority, JobStatus, RepairJob } from '@/features/garage/types/job'

export type JobGridRow = {
  id: string
  jobIdNumber: string
  description: string
  busNumber: string
  category: string
  priority: string
  priorityRaw: JobPriority
  status: string
  statusRaw: JobStatus
  assignedTo: string
  createdBy: string
  odometerReading: number
  createdAt: string
  isRepeatJob: boolean
}

const prioritySeverityMap: Record<JobPriority, string> = {
  low: 'low',
  medium: 'medium',
  high: 'high',
  urgent: 'critical',
}

export function getPrioritySeverityClass(priority: JobPriority): string {
  return prioritySeverityMap[priority] ?? 'low'
}

export function formatJobStatus(status: JobStatus): string {
  return status.replace(/_/g, ' ')
}

export function formatJobPriority(priority: JobPriority): string {
  return priority.charAt(0).toUpperCase() + priority.slice(1)
}

export function formatJobDate(rawDate: string | undefined): string {
  if (!rawDate) return '—'
  const parsed = new Date(rawDate)
  if (Number.isNaN(parsed.getTime())) return '—'
  return new Intl.DateTimeFormat(undefined, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(parsed)
}

export function compareJobsNewestFirst(a: RepairJob, b: RepairJob): number {
  const dateA = new Date(a.createdAt).getTime() || 0
  const dateB = new Date(b.createdAt).getTime() || 0
  return dateB - dateA
}

export function toJobGridRow(job: RepairJob): JobGridRow {
  return {
    id: job.id,
    jobIdNumber: job.jobIdNumber,
    description: job.description,
    busNumber: job.bus.busNumber,
    category: job.repairCategory.name,
    priority: formatJobPriority(job.priority),
    priorityRaw: job.priority,
    status: formatJobStatus(job.status),
    statusRaw: job.status,
    assignedTo: job.assignedToOfficeStaff?.nickName ?? 'Unassigned',
    createdBy: job.createdBy.displayName || job.createdBy.username || 'Unknown',
    odometerReading: job.odometerReading,
    createdAt: job.createdAt,
    isRepeatJob: job.isRepeatJob,
  }
}
