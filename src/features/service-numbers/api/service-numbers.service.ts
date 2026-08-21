import { apiClient } from '@/lib/api/client'
import { extractPaginationMeta } from '@/lib/utils/master-api'
import type {
  CreateServiceNumberInput,
  ServiceForRef,
  ServiceNumber,
  UpdateServiceNumberInput,
} from '@/features/service-numbers/types/service-number'

const endpoint = '/master/service-numbers'

function normalizeString(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : undefined
}

function normalizeNumber(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value)
    if (Number.isFinite(parsed)) return parsed
  }
  return undefined
}

function normalizeServiceForRef(raw: unknown): ServiceForRef | null {
  if (!raw || typeof raw !== 'object') return null

  const value = raw as Record<string, unknown>
  const idCandidate = value.id ?? value.serviceForId
  const id =
    typeof idCandidate === 'string' ? idCandidate : typeof idCandidate === 'number' ? String(idCandidate) : undefined
  const serviceFor = normalizeString(value.serviceFor)

  if (!id || !serviceFor) return null

  return { id, serviceFor }
}

function normalizeServiceNumber(raw: unknown): ServiceNumber | null {
  if (!raw || typeof raw !== 'object') return null

  const value = raw as Record<string, unknown>
  const idCandidate = value.id ?? value.serviceNumberId ?? value._id
  const id =
    typeof idCandidate === 'string' ? idCandidate : typeof idCandidate === 'number' ? String(idCandidate) : undefined
  const serviceNo = normalizeString(value.serviceNo)
  const from = normalizeString(value.from)
  const to = normalizeString(value.to)
  const via = normalizeString(value.via)
  const parkingAmount = normalizeNumber(value.parkingAmount)
  const driverOneBeta = normalizeNumber(value.driverOneBeta)
  const driverTwoBeta = normalizeNumber(value.driverTwoBeta)
  const helperBeta = normalizeNumber(value.helperBeta)
  const conductorBeta = normalizeNumber(value.conductorBeta)
  const distance = normalizeNumber(value.distance)
  const optDriver = normalizeString(value.optDriver)
  const optHelper = normalizeString(value.optHelper)
  const remarks = normalizeString(value.remarks)
  const serviceFor = normalizeServiceForRef(value.serviceFor)

  if (
    !id ||
    !serviceNo ||
    !from ||
    !to ||
    !via ||
    parkingAmount === undefined ||
    driverOneBeta === undefined ||
    driverTwoBeta === undefined ||
    helperBeta === undefined ||
    conductorBeta === undefined ||
    distance === undefined ||
    !optDriver ||
    !optHelper ||
    !remarks ||
    !serviceFor
  ) {
    return null
  }

  return {
    id,
    serviceNo,
    from,
    to,
    via,
    parkingAmount,
    driverOneBeta,
    driverTwoBeta,
    helperBeta,
    conductorBeta,
    distance,
    optDriver,
    optHelper,
    remarks,
    serviceFor,
    createdAt: normalizeString(value.createdAt),
    updatedAt: normalizeString(value.updatedAt),
  }
}

function extractArrayPayload(raw: unknown): unknown[] {
  if (Array.isArray(raw)) return raw

  if (!raw || typeof raw !== 'object') return []

  const record = raw as Record<string, unknown>
  if (Array.isArray(record.data)) return record.data

  if (record.data && typeof record.data === 'object') {
    const nested = record.data as Record<string, unknown>
    if (Array.isArray(nested.items)) return nested.items
    if (Array.isArray(nested.serviceNumbers)) return nested.serviceNumbers
  }

  if (Array.isArray(record.items)) return record.items
  if (Array.isArray(record.serviceNumbers)) return record.serviceNumbers

  return []
}

function extractEntityPayload(raw: unknown): unknown {
  if (!raw || typeof raw !== 'object') return raw

  const record = raw as Record<string, unknown>
  if (record.data && typeof record.data === 'object') {
    const nested = record.data as Record<string, unknown>
    return nested.serviceNumber ?? nested
  }

  return record.serviceNumber ?? raw
}

export const serviceNumbersService = {
  /**
   * Loads service numbers for Service No masters.
   * When `page` is omitted, pages through the API so routes beyond the first
   * response are not silently missing from the grid.
   */
  async list(params?: { page?: number; limit?: number }): Promise<ServiceNumber[]> {
    if (params?.page != null) {
      const page = params.page
      const limit = params.limit ?? 50
      const { data } = await apiClient.get<unknown>(endpoint, { params: { page, limit } })
      return extractArrayPayload(data)
        .map(normalizeServiceNumber)
        .filter((item): item is ServiceNumber => Boolean(item))
    }

    const limit = Math.min(params?.limit ?? 50, 100)
    const maxPages = 50
    const serviceNumbersById = new Map<string, ServiceNumber>()

    for (let page = 1; page <= maxPages; page += 1) {
      const { data } = await apiClient.get<unknown>(endpoint, { params: { page, limit } })
      const pageItems = extractArrayPayload(data)
        .map(normalizeServiceNumber)
        .filter((item): item is ServiceNumber => Boolean(item))

      for (const item of pageItems) {
        serviceNumbersById.set(item.id, item)
      }

      if (pageItems.length === 0 || pageItems.length < limit) {
        break
      }

      const meta = extractPaginationMeta(data, { page, limit })
      if (meta.hasExplicitTotalPages && page >= meta.totalPages) {
        break
      }
    }

    return Array.from(serviceNumbersById.values())
  },

  async create(input: CreateServiceNumberInput): Promise<ServiceNumber> {
    const { data } = await apiClient.post<unknown>(endpoint, input)
    return normalizeServiceNumber(extractEntityPayload(data)) ?? (extractEntityPayload(data) as ServiceNumber)
  },

  async update({ serviceNumberId, ...input }: UpdateServiceNumberInput): Promise<ServiceNumber> {
    const { data } = await apiClient.patch<unknown>(`${endpoint}/${serviceNumberId}`, input)
    return normalizeServiceNumber(extractEntityPayload(data)) ?? (extractEntityPayload(data) as ServiceNumber)
  },

  async remove(serviceNumberId: string): Promise<void> {
    await apiClient.delete(`${endpoint}/${serviceNumberId}`)
  },
}
