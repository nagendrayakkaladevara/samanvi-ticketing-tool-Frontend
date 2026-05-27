import { useMemo, useState } from 'react'

import type { CreateTicketInput } from '@/features/tickets/api/tickets.service'

export type CreateTicketFormValues = {
  title: string
  description: string
  severity: 'critical' | 'high' | 'medium' | 'low'
  priority: 'p1' | 'p2' | 'p3'
  categoryId: string
  busNumber: string
  slaDueAtLocal: string
  assignedToId: string
}

export type CreateTicketFormErrors = Partial<Record<keyof CreateTicketFormValues, string>>

function toDateTimeLocalValue(input: Date): string {
  const year = input.getFullYear()
  const month = String(input.getMonth() + 1).padStart(2, '0')
  const day = String(input.getDate()).padStart(2, '0')
  const hours = String(input.getHours()).padStart(2, '0')
  const minutes = String(input.getMinutes()).padStart(2, '0')
  return `${year}-${month}-${day}T${hours}:${minutes}`
}

function getSuggestedSlaDate(priority: CreateTicketFormValues['priority']): Date {
  const now = new Date()
  const minutesByPriority: Record<CreateTicketFormValues['priority'], number> = {
    p1: 4 * 60,
    p2: 12 * 60,
    p3: 24 * 60,
  }
  return new Date(now.getTime() + minutesByPriority[priority] * 60 * 1000)
}

export function getCreateTicketFieldError(
  field: keyof CreateTicketFormValues,
  values: CreateTicketFormValues,
): string | undefined {
  switch (field) {
    case 'title':
      return !values.title.trim() ? 'Title is required.' : undefined
    case 'description':
      return !values.description.trim() ? 'Description is required.' : undefined
    case 'categoryId':
      return !values.categoryId.trim() ? 'Category is required.' : undefined
    case 'busNumber':
      return !values.busNumber.trim() ? 'Bus number is required.' : undefined
    case 'slaDueAtLocal':
      if (!values.slaDueAtLocal.trim()) {
        return 'SLA due date is required.'
      }
      if (Number.isNaN(new Date(values.slaDueAtLocal).getTime())) {
        return 'Enter a valid SLA due date and time.'
      }
      return undefined
    default:
      return undefined
  }
}

export function useCreateTicketForm() {
  const [values, setValues] = useState<CreateTicketFormValues>({
    title: '',
    description: '',
    severity: 'medium',
    priority: 'p2',
    categoryId: '',
    busNumber: '',
    slaDueAtLocal: toDateTimeLocalValue(getSuggestedSlaDate('p2')),
    assignedToId: '',
  })
  const [errors, setErrors] = useState<CreateTicketFormErrors>({})

  const validate = (): CreateTicketFormErrors => {
    const nextErrors: CreateTicketFormErrors = {}
    const validatedFields: Array<keyof CreateTicketFormValues> = [
      'title',
      'description',
      'categoryId',
      'busNumber',
      'slaDueAtLocal',
    ]

    for (const field of validatedFields) {
      const error = getCreateTicketFieldError(field, values)
      if (error) nextErrors[field] = error
    }

    return nextErrors
  }

  const blurField = (field: keyof CreateTicketFormValues) => {
    const error = getCreateTicketFieldError(field, values)
    setErrors((prev) => ({ ...prev, [field]: error }))
  }

  const setField = <K extends keyof CreateTicketFormValues>(field: K, value: CreateTicketFormValues[K]) => {
    setValues((prev) => ({ ...prev, [field]: value }))
    setErrors((prev) => ({ ...prev, [field]: undefined }))
  }

  const applySuggestedSla = (priority: CreateTicketFormValues['priority']) => {
    setField('slaDueAtLocal', toDateTimeLocalValue(getSuggestedSlaDate(priority)))
  }

  const resetForm = () => {
    setValues({
      title: '',
      description: '',
      severity: 'medium',
      priority: 'p2',
      categoryId: '',
      busNumber: '',
      slaDueAtLocal: toDateTimeLocalValue(getSuggestedSlaDate('p2')),
      assignedToId: '',
    })
    setErrors({})
  }

  const payload = useMemo<CreateTicketInput>(
    () => ({
      title: values.title.trim(),
      description: values.description.trim(),
      severity: values.severity,
      priority: values.priority,
      categoryId: values.categoryId,
      busNumber: values.busNumber.trim(),
      slaDueAt: new Date(values.slaDueAtLocal).toISOString(),
    }),
    [values],
  )

  return {
    values,
    errors,
    setValues,
    setErrors,
    setField,
    blurField,
    validate,
    applySuggestedSla,
    resetForm,
    payload,
  }
}
