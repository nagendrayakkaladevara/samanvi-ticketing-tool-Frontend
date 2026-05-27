import { useMemo, useState } from 'react'

import type { CreateRepairJobInput } from '@/features/garage/types/job'

export type CreateJobFormValues = {
  busNumber: string
  odometerReading: string
  repairCategoryId: string
  priority: CreateRepairJobInput['priority']
  description: string
  reportedDriverId: string
  assignedToOfficeStaffId: string
}

export type CreateJobFormErrors = Partial<Record<keyof CreateJobFormValues, string>>

const defaultValues: CreateJobFormValues = {
  busNumber: '',
  odometerReading: '',
  repairCategoryId: '',
  priority: 'medium',
  description: '',
  reportedDriverId: '',
  assignedToOfficeStaffId: '',
}

export function getCreateJobFieldError(
  field: keyof CreateJobFormValues,
  values: CreateJobFormValues,
): string | undefined {
  switch (field) {
    case 'busNumber':
      return !values.busNumber.trim() ? 'Bus number is required.' : undefined
    case 'odometerReading': {
      const odometer = values.odometerReading.trim()
      if (!odometer) {
        return 'Odometer reading is required.'
      }
      const parsed = Number(odometer)
      if (!Number.isInteger(parsed) || parsed < 0) {
        return 'Enter a valid non-negative whole number.'
      }
      return undefined
    }
    case 'repairCategoryId':
      return !values.repairCategoryId.trim() ? 'Repair category is required.' : undefined
    case 'description':
      return !values.description.trim() ? 'Description is required.' : undefined
    default:
      return undefined
  }
}

export function useCreateJobForm() {
  const [values, setValues] = useState<CreateJobFormValues>(defaultValues)
  const [errors, setErrors] = useState<CreateJobFormErrors>({})

  const validate = (): CreateJobFormErrors => {
    const nextErrors: CreateJobFormErrors = {}
    const validatedFields: Array<keyof CreateJobFormValues> = [
      'busNumber',
      'odometerReading',
      'repairCategoryId',
      'description',
    ]

    for (const field of validatedFields) {
      const error = getCreateJobFieldError(field, values)
      if (error) nextErrors[field] = error
    }

    return nextErrors
  }

  const blurField = (field: keyof CreateJobFormValues) => {
    const error = getCreateJobFieldError(field, values)
    setErrors((prev) => ({ ...prev, [field]: error }))
  }

  const setField = <K extends keyof CreateJobFormValues>(field: K, value: CreateJobFormValues[K]) => {
    setValues((prev) => ({ ...prev, [field]: value }))
    setErrors((prev) => ({ ...prev, [field]: undefined }))
  }

  const resetForm = () => {
    setValues(defaultValues)
    setErrors({})
  }

  const payload = useMemo<CreateRepairJobInput>(() => {
    const result: CreateRepairJobInput = {
      busNumber: values.busNumber.trim(),
      odometerReading: Number(values.odometerReading.trim()),
      repairCategoryId: values.repairCategoryId,
      priority: values.priority,
      description: values.description.trim(),
    }

    if (values.reportedDriverId.trim()) {
      result.reportedDriverId = values.reportedDriverId.trim()
    }
    if (values.assignedToOfficeStaffId.trim()) {
      result.assignedToOfficeStaffId = values.assignedToOfficeStaffId.trim()
    }

    return result
  }, [values])

  return {
    values,
    errors,
    setErrors,
    setField,
    blurField,
    validate,
    resetForm,
    payload,
  }
}
