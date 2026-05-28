export function getRepairTrackingPath(): string {
  return '/garage/repair-tracking'
}

export function getJobDetailsPath(jobId: string): string {
  return `/garage/repair-tracking/${jobId}`
}

export function getJobEditPath(jobId: string): string {
  return `/garage/repair-tracking/${jobId}/edit`
}
