import { getJobDetailsPath } from '@/features/garage/utils/job-routes'

export function getJobShareUrl(jobId: string, origin = window.location.origin): string {
  return `${origin}${getJobDetailsPath(jobId)}`
}
