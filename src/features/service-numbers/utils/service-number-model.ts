import type {
  CreateServiceNumberInput,
  ServiceNumber,
  ServiceNumberFormValues,
  ServiceNumberGridRow,
} from '@/features/service-numbers/types/service-number'

export const defaultServiceNumberFormValues: ServiceNumberFormValues = {
  serviceForId: '',
  serviceNo: '',
  from: '',
  to: '',
  via: '',
  parkingAmount: '',
  driverOneBeta: '',
  driverTwoBeta: '',
  helperBeta: '',
  conductorBeta: '',
  distance: '',
  optDriver: '',
  optHelper: '',
  remarks: '',
}

export function serviceNumberToFormValues(item: ServiceNumber): ServiceNumberFormValues {
  return {
    serviceForId: item.serviceFor.id,
    serviceNo: item.serviceNo,
    from: item.from,
    to: item.to,
    via: item.via,
    parkingAmount: String(item.parkingAmount),
    driverOneBeta: String(item.driverOneBeta),
    driverTwoBeta: String(item.driverTwoBeta),
    helperBeta: String(item.helperBeta),
    conductorBeta: String(item.conductorBeta),
    distance: String(item.distance),
    optDriver: item.optDriver,
    optHelper: item.optHelper,
    remarks: item.remarks,
  }
}

export function compareServiceNumbersByNo(a: ServiceNumber, b: ServiceNumber): number {
  return a.serviceNo.localeCompare(b.serviceNo, undefined, { numeric: true })
}

export function toServiceNumberGridRow(item: ServiceNumber): ServiceNumberGridRow {
  return {
    id: item.id,
    serviceNo: item.serviceNo,
    serviceFor: item.serviceFor.serviceFor,
    route: `${item.from} → ${item.to}`,
    via: item.via,
    distanceLabel: formatDistance(item.distance),
    updatedAtLabel: formatDateTime(item.updatedAt),
  }
}

export function formatAmount(value: number): string {
  return new Intl.NumberFormat(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value)
}

export function formatDistance(value: number): string {
  return `${formatAmount(value)} km`
}

export function formatDateTime(rawDate?: string): string {
  if (!rawDate) return '—'
  const parsed = new Date(rawDate)
  if (Number.isNaN(parsed.getTime())) return '—'

  return new Intl.DateTimeFormat(undefined, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(parsed)
}

function parseNonNegativeNumber(raw: string, label: string): number | null {
  const trimmed = raw.trim()
  if (!trimmed) return null

  const parsed = Number(trimmed)
  if (!Number.isFinite(parsed) || parsed < 0) {
    throw new Error(`${label} must be a number greater than or equal to 0.`)
  }

  return parsed
}

function parseRequiredText(raw: string, label: string, maxLength: number): string {
  const trimmed = raw.trim()
  if (!trimmed) {
    throw new Error(`${label} is required.`)
  }
  if (trimmed.length > maxLength) {
    throw new Error(`${label} must be ${maxLength} characters or fewer.`)
  }
  return trimmed
}

export function buildServiceNumberPayload(values: ServiceNumberFormValues): CreateServiceNumberInput {
  const serviceForId = values.serviceForId.trim()
  if (!serviceForId) {
    throw new Error('Service For is required.')
  }

  return {
    serviceForId,
    serviceNo: parseRequiredText(values.serviceNo, 'Service number', 50),
    from: parseRequiredText(values.from, 'From', 120),
    to: parseRequiredText(values.to, 'To', 120),
    via: parseRequiredText(values.via, 'Via', 120),
    parkingAmount: parseNonNegativeNumber(values.parkingAmount, 'Parking amount') ?? 0,
    driverOneBeta: parseNonNegativeNumber(values.driverOneBeta, 'Driver one beta') ?? 0,
    driverTwoBeta: parseNonNegativeNumber(values.driverTwoBeta, 'Driver two beta') ?? 0,
    helperBeta: parseNonNegativeNumber(values.helperBeta, 'Helper beta') ?? 0,
    conductorBeta: parseNonNegativeNumber(values.conductorBeta, 'Conductor beta') ?? 0,
    distance: parseNonNegativeNumber(values.distance, 'Distance') ?? 0,
    optDriver: parseRequiredText(values.optDriver, 'Optional driver', 120),
    optHelper: parseRequiredText(values.optHelper, 'Optional helper', 120),
    remarks: parseRequiredText(values.remarks, 'Remarks', 500),
  }
}
