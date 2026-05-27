import type { RepairPart } from '@/features/garage/types/repair-part'

export function formatRepairPartPrice(price: string): string {
  const parsed = Number.parseFloat(price)
  if (Number.isNaN(parsed)) return price

  return new Intl.NumberFormat(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(parsed)
}

export function formatRepairPartUpdatedAt(value?: string): string {
  if (!value) return '—'
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return '—'

  return new Intl.DateTimeFormat(undefined, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(parsed)
}

export function compareRepairPartsByName(a: RepairPart, b: RepairPart): number {
  return a.partName.localeCompare(b.partName)
}

export type RepairPartFormField = 'partName' | 'price' | 'description'

export function getRepairPartFieldError(
  field: RepairPartFormField,
  values: { partName: string; price: string; description: string },
): string | undefined {
  switch (field) {
    case 'partName': {
      const trimmedName = values.partName.trim()
      if (!trimmedName) {
        return 'Part name is required.'
      }
      if (trimmedName.length > 120) {
        return 'Part name must be 120 characters or fewer.'
      }
      return undefined
    }
    case 'price': {
      const trimmedPrice = values.price.trim()
      if (!trimmedPrice) {
        return 'Price is required.'
      }
      const parsedPrice = Number.parseFloat(trimmedPrice)
      if (Number.isNaN(parsedPrice) || parsedPrice < 0) {
        return 'Enter a valid non-negative price.'
      }
      return undefined
    }
    case 'description': {
      const trimmedDescription = values.description.trim()
      if (trimmedDescription.length > 500) {
        return 'Description must be 500 characters or fewer.'
      }
      return undefined
    }
    default:
      return undefined
  }
}

export function validateRepairPartForm(values: {
  partName: string
  price: string
  description: string
}): Record<string, string> {
  const errors: Record<string, string> = {}
  const fields: RepairPartFormField[] = ['partName', 'price', 'description']

  for (const field of fields) {
    const error = getRepairPartFieldError(field, values)
    if (error) errors[field] = error
  }

  return errors
}
