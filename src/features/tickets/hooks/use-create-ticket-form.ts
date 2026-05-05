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
    if (!values.title.trim()) nextErrors.title = 'Title is required.'
    if (!values.description.trim()) nextErrors.description = 'Description is required.'
    if (!values.categoryId.trim()) nextErrors.categoryId = 'Category is required.'
    if (!values.busNumber.trim()) nextErrors.busNumber = 'Bus number is required.'
    if (!values.slaDueAtLocal.trim()) {
      nextErrors.slaDueAtLocal = 'SLA due date is required.'
    } else if (Number.isNaN(new Date(values.slaDueAtLocal).getTime())) {
      nextErrors.slaDueAtLocal = 'Enter a valid SLA due date and time.'
    }
    return nextErrors
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
    validate,
    applySuggestedSla,
    resetForm,
    payload,
  }
}
