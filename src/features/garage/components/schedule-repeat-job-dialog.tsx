import { useEffect, useState, type FormEvent } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
import { toast } from '@/lib/toast'

import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { garageService } from '@/features/garage/api/garage.service'
import {
  getMinRepeatScheduleDateInput,
  isValidRepeatScheduleDateInput,
  hasPendingRepeatSchedule,
  repeatScheduleDateInputToIso,
  repeatScheduledForToDateInput,
} from '@/features/garage/utils/job-repeat-model'
import {
  dateToInputValue,
  formatMasterDateDisplay,
  inputValueToDate,
  inputValueToMasterDate,
} from '@/lib/utils/master-dates'
import { queryClient } from '@/lib/query/query-client'

type ScheduleRepeatJobDialogProps = {
  open: boolean
  jobId: string
  jobIdNumber: string
  onOpenChange: (open: boolean) => void
  repeatScheduledFor?: string | null
  repeatProcessedAt?: string | null
}

export function ScheduleRepeatJobDialog({
  open,
  jobId,
  jobIdNumber,
  onOpenChange,
  repeatScheduledFor = null,
  repeatProcessedAt = null,
}: ScheduleRepeatJobDialogProps) {
  const [scheduleDate, setScheduleDate] = useState('')
  const isEditMode = hasPendingRepeatSchedule({ repeatScheduledFor, repeatProcessedAt })

  useEffect(() => {
    if (open) {
      setScheduleDate(isEditMode ? repeatScheduledForToDateInput(repeatScheduledFor) : '')
      return
    }
    setScheduleDate('')
  }, [open, isEditMode, repeatScheduledFor])

  const scheduleMutation = useMutation({
    mutationFn: (scheduleRepeatFor: string) =>
      garageService.updateJob({ jobId, scheduleRepeatFor }),
    onSuccess: () => {
      toast.success(isEditMode ? 'Repeat job schedule updated.' : 'Repeat job scheduled successfully.')
      queryClient.invalidateQueries({ queryKey: ['garage', 'jobs', jobId] })
      queryClient.invalidateQueries({ queryKey: ['garage', 'jobs'] })
      onOpenChange(false)
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to schedule repeat job.')
    },
  })

  const isSaving = scheduleMutation.isPending

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!isValidRepeatScheduleDateInput(scheduleDate)) {
      toast.error('Choose a date from tomorrow onward.')
      return
    }

    try {
      const scheduleRepeatFor = repeatScheduleDateInputToIso(scheduleDate)
      scheduleMutation.mutate(scheduleRepeatFor)
    } catch (validationError) {
      toast.error(
        validationError instanceof Error ? validationError.message : 'Invalid repeat date.',
      )
    }
  }

  const minScheduleDateInput = getMinRepeatScheduleDateInput()
  const minScheduleDate = inputValueToDate(minScheduleDateInput)
  const selectedDate = inputValueToDate(scheduleDate)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="z-[100] sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditMode ? 'Edit Repeat Job' : 'Create Repeat Job'}</DialogTitle>
          <DialogDescription>
            {isEditMode
              ? `Update the follow-up date for ${jobIdNumber}. The scheduled repeat job will run on the new date.`
              : `Schedule a follow-up repair job for ${jobIdNumber}. When the date arrives, a new job is created automatically with the same bus, category, and assignee details.`}
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label>Repeat on</Label>
            <div className="flex justify-center rounded-md border bg-card p-2">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => setScheduleDate(date ? dateToInputValue(date) : '')}
                disabled={isSaving || !minScheduleDate ? true : { before: minScheduleDate }}
                defaultMonth={selectedDate ?? minScheduleDate}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Earliest date:{' '}
              {formatMasterDateDisplay(inputValueToMasterDate(minScheduleDateInput))} (tomorrow).
            </p>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSaving || !scheduleDate.trim()}>
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {isEditMode ? 'Save Changes' : 'Schedule Repeat'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
