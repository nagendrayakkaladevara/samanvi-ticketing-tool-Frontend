import { useMutation } from '@tanstack/react-query'
import { Loader2, Pencil } from 'lucide-react'
import { toast } from '@/lib/toast'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { garageService } from '@/features/garage/api/garage.service'
import type { JobStatus } from '@/features/garage/types/job'
import { formatJobStatus } from '@/features/garage/utils/job-list-model'
import { jobStatusOptions } from '@/features/garage/utils/job-status-options'
import { queryClient } from '@/lib/query/query-client'
import { cn } from '@/lib/utils'

type EditableJobStatusProps = {
  jobId: string
  status: JobStatus
  canEdit: boolean
  className?: string
}

export function EditableJobStatus({ jobId, status, canEdit, className }: EditableJobStatusProps) {
  const updateStatusMutation = useMutation({
    mutationFn: (nextStatus: JobStatus) =>
      garageService.updateJob({
        jobId,
        status: nextStatus,
      }),
    onSuccess: (updatedJob) => {
      toast.success(`Status updated to ${formatJobStatus(updatedJob.status)}.`)
      queryClient.invalidateQueries({ queryKey: ['garage', 'jobs', jobId] })
      queryClient.invalidateQueries({ queryKey: ['garage', 'jobs'] })
      queryClient.invalidateQueries({ queryKey: ['garage', 'jobs', jobId, 'timeline'] })
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to update status.')
    },
  })

  function handleStatusSelect(nextStatus: JobStatus) {
    if (nextStatus === status || updateStatusMutation.isPending) return
    updateStatusMutation.mutate(nextStatus)
  }

  const statusLabel = (
    <span
      className={cn(
        'inline-flex items-center rounded-md border border-border bg-background px-2.5 py-0.5 text-xs font-medium capitalize text-foreground',
        className,
      )}
    >
      {formatJobStatus(status)}
    </span>
  )

  if (!canEdit) {
    return statusLabel
  }

  return (
    <div className="inline-flex items-center gap-0.5">
      {statusLabel}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-7 text-muted-foreground hover:text-foreground"
            aria-label="Edit status"
            disabled={updateStatusMutation.isPending}
          >
            {updateStatusMutation.isPending ? (
              <Loader2 className="size-3.5 animate-spin" aria-hidden />
            ) : (
              <Pencil className="size-3.5" aria-hidden />
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-44">
          {jobStatusOptions.map((option) => (
            <DropdownMenuItem
              key={option.value}
              disabled={option.value === status || updateStatusMutation.isPending}
              onClick={() => handleStatusSelect(option.value)}
            >
              {option.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
