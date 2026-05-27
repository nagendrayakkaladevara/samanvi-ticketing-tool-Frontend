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

export function validateRepairPartForm(values: {
  partName: string
  price: string
  description: string
}): Record<string, string> {
  const errors: Record<string, string> = {}
  const trimmedName = values.partName.trim()

  if (!trimmedName) {
    errors.partName = 'Part name is required.'
  } else if (trimmedName.length > 120) {
    errors.partName = 'Part name must be 120 characters or fewer.'
  }

  const trimmedPrice = values.price.trim()
  if (!trimmedPrice) {
    errors.price = 'Price is required.'
  } else {
    const parsedPrice = Number.parseFloat(trimmedPrice)
    if (Number.isNaN(parsedPrice) || parsedPrice < 0) {
      errors.price = 'Enter a valid non-negative price.'
    }
  }

  const trimmedDescription = values.description.trim()
  if (trimmedDescription.length > 500) {
    errors.description = 'Description must be 500 characters or fewer.'
  }

  return errors
}
