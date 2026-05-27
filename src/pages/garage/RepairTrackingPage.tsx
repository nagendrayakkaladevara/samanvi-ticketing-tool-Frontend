import { useQuery } from '@tanstack/react-query'
import { Loader2, Plus, RefreshCw, Wrench } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import type { RepairJob } from '@/features/garage/types/job'
import { apiClient } from '@/lib/api/client'
import { cn } from '@/lib/utils'

const jobsEndpoint = '/garage/jobs'

const priorityStyles: Record<RepairJob['priority'], string> = {
  low: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
  medium: 'bg-sky-500/10 text-sky-700 dark:text-sky-300',
  high: 'bg-amber-500/10 text-amber-700 dark:text-amber-300',
  urgent: 'bg-rose-500/10 text-rose-700 dark:text-rose-300',
}

const statusStyles: Record<RepairJob['status'], string> = {
  created: 'bg-muted text-muted-foreground',
  assigned: 'bg-primary/10 text-primary',
  in_progress: 'bg-amber-500/10 text-amber-700 dark:text-amber-300',
  on_hold: 'bg-orange-500/10 text-orange-700 dark:text-orange-300',
  completed: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
  cancelled: 'bg-destructive/10 text-destructive',
}

function formatStatus(status: RepairJob['status']): string {
  return status.replace(/_/g, ' ')
}

async function listJobs(): Promise<RepairJob[]> {
  const { data } = await apiClient.get<unknown>(jobsEndpoint, { params: { page: 1, limit: 50 } })
  const payload = data && typeof data === 'object' ? (data as Record<string, unknown>).data : data
  const items =
    payload && typeof payload === 'object' && Array.isArray((payload as Record<string, unknown>).items)
      ? ((payload as Record<string, unknown>).items as unknown[])
      : []

  const jobs: RepairJob[] = []

  for (const item of items) {
    if (!item || typeof item !== 'object') continue
    const value = item as Record<string, unknown>
    const id = typeof value.id === 'string' ? value.id : undefined
    const jobIdNumber = typeof value.jobIdNumber === 'string' ? value.jobIdNumber : undefined
    const description = typeof value.description === 'string' ? value.description : undefined
    const priority = typeof value.priority === 'string' ? (value.priority as RepairJob['priority']) : undefined
    const status = typeof value.status === 'string' ? (value.status as RepairJob['status']) : undefined
    const bus = value.bus && typeof value.bus === 'object' ? (value.bus as Record<string, unknown>) : null
    const category =
      value.repairCategory && typeof value.repairCategory === 'object'
        ? (value.repairCategory as Record<string, unknown>)
        : null

    if (!id || !jobIdNumber || !description || !priority || !status || !bus || !category) continue

    jobs.push({
      id,
      jobIdNumber,
      description,
      priority,
      status,
      odometerReading: typeof value.odometerReading === 'number' ? value.odometerReading : 0,
      isRepeatJob: Boolean(value.isRepeatJob),
      createdAt: typeof value.createdAt === 'string' ? value.createdAt : '',
      updatedAt: typeof value.updatedAt === 'string' ? value.updatedAt : '',
      bus: {
        id: typeof bus.id === 'string' ? bus.id : '',
        busNumber: typeof bus.busNumber === 'string' ? bus.busNumber : '',
      },
      repairCategory: {
        id: typeof category.id === 'string' ? category.id : '',
        name: typeof category.name === 'string' ? category.name : '',
        level: typeof category.level === 'number' ? category.level : 0,
      },
      reportedDriver: null,
      assignedToOfficeStaff: null,
      createdBy: { id: '', username: '', displayName: '' },
    })
  }

  return jobs
}

export function RepairTrackingPage() {
  const navigate = useNavigate()
  const { data: jobs = [], isLoading, isFetching, isError, error, refetch } = useQuery({
    queryKey: ['garage', 'jobs'],
    queryFn: listJobs,
  })

  return (
    <section className="mx-auto w-full max-w-5xl space-y-5">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary shadow-sm">
            <Wrench className="size-5" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Repair Tracking</h1>
            <p className="text-sm text-muted-foreground">Track repair job progress and status updates.</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
            {isFetching ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            Refresh
          </Button>
          <Button size="sm" onClick={() => navigate('/garage/create-job')}>
            <Plus className="h-4 w-4" />
            Create Job
          </Button>
        </div>
      </header>

      {isError ? (
        <Card className="border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          {error instanceof Error ? error.message : 'Failed to load repair jobs.'}
        </Card>
      ) : null}

      {isLoading ? (
        <div className="grid gap-3">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-24 w-full rounded-xl" />
          ))}
        </div>
      ) : jobs.length === 0 ? (
        <Card className="flex flex-col items-center justify-center gap-4 border-dashed p-10 text-center">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-muted">
            <Wrench className="size-6 text-muted-foreground" />
          </div>
          <div className="space-y-1">
            <h2 className="text-lg font-medium">No repair jobs yet</h2>
            <p className="max-w-sm text-sm text-muted-foreground">
              Create your first repair job to start tracking garage work.
            </p>
          </div>
          <Button onClick={() => navigate('/garage/create-job')}>
            <Plus className="h-4 w-4" />
            Create Repair Job
          </Button>
        </Card>
      ) : (
        <div className="grid gap-3">
          {jobs.map((job) => (
            <Card key={job.id} className="p-4 transition-colors hover:bg-muted/20">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-sm font-semibold">{job.jobIdNumber}</span>
                    <span
                      className={cn(
                        'rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase',
                        priorityStyles[job.priority],
                      )}
                    >
                      {job.priority}
                    </span>
                    <span
                      className={cn(
                        'rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize',
                        statusStyles[job.status],
                      )}
                    >
                      {formatStatus(job.status)}
                    </span>
                  </div>
                  <p className="text-sm font-medium">{job.bus.busNumber}</p>
                  <p className="line-clamp-2 text-sm text-muted-foreground">{job.description}</p>
                  <p className="text-xs text-muted-foreground">
                    {job.repairCategory.name} · {job.odometerReading.toLocaleString()} km
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <p className="text-center text-xs text-muted-foreground">
        Need to log a new repair?{' '}
        <Link to="/garage/create-job" className="font-medium text-primary hover:underline">
          Create a repair job
        </Link>
      </p>
    </section>
  )
}
