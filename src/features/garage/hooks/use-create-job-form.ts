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

export function useCreateJobForm() {
  const [values, setValues] = useState<CreateJobFormValues>(defaultValues)
  const [errors, setErrors] = useState<CreateJobFormErrors>({})

  const validate = (): CreateJobFormErrors => {
    const nextErrors: CreateJobFormErrors = {}

    if (!values.busNumber.trim()) {
      nextErrors.busNumber = 'Bus number is required.'
    }

    const odometer = values.odometerReading.trim()
    if (!odometer) {
      nextErrors.odometerReading = 'Odometer reading is required.'
    } else {
      const parsed = Number(odometer)
      if (!Number.isInteger(parsed) || parsed < 0) {
        nextErrors.odometerReading = 'Enter a valid non-negative whole number.'
      }
    }

    if (!values.repairCategoryId.trim()) {
      nextErrors.repairCategoryId = 'Repair category is required.'
    }

    if (!values.description.trim()) {
      nextErrors.description = 'Description is required.'
    }

    return nextErrors
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
    validate,
    resetForm,
    payload,
  }
}
