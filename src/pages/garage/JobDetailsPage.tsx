import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, Pencil, Wrench } from 'lucide-react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'

import { MasterDetailGrid } from '@/components/master-detail-grid'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import '@/features/tickets/styles/tickets-grid.css'

import { garageService } from '@/features/garage/api/garage.service'
import {
  formatJobDate,
  formatJobPriority,
  formatJobStatus,
  getPrioritySeverityClass,
} from '@/features/garage/utils/job-list-model'
import { getJobEditPath, getRepairTrackingPath } from '@/features/garage/utils/job-routes'
import { cn } from '@/lib/utils'

function DetailItem({
  label,
  value,
  className,
}: {
  label: string
  value: string
  className?: string
}) {
  return (
    <div className={cn('space-y-1 rounded-lg border bg-muted/20 px-3 py-2.5', className)}>
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="text-sm font-medium text-foreground">{value}</p>
    </div>
  )
}

export function JobDetailsPage() {
  const navigate = useNavigate()
  const { jobId } = useParams()

  const {
    data: job,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['garage', 'jobs', jobId],
    queryFn: () => garageService.getJob(jobId!),
    enabled: Boolean(jobId),
  })

  if (!jobId) {
    return <Navigate to={getRepairTrackingPath()} replace />
  }

  if (isLoading) {
    return (
      <section className="mx-auto w-full min-w-0 max-w-4xl space-y-5">
        <Skeleton className="h-9 w-40" />
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-2 gap-3">
          {Array.from({ length: 8 }).map((_, index) => (
            <Skeleton key={index} className="h-20 rounded-lg" />
          ))}
        </div>
      </section>
    )
  }

  if (isError || !job) {
    return (
      <section className="mx-auto w-full min-w-0 max-w-4xl space-y-5">
        <Button variant="ghost" className="-ml-2 h-9 w-fit px-2" onClick={() => navigate(getRepairTrackingPath())}>
          <ArrowLeft className="h-4 w-4 shrink-0" />
          Back to repair tracking
        </Button>
        <Card className="border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          {error instanceof Error ? error.message : 'Repair job not found.'}
        </Card>
      </section>
    )
  }

  const prioritySeverity = getPrioritySeverityClass(job.priority)
  const assignedLabel = job.assignedToOfficeStaff
    ? `${job.assignedToOfficeStaff.nickName}${job.assignedToOfficeStaff.designation ? ` (${job.assignedToOfficeStaff.designation})` : ''}`
    : 'Unassigned'
  const driverLabel = job.reportedDriver
    ? `${job.reportedDriver.driverIdNumber} — ${job.reportedDriver.dlName}`
    : 'None'

  return (
    <section className="mx-auto w-full min-w-0 max-w-4xl space-y-5">
      <header className="space-y-3">
        <Button
          variant="ghost"
          className="-ml-2 h-9 w-fit px-2 sm:-ml-3 sm:px-4"
          onClick={() => navigate(getRepairTrackingPath())}
        >
          <ArrowLeft className="h-4 w-4 shrink-0" />
          <span className="sm:hidden">Back</span>
          <span className="hidden sm:inline">Back to repair tracking</span>
        </Button>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 flex-1 items-start gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-orange-500/10 text-orange-600 shadow-sm dark:text-orange-400 sm:size-11">
              <Wrench className="size-5" />
            </div>
            <div className="min-w-0 flex-1 space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="font-mono text-xl font-semibold tracking-tight sm:text-2xl">{job.jobIdNumber}</h1>
                <span
                  className={`ticket-grid__severity-badge ticket-grid__severity-badge--${prioritySeverity}`}
                >
                  {formatJobPriority(job.priority).toUpperCase()}
                </span>
              </div>
              <p className="text-sm text-muted-foreground capitalize">{formatJobStatus(job.status)}</p>
            </div>
          </div>
          <Button className="w-full sm:w-auto" onClick={() => navigate(getJobEditPath(job.id))}>
            <Pencil className="h-4 w-4" />
            Edit Job
          </Button>
        </div>
      </header>

      <Card className="space-y-4 p-4 sm:p-5">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Job Details</h2>
        <MasterDetailGrid columns="threeColLg">
          <DetailItem label="Bus Number" value={job.bus.busNumber} />
          <DetailItem label="Repair Category" value={job.repairCategory.name} />
          <DetailItem label="Odometer (km)" value={job.odometerReading.toLocaleString()} />
          <DetailItem label="Assigned To" value={assignedLabel} />
          <DetailItem label="Reported Driver" value={driverLabel} />
          <DetailItem label="Created By" value={job.createdBy.displayName || job.createdBy.username || 'Unknown'} />
          <DetailItem label="Created At" value={formatJobDate(job.createdAt)} />
          <DetailItem label="Updated At" value={formatJobDate(job.updatedAt)} />
          <DetailItem label="Repeat Job" value={job.isRepeatJob ? 'Yes' : 'No'} />
        </MasterDetailGrid>

        <div className="space-y-1 rounded-lg border bg-background px-3 py-2.5">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Description</p>
          <p className="text-sm leading-6 text-foreground">{job.description}</p>
        </div>
      </Card>

      <p className="text-center text-xs text-muted-foreground">
        <Link to={getRepairTrackingPath()} className="font-medium text-primary hover:underline">
          Return to repair tracking
        </Link>
      </p>
    </section>
  )
}
