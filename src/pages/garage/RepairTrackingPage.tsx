import { useQuery } from '@tanstack/react-query'
import { Plus, RefreshCw, Wrench } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'

import { PageGradientHeader } from '@/components/page-gradient-header'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { garageService } from '@/features/garage/api/garage.service'
import { RepairJobsListView } from '@/features/garage/components/repair-jobs-list-view'
import { useSubmoduleActions } from '@/hooks/use-permissions'

export function RepairTrackingPage() {
  const navigate = useNavigate()
  const jobActions = useSubmoduleActions('garage', 'repair_job')
  const { data: jobs = [], isLoading, isFetching, isError, error } = useQuery({
    queryKey: ['garage', 'jobs'],
    queryFn: () => garageService.listJobs({ page: 1, limit: 50 }),
  })

  const hasJobs = jobs.length > 0

  return (
    <section className="space-y-6">
      <PageGradientHeader
        accent="orange"
        eyebrow="Garage"
        title="Repair Tracking"
        description="Track repair job progress and status updates across your fleet."
        actions={
          <>
            {isFetching && !isLoading ? (
              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                Syncing...
              </span>
            ) : null}
            {jobActions.canCreate ? (
              <Button className="w-full sm:w-auto" onClick={() => navigate('/garage/create-job')}>
                <Plus className="h-4 w-4" />
                Create Job
              </Button>
            ) : null}
          </>
        }
      />

      {!isLoading && !isError && !hasJobs ? (
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
          {jobActions.canCreate ? (
            <Button onClick={() => navigate('/garage/create-job')}>
              <Plus className="h-4 w-4" />
              Create Repair Job
            </Button>
          ) : null}
        </Card>
      ) : (
        <RepairJobsListView
          jobs={jobs}
          isLoading={isLoading}
          isError={isError}
          error={error instanceof Error ? error : null}
          canEdit={jobActions.canEdit}
          canDelete={jobActions.canDelete}
        />
      )}

      {jobActions.canCreate ? (
        <p className="text-center text-xs text-muted-foreground">
          Need to log a new repair?{' '}
          <Link to="/garage/create-job" className="font-medium text-primary hover:underline">
            Create a repair job
          </Link>
        </p>
      ) : null}
    </section>
  )
}
