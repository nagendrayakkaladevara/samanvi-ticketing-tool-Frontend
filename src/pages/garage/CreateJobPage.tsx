import type { ComponentType, FormEventHandler } from 'react'
import { useMemo } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Gauge, Loader2, UserRound, Wrench } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { toast } from '@/lib/toast'

import { PageGradientHeader } from '@/components/page-gradient-header'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { FieldError } from '@/components/ui/field-error'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { FormLabel } from '@/components/ui/form-label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { useDriversQuery } from '@/features/employees/hooks/use-drivers-query'
import { useOfficeStaffQuery } from '@/features/employees/hooks/use-office-staff-query'
import { useMasterBusNumbersQuery } from '@/features/master-buses/hooks/use-master-buses-query'
import { garageService } from '@/features/garage/api/garage.service'
import { RepairCategoryPicker } from '@/features/garage/components/repair-category-picker'
import { useCreateJobForm } from '@/features/garage/hooks/use-create-job-form'
import { useRepairCategoriesQuery } from '@/features/garage/hooks/use-repair-categories-query'
import type { JobPriority } from '@/features/garage/types/job'
import { useCurrentUser } from '@/hooks/use-current-user'
import { queryClient } from '@/lib/query/query-client'
import { invalidFieldClass } from '@/lib/form/form-field-styles'
import { cn } from '@/lib/utils'

const selectTriggerClass =
  'h-10 min-w-0 [&>span]:line-clamp-1 [&>span]:block [&>span]:text-left [&>span]:leading-snug'

const selectItemClass = 'whitespace-normal py-2.5 pl-2 pr-8 text-sm leading-snug'

const priorityOptions: Array<{ value: JobPriority; label: string; hint: string; accent: string }> = [
  { value: 'low', label: 'Low', hint: 'Routine maintenance', accent: 'border-emerald-500/40 bg-emerald-500/5' },
  { value: 'medium', label: 'Medium', hint: 'Standard repair', accent: 'border-sky-500/40 bg-sky-500/5' },
  { value: 'high', label: 'High', hint: 'Needs attention soon', accent: 'border-amber-500/40 bg-amber-500/5' },
  { value: 'urgent', label: 'Urgent', hint: 'Immediate action', accent: 'border-rose-500/40 bg-rose-500/5' },
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

export function CreateJobPage() {
  const navigate = useNavigate()
  const currentUser = useCurrentUser()
  const form = useCreateJobForm()

  const { data: categoriesData, isLoading: isCategoriesLoading } = useRepairCategoriesQuery()
  const categoryTree = categoriesData?.tree ?? []

  const { data: busNumbers = [], isLoading: isBusNumbersLoading } = useMasterBusNumbersQuery()
  const { data: drivers = [], isLoading: isDriversLoading } = useDriversQuery()
  const { data: officeStaffRaw = [], isLoading: isStaffLoading } = useOfficeStaffQuery()
  const officeStaff = useMemo(
    () => officeStaffRaw.filter((staff) => !staff.dateOfLeaving),
    [officeStaffRaw],
  )

  const createJobMutation = useMutation({
    mutationFn: () => garageService.createJob(form.payload),
    onSuccess: (job) => {
      toast.success(`Repair job ${job.jobIdNumber} created successfully.`)
      queryClient.invalidateQueries({ queryKey: ['garage', 'jobs'] })
      form.resetForm()
      navigate('/garage/repair-tracking')
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to create repair job.')
    },
  })

  const handleSubmit: FormEventHandler<HTMLFormElement> = (event) => {
    event.preventDefault()
    const nextErrors = form.validate()
    if (Object.keys(nextErrors).length > 0) {
      form.setErrors(nextErrors)
      toast.error('Please fill all required fields.')
      return
    }
    createJobMutation.mutate()
  }

  const isSubmitting = createJobMutation.isPending
  const selectedPriority = priorityOptions.find((option) => option.value === form.values.priority)

  return (
    <section className="mx-auto w-full min-w-0 max-w-3xl space-y-6">
      <PageGradientHeader
        accent="orange"
        eyebrow="Garage"
        title="Create Repair Job"
        description="Log a new garage repair with vehicle details, category, and optional assignment."
      />

      <form onSubmit={handleSubmit} className="space-y-4 pb-28 sm:pb-4" noValidate>
        <Card className="space-y-4 p-4 sm:space-y-5 sm:p-5">
          <SectionHeader
            icon={Gauge}
            title="Vehicle details"
            description="Identify the bus and record its current odometer reading."
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <FormLabel htmlFor="busNumber" required>
                Bus Number
              </FormLabel>
              <Select
                value={form.values.busNumber}
                onValueChange={(value) => form.setField('busNumber', value)}
                disabled={isSubmitting || isBusNumbersLoading}
              >
                <SelectTrigger
                  id="busNumber"
                  aria-invalid={Boolean(form.errors.busNumber)}
                  className={cn(selectTriggerClass, form.errors.busNumber && invalidFieldClass)}
                  onBlur={() => form.blurField('busNumber')}
                >
                  <SelectValue placeholder={isBusNumbersLoading ? 'Loading bus numbers…' : 'Select bus number'} />
                </SelectTrigger>
                <SelectContent position="popper" className="max-h-[min(24rem,70vh)] w-[var(--radix-select-trigger-width)]">
                  {busNumbers.length === 0 ? (
                    <SelectItem value="__empty" disabled className={selectItemClass}>
                      No buses available
                    </SelectItem>
                  ) : (
                    busNumbers.map((busNumber) => (
                      <SelectItem key={busNumber} value={busNumber} className={selectItemClass}>
                        {busNumber}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              <FieldError message={form.errors.busNumber} />
            </div>

            <div className="space-y-2 sm:col-span-2">
              <FormLabel htmlFor="odometerReading" required>
                Odometer Reading (km)
              </FormLabel>
              <Input
                id="odometerReading"
                type="number"
                min={0}
                step={1}
                inputMode="numeric"
                placeholder="e.g., 125000"
                className={cn(form.errors.odometerReading && invalidFieldClass)}
                value={form.values.odometerReading}
                onChange={(event) => form.setField('odometerReading', event.target.value)}
                onBlur={() => form.blurField('odometerReading')}
                aria-invalid={Boolean(form.errors.odometerReading)}
                disabled={isSubmitting}
              />
              <FieldError message={form.errors.odometerReading} />
            </div>
          </div>
        </Card>

        <Card className="space-y-4 p-4 sm:space-y-5 sm:p-5">
          <SectionHeader
            icon={Wrench}
            title="Repair details"
            description="Select a leaf repair category, set priority, and describe the work needed."
          />

          <div className="space-y-2">
            <RepairCategoryPicker
              id="repairCategoryId"
              tree={categoryTree}
              value={form.values.repairCategoryId}
              onValueChange={(value) => form.setField('repairCategoryId', value)}
              onBlur={() => form.blurField('repairCategoryId')}
              disabled={isSubmitting || isCategoriesLoading}
              invalid={Boolean(form.errors.repairCategoryId)}
              placeholder={isCategoriesLoading ? 'Loading categories…' : 'Select repair category'}
              className={cn(form.errors.repairCategoryId && invalidFieldClass)}
            />
            <p className="text-xs text-muted-foreground">Only leaf categories (no subcategories) can be selected.</p>
            <FieldError message={form.errors.repairCategoryId} />
          </div>

          <div className="space-y-2">
            <FormLabel required>Priority</FormLabel>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {priorityOptions.map((option) => {
                const isSelected = form.values.priority === option.value
                return (
                  <button
                    key={option.value}
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => form.setField('priority', option.value)}
                    className={cn(
                      'touch-manipulation rounded-lg border px-2.5 py-3 text-left transition-all sm:px-3 sm:py-2.5',
                      isSelected ? option.accent : 'border-border bg-background hover:bg-muted/50 active:bg-muted/70',
                      isSelected && 'ring-1 ring-primary/30',
                    )}
                  >
                    <span className="block text-sm font-medium">{option.label}</span>
                    <span className="mt-0.5 block text-[10px] leading-tight text-muted-foreground">{option.hint}</span>
                  </button>
                )
              })}
            </div>
            {selectedPriority ? (
              <p className="hidden text-xs text-muted-foreground sm:block">
                Selected: <span className="font-medium text-foreground">{selectedPriority.label}</span> —{' '}
                {selectedPriority.hint}
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <FormLabel htmlFor="description" required>
              Description
            </FormLabel>
            <Textarea
              id="description"
              placeholder="Describe the issue, symptoms, and any immediate safety concerns."
              className={cn('min-h-28', form.errors.description && invalidFieldClass)}
              value={form.values.description}
              onChange={(event) => form.setField('description', event.target.value)}
              onBlur={() => form.blurField('description')}
              aria-invalid={Boolean(form.errors.description)}
              disabled={isSubmitting}
            />
            <FieldError message={form.errors.description} />
          </div>
        </Card>

        <Card className="space-y-4 p-4 sm:space-y-5 sm:p-5">
          <SectionHeader
            icon={UserRound}
            title="People & assignment"
            description="Optionally link the reporting driver and assign an office staff member."
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="reportedDriverId">Reported Driver</Label>
              <Select
                value={form.values.reportedDriverId}
                onValueChange={(value) => form.setField('reportedDriverId', value === '__none' ? '' : value)}
                disabled={isSubmitting || isDriversLoading}
              >
                <SelectTrigger id="reportedDriverId" className={selectTriggerClass}>
                  <SelectValue placeholder="Select driver (optional)" />
                </SelectTrigger>
                <SelectContent position="popper" className="max-h-[min(24rem,70vh)] w-[var(--radix-select-trigger-width)]">
                  <SelectItem value="__none" className={selectItemClass}>
                    None
                  </SelectItem>
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
                value={form.values.assignedToOfficeStaffId}
                onValueChange={(value) => form.setField('assignedToOfficeStaffId', value === '__none' ? '' : value)}
                disabled={isSubmitting || isStaffLoading}
              >
                <SelectTrigger id="assignedToOfficeStaffId" className={selectTriggerClass}>
                  <SelectValue placeholder="Select staff (optional)" />
                </SelectTrigger>
                <SelectContent position="popper" className="max-h-[min(24rem,70vh)] w-[var(--radix-select-trigger-width)]">
                  <SelectItem value="__none" className={selectItemClass}>
                    None
                  </SelectItem>
                  {officeStaff.map((staff) => (
                    <SelectItem key={staff.id} value={staff.id} className={selectItemClass}>
                      {staff.staffIdNumber} — {staff.nickName}
                      {staff.designation ? ` (${staff.designation})` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Assigning staff sets the job status to &ldquo;assigned&rdquo; automatically.
              </p>
            </div>
          </div>

          <div className="rounded-md border border-border bg-muted/30 px-3 py-2 text-sm">
            <span className="text-muted-foreground">Created By: </span>
            <span className="font-medium text-foreground">{currentUser?.name ?? 'Current user'}</span>
          </div>
        </Card>

        <div className="sticky bottom-0 z-10 -mx-4 border-t border-border/80 bg-background/95 px-4 pb-4 pt-3 backdrop-blur supports-[backdrop-filter]:bg-background/85 sm:bottom-3 sm:mx-0 sm:border-0 sm:bg-transparent sm:px-0 sm:pb-0 sm:pt-0">
          <Card className="flex flex-col gap-3 border border-border bg-background/95 p-3 shadow-lg backdrop-blur supports-[backdrop-filter]:bg-background/85 dark:shadow-black/30 sm:flex-row sm:items-center sm:justify-between">
            <p className="hidden text-xs text-muted-foreground sm:block">
              Required fields must be completed before submitting.
            </p>
            <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center sm:gap-2">
              <Button
                type="button"
                variant="outline"
                className="h-10 w-full sm:w-auto"
                onClick={() => navigate('/garage/repair-tracking')}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" className="h-10 w-full sm:w-auto" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                <span className="sm:hidden">Create Job</span>
                <span className="hidden sm:inline">Create Repair Job</span>
              </Button>
            </div>
          </Card>
        </div>
      </form>
    </section>
  )
}
