import { useEffect, useMemo, useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
import { toast } from '@/lib/toast'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { FieldError } from '@/components/ui/field-error'
import { FormLabel } from '@/components/ui/form-label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { garageService } from '@/features/garage/api/garage.service'
import type { JobStatus, RepairJob } from '@/features/garage/types/job'
import { formatJobStatus } from '@/features/garage/utils/job-list-model'
import {
  getInvalidStatusTransitionMessage,
  getSelectableStatusOptions,
  isNoteRequiredForTransition,
  isTerminalJobStatus,
  STATUS_NOTE_MAX_LENGTH,
  validateStatusChangeNote,
} from '@/features/garage/utils/job-status-transition'
import { queryClient } from '@/lib/query/query-client'

type UpdateJobStatusDialogProps = {
  job: RepairJob
  open: boolean
  onOpenChange: (open: boolean) => void
}

function formatStatusLabel(status: JobStatus, currentStatus: JobStatus): string {
  const label = formatJobStatus(status)
  return status === currentStatus ? `${label} (current)` : label
}

export function UpdateJobStatusDialog({ job, open, onOpenChange }: UpdateJobStatusDialogProps) {
  const [nextStatus, setNextStatus] = useState<JobStatus>(job.status)
  const [statusNote, setStatusNote] = useState('')
  const [noteError, setNoteError] = useState<string | undefined>()

  const statusOptions = useMemo(() => getSelectableStatusOptions(job.status), [job.status])
  const hasStatusChanged = nextStatus !== job.status
  const isNoteRequired = isNoteRequiredForTransition(nextStatus)
  const canUpdateStatus = !isTerminalJobStatus(job.status)

  useEffect(() => {
    if (!open) return
    setNextStatus(job.status)
    setStatusNote('')
    setNoteError(undefined)
  }, [open, job.status])

  const updateStatusMutation = useMutation({
    mutationFn: async () => {
      if (!hasStatusChanged) {
        throw new Error('Please select a different status.')
      }

      const invalidTransition = getInvalidStatusTransitionMessage(job.status, nextStatus)
      if (invalidTransition) {
        throw new Error(invalidTransition)
      }

      const noteValidationError = validateStatusChangeNote(nextStatus, statusNote)
      if (noteValidationError) {
        throw new Error(noteValidationError)
      }

      const trimmedNote = statusNote.trim()
      return garageService.updateJob({
        jobId: job.id,
        status: nextStatus,
        ...(trimmedNote ? { note: trimmedNote } : {}),
      })
    },
    onSuccess: (updated) => {
      toast.success(`Repair job ${updated.jobIdNumber} status updated.`)
      queryClient.invalidateQueries({ queryKey: ['garage', 'jobs'] })
      queryClient.invalidateQueries({ queryKey: ['garage', 'jobs', job.id] })
      queryClient.invalidateQueries({ queryKey: ['garage', 'jobs', job.id, 'timeline'] })
      onOpenChange(false)
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to update job status.')
    },
  })

  function handleSave() {
    const noteValidationError = validateStatusChangeNote(nextStatus, statusNote)
    if (noteValidationError) {
      setNoteError(noteValidationError)
      return
    }
    setNoteError(undefined)
    updateStatusMutation.mutate()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Update status</DialogTitle>
          <DialogDescription>
            {canUpdateStatus
              ? isNoteRequired
                ? 'Select a new status and add a required note for this change.'
                : 'Select a new status. You can optionally add a note for the activity log.'
              : 'This job is in a terminal status and cannot be changed further.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <FormLabel htmlFor="job-status-select" required={canUpdateStatus}>
              Status
            </FormLabel>
            <Select
              value={nextStatus}
              onValueChange={(value) => {
                setNextStatus(value as JobStatus)
                setNoteError(undefined)
              }}
              disabled={!canUpdateStatus || updateStatusMutation.isPending}
            >
              <SelectTrigger id="job-status-select">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((status) => (
                  <SelectItem key={status} value={status}>
                    {formatStatusLabel(status, job.status)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {canUpdateStatus ? (
            <div className="space-y-2">
              <FormLabel htmlFor="job-status-note" required={isNoteRequired && hasStatusChanged}>
                Status change note
              </FormLabel>
              <Textarea
                id="job-status-note"
                className="min-h-24"
                value={statusNote}
                disabled={updateStatusMutation.isPending}
                maxLength={STATUS_NOTE_MAX_LENGTH}
                onChange={(event) => {
                  setStatusNote(event.target.value)
                  setNoteError(undefined)
                }}
                placeholder={
                  isNoteRequired
                    ? nextStatus === 'completed'
                      ? 'Describe what was completed…'
                      : 'Explain why the job is on hold…'
                    : 'Optional note for the activity log'
                }
              />
              <FieldError message={noteError} />
            </div>
          ) : null}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            disabled={updateStatusMutation.isPending}
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            disabled={!canUpdateStatus || !hasStatusChanged || updateStatusMutation.isPending}
            onClick={handleSave}
          >
            {updateStatusMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Save status
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
