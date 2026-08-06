import type { ComponentType, FormEventHandler } from 'react'
import { useMemo, useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { ArrowLeft, Gauge, Loader2, UserRound, Wrench } from 'lucide-react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { toast } from '@/lib/toast'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { FieldError } from '@/components/ui/field-error'
import { FormLabel } from '@/components/ui/form-label'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { useDriversQuery } from '@/features/employees/hooks/use-drivers-query'
import { useOfficeStaffQuery } from '@/features/employees/hooks/use-office-staff-query'
import { garageService } from '@/features/garage/api/garage.service'
import { RepairCategoryPicker } from '@/features/garage/components/repair-category-picker'
import { useRepairCategoriesQuery } from '@/features/garage/hooks/use-repair-categories-query'
import type { JobPriority, JobStatus, RepairJob } from '@/features/garage/types/job'
import { getCreateJobFieldError } from '@/features/garage/hooks/use-create-job-form'
import { getJobDetailsPath, getRepairTrackingPath } from '@/features/garage/utils/job-routes'
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
import { invalidFieldClass } from '@/lib/form/form-field-styles'
import { cn } from '@/lib/utils'

const selectTriggerClass =
  'h-10 min-w-0 [&>span]:line-clamp-1 [&>span]:block [&>span]:text-left [&>span]:leading-snug'

const selectItemClass = 'whitespace-normal py-2.5 pl-2 pr-8 text-sm leading-snug'

const priorityOptions: Array<{ value: JobPriority; label: string }> = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'urgent', label: 'Urgent' },
]

function SectionHeader({
  icon: Icon,
  title,
  description,
}: {
  icon: ComponentType<{ className?: string }>
  title: string
  description: string
}) {
  return (
    <div className="flex items-start gap-3 border-b border-border/70 pb-4">
      <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary sm:size-10">
        <Icon className="size-4" />
      </div>
      <div className="min-w-0 flex-1 space-y-0.5">
        <h2 className="text-sm font-semibold tracking-tight">{title}</h2>
        <p className="text-xs leading-relaxed text-muted-foreground">{description}</p>
      </div>
    </div>
  )
}

type EditJobFormProps = {
  job: RepairJob
  jobId: string
}

function EditJobForm({ job, jobId }: EditJobFormProps) {
  const navigate = useNavigate()

  const [odometerReading, setOdometerReading] = useState(() => String(job.odometerReading))
  const [repairCategoryId, setRepairCategoryId] = useState(() => job.repairCategory.id)
  const [priority, setPriority] = useState<JobPriority>(() => job.priority)
  const [status, setStatus] = useState<JobStatus>(() => job.status)
  const [description, setDescription] = useState(() => job.description)
  const [reportedDriverId, setReportedDriverId] = useState(() => job.reportedDriver?.id ?? '')
  const [assignedToOfficeStaffId, setAssignedToOfficeStaffId] = useState(
    () => job.assignedToOfficeStaff?.id ?? '',
  )
  const [statusChangeNote, setStatusChangeNote] = useState('')
  const [errors, setErrors] = useState<{
    odometerReading?: string
    repairCategoryId?: string
    description?: string
    statusChangeNote?: string
  }>({})

  const initialStatus = job.status
  const hasStatusChanged = status !== initialStatus
  const statusOptions = useMemo(
    () =>
      getSelectableStatusOptions(initialStatus).map((value) => ({
        value,
        label: formatJobStatus(value),
      })),
    [initialStatus],
  )
  const isStatusLocked = isTerminalJobStatus(initialStatus)
  const isStatusNoteRequired = hasStatusChanged && isNoteRequiredForTransition(status)
  const showStatusChangeNote = hasStatusChanged

  const { data: categoriesData, isLoading: isCategoriesLoading } = useRepairCategoriesQuery()
  const categoryTree = categoriesData?.tree ?? []

  const { data: drivers = [], isLoading: isDriversLoading } = useDriversQuery()
  const { data: officeStaffRaw = [], isLoading: isStaffLoading } = useOfficeStaffQuery()
  const officeStaff = useMemo(
    () => officeStaffRaw.filter((staff) => !staff.dateOfLeaving),
    [officeStaffRaw],
  )

  const currentDriverInList = Boolean(
    job.reportedDriver?.id && drivers.some((driver) => driver.id === job.reportedDriver?.id),
  )
  const currentStaffInList = Boolean(
    job.assignedToOfficeStaff?.id &&
      officeStaff.some((staff) => staff.id === job.assignedToOfficeStaff?.id),
  )

  const updateMutation = useMutation({
    mutationFn: () => {
      const trimmedNote = statusChangeNote.trim()
      // Only include status when the user actually changed it. Always sending the
      // form's loaded status can overwrite concurrent status updates (e.g. from the
      // Update status dialog) or fail the whole PATCH on an invalid reverse transition.
      return garageService.updateJob({
        jobId,
        odometerReading: Number(odometerReading.trim()),
        repairCategoryId,
        priority,
        description: description.trim(),
        reportedDriverId: reportedDriverId.trim() ? reportedDriverId.trim() : null,
        assignedToOfficeStaffId: assignedToOfficeStaffId.trim() ? assignedToOfficeStaffId.trim() : null,
        ...(hasStatusChanged
          ? { status, ...(trimmedNote ? { note: trimmedNote } : {}) }
          : {}),
      })
    },
    onSuccess: (updated) => {
      toast.success(`Repair job ${updated.jobIdNumber} updated successfully.`)
      queryClient.invalidateQueries({ queryKey: ['garage', 'jobs'] })
      navigate(getJobDetailsPath(updated.id))
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to update repair job.')
    },
  })

  const validate = () => {
    const nextErrors: typeof errors = {}
    const odometerError = getCreateJobFieldError('odometerReading', {
      busNumber: 'x',
      odometerReading,
      repairCategoryId,
      priority,
      description,
      reportedDriverId,
      assignedToOfficeStaffId,
    })
    const categoryError = getCreateJobFieldError('repairCategoryId', {
      busNumber: 'x',
      odometerReading,
      repairCategoryId,
      priority,
      description,
      reportedDriverId,
      assignedToOfficeStaffId,
    })
    const descriptionError = getCreateJobFieldError('description', {
      busNumber: 'x',
      odometerReading,
      repairCategoryId,
      priority,
      description,
      reportedDriverId,
      assignedToOfficeStaffId,
    })
    if (odometerError) nextErrors.odometerReading = odometerError
    if (categoryError) nextErrors.repairCategoryId = categoryError
    if (descriptionError) nextErrors.description = descriptionError

    if (hasStatusChanged) {
      const invalidTransition = getInvalidStatusTransitionMessage(initialStatus, status)
      if (invalidTransition) {
        toast.error(invalidTransition)
        return { ...nextErrors, statusChangeNote: invalidTransition }
      }

      const noteError = validateStatusChangeNote(status, statusChangeNote)
      if (noteError) nextErrors.statusChangeNote = noteError
    }

    setErrors(nextErrors)
    return nextErrors
  }

  const handleSubmit: FormEventHandler<HTMLFormElement> = (event) => {
    event.preventDefault()
    const nextErrors = validate()
    if (Object.keys(nextErrors).length > 0) {
      toast.error('Please fill all required fields.')
      return
    }
    updateMutation.mutate()
  }

  const isSubmitting = updateMutation.isPending

  return (
    <>
      <header className="space-y-3">
        <Button
          variant="ghost"
          className="-ml-2 h-9 w-fit px-2"
          onClick={() => navigate(getJobDetailsPath(job.id))}
        >
          <ArrowLeft className="h-4 w-4 shrink-0" />
          Back to job details
        </Button>
        <div>
          <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">Edit {job.jobIdNumber}</h1>
          <p className="text-sm text-muted-foreground">Bus {job.bus.busNumber}</p>
        </div>
      </header>

      <form onSubmit={handleSubmit} className="space-y-4 pb-28 sm:pb-4" noValidate>
        <Card className="space-y-4 p-4 sm:space-y-5 sm:p-5">
          <SectionHeader
            icon={Gauge}
            title="Vehicle details"
            description="Update odometer reading for this repair job."
          />
          <div className="space-y-2">
            <FormLabel htmlFor="odometerReading" required>
              Odometer Reading (km)
            </FormLabel>
            <Input
              id="odometerReading"
              type="number"
              min={0}
              step={1}
              inputMode="numeric"
              className={cn(errors.odometerReading && invalidFieldClass)}
              value={odometerReading}
              onChange={(event) => {
                setOdometerReading(event.target.value)
                setErrors((prev) => ({ ...prev, odometerReading: undefined }))
              }}
              disabled={isSubmitting}
            />
            <FieldError message={errors.odometerReading} />
          </div>
        </Card>

        <Card className="space-y-4 p-4 sm:space-y-5 sm:p-5">
          <SectionHeader
            icon={Wrench}
            title="Repair details"
            description="Update category, priority, status, and description."
          />

          <div className="space-y-2">
            <RepairCategoryPicker
              id="repairCategoryId"
              tree={categoryTree}
              value={repairCategoryId}
              onValueChange={setRepairCategoryId}
              disabled={isSubmitting || isCategoriesLoading}
              invalid={Boolean(errors.repairCategoryId)}
              placeholder={isCategoriesLoading ? 'Loading categories…' : 'Select repair category'}
              className={cn(errors.repairCategoryId && invalidFieldClass)}
            />
            <FieldError message={errors.repairCategoryId} />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <FormLabel required>Priority</FormLabel>
              <Select
                value={priority}
                onValueChange={(value) => setPriority(value as JobPriority)}
                disabled={isSubmitting}
              >
                <SelectTrigger className={selectTriggerClass}>
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  {priorityOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value} className={selectItemClass}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <FormLabel required>Status</FormLabel>
              <Select
                value={status}
                onValueChange={(value) => {
                  setStatus(value as JobStatus)
                  setStatusChangeNote('')
                  setErrors((prev) => ({ ...prev, statusChangeNote: undefined }))
                }}
                disabled={isSubmitting || isStatusLocked}
              >
                <SelectTrigger className={selectTriggerClass}>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value} className={selectItemClass}>
                      {option.label}
                      {option.value === initialStatus ? ' (current)' : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {isStatusLocked ? (
                <p className="text-xs text-muted-foreground">
                  Closed and cancelled jobs cannot be moved to another status.
                </p>
              ) : null}
            </div>
          </div>

          {showStatusChangeNote ? (
            <div className="space-y-2">
              <FormLabel htmlFor="statusChangeNote" required={isStatusNoteRequired}>
                Status change note
              </FormLabel>
              <Textarea
                id="statusChangeNote"
                className="min-h-24"
                value={statusChangeNote}
                maxLength={STATUS_NOTE_MAX_LENGTH}
                disabled={isSubmitting}
                onChange={(event) => {
                  setStatusChangeNote(event.target.value)
                  setErrors((prev) => ({ ...prev, statusChangeNote: undefined }))
                }}
                placeholder={
                  isStatusNoteRequired
                    ? status === 'completed'
                      ? 'Describe what was completed…'
                      : 'Explain why the job is on hold…'
                    : 'Optional note for the activity log'
                }
              />
              <FieldError message={errors.statusChangeNote} />
            </div>
          ) : null}

          <div className="space-y-2">
            <FormLabel htmlFor="description" required>
              Description
            </FormLabel>
            <Textarea
              id="description"
              className={cn('min-h-28', errors.description && invalidFieldClass)}
              value={description}
              onChange={(event) => {
                setDescription(event.target.value)
                setErrors((prev) => ({ ...prev, description: undefined }))
              }}
              disabled={isSubmitting}
            />
            <FieldError message={errors.description} />
          </div>
        </Card>

        <Card className="space-y-4 p-4 sm:space-y-5 sm:p-5">
          <SectionHeader
            icon={UserRound}
            title="People & assignment"
            description="Update the reporting driver and assigned office staff."
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="reportedDriverId">Reported Driver</Label>
              <Select
                value={reportedDriverId || '__none'}
                onValueChange={(value) => setReportedDriverId(value === '__none' ? '' : value)}
                disabled={isSubmitting || isDriversLoading}
              >
                <SelectTrigger id="reportedDriverId" className={selectTriggerClass}>
                  <SelectValue placeholder="Select driver (optional)" />
                </SelectTrigger>
                <SelectContent position="popper" className="max-h-[min(24rem,70vh)]">
                  <SelectItem value="__none" className={selectItemClass}>
                    None
                  </SelectItem>
                  {job.reportedDriver && !currentDriverInList ? (
                    <SelectItem value={job.reportedDriver.id} className={selectItemClass}>
                      {job.reportedDriver.driverIdNumber || job.reportedDriver.id} —{' '}
                      {job.reportedDriver.aadharName || job.reportedDriver.dlName || 'Current driver'}
                    </SelectItem>
                  ) : null}
                  {drivers.map((driver) => (
                    <SelectItem key={driver.id} value={driver.id} className={selectItemClass}>
                      {driver.driverIdNumber} — {driver.aadharName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="assignedToOfficeStaffId">Assign To (Office Staff)</Label>
              <Select
                value={assignedToOfficeStaffId || '__none'}
                onValueChange={(value) => setAssignedToOfficeStaffId(value === '__none' ? '' : value)}
                disabled={isSubmitting || isStaffLoading}
              >
                <SelectTrigger id="assignedToOfficeStaffId" className={selectTriggerClass}>
                  <SelectValue placeholder="Select staff (optional)" />
                </SelectTrigger>
                <SelectContent position="popper" className="max-h-[min(24rem,70vh)]">
                  <SelectItem value="__none" className={selectItemClass}>
                    None
                  </SelectItem>
                  {job.assignedToOfficeStaff && !currentStaffInList ? (
                    <SelectItem value={job.assignedToOfficeStaff.id} className={selectItemClass}>
                      {job.assignedToOfficeStaff.staffIdNumber || job.assignedToOfficeStaff.id} —{' '}
                      {job.assignedToOfficeStaff.nickName ||
                        job.assignedToOfficeStaff.aadharName ||
                        'Current assignee'}
                    </SelectItem>
                  ) : null}
                  {officeStaff.map((staff) => (
                    <SelectItem key={staff.id} value={staff.id} className={selectItemClass}>
                      {staff.staffIdNumber} — {staff.nickName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </Card>

        <div className="sticky bottom-0 z-10 -mx-4 border-t border-border/80 bg-background/95 px-4 pb-4 pt-3 backdrop-blur sm:bottom-3 sm:mx-0 sm:border-0 sm:bg-transparent sm:px-0 sm:pb-0 sm:pt-0">
          <Card className="flex flex-col gap-3 border p-3 shadow-lg sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              className="h-10 w-full sm:w-auto"
              onClick={() => navigate(getJobDetailsPath(job.id))}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" className="h-10 w-full sm:w-auto" disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Save Changes
            </Button>
          </Card>
        </div>
      </form>
    </>
  )
}

export function EditJobPage() {
  const navigate = useNavigate()
  const { jobId } = useParams()

  const { data: job, isLoading: isJobLoading, isError: isJobError } = useQuery({
    queryKey: ['garage', 'jobs', jobId],
    queryFn: () => garageService.getJob(jobId!),
    enabled: Boolean(jobId),
  })

  if (!jobId) {
    return <Navigate to={getRepairTrackingPath()} replace />
  }

  if (isJobLoading) {
    return (
      <section className="mx-auto w-full min-w-0 max-w-3xl space-y-6">
        <Skeleton className="h-9 w-48" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </section>
    )
  }

  if (isJobError || !job) {
    return (
      <section className="mx-auto w-full min-w-0 max-w-3xl space-y-4">
        <Button variant="ghost" onClick={() => navigate(getRepairTrackingPath())}>
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        <Card className="border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          Repair job not found.
        </Card>
      </section>
    )
  }

  return (
    <section className="mx-auto w-full min-w-0 max-w-3xl space-y-6">
      <EditJobForm key={job.id} job={job} jobId={jobId} />
    </section>
  )
}
