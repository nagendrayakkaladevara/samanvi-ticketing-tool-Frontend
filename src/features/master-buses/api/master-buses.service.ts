import { apiClient } from '@/lib/api/client'
import { extractPaginationMeta } from '@/lib/utils/master-api'
import type {
  CreateMasterBusInput,
  MasterBus,
  UpdateMasterBusInput,
} from '@/features/master-buses/types/master-bus'

const endpoint = '/master/buses'

function normalizeString(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : undefined
}

function normalizeNullableString(value: unknown): string | null {
  if (value === null || value === undefined) return null
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

function normalizeNumber(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value)
    if (Number.isFinite(parsed)) return parsed
  }
  return undefined
}

function normalizeMasterBus(raw: unknown): MasterBus | null {
  if (!raw || typeof raw !== 'object') return null

  const value = raw as Record<string, unknown>
  const idCandidate = value.id ?? value.busId ?? value._id
  const id =
    typeof idCandidate === 'string' ? idCandidate : typeof idCandidate === 'number' ? String(idCandidate) : undefined
  const busNumber = normalizeString(value.busNumber)
  const engineNumber = normalizeString(value.engineNumber)
  const chassisNumber = normalizeString(value.chassisNumber)
  const odometer = normalizeNumber(value.odometer)
  const insuranceValidity = normalizeString(value.insuranceValidity)

  if (!id || !busNumber || !engineNumber || !chassisNumber || odometer === undefined || !insuranceValidity) {
    return null
  }

  return {
    id,
    busNumber,
    engineNumber,
    chassisNumber,
    purchaseDate: normalizeNullableString(value.purchaseDate),
    odometer,
    insuranceValidity,
    pollutionValidity: normalizeNullableString(value.pollutionValidity),
    fcValidity: normalizeNullableString(value.fcValidity),
    basePermitValidity: normalizeNullableString(value.basePermitValidity),
    homeTaxValidity: normalizeNullableString(value.homeTaxValidity),
    aitpValidity: normalizeNullableString(value.aitpValidity),
    aitpAuthorizationValidity: normalizeNullableString(value.aitpAuthorizationValidity),
    serviceOutDate: normalizeNullableString(value.serviceOutDate),
    remarks: normalizeNullableString(value.remarks),
    lastMaintenanceDate: normalizeNullableString(value.lastMaintenanceDate),
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
    if (Array.isArray(nested.buses)) return nested.buses
  }

  if (Array.isArray(record.items)) return record.items
  if (Array.isArray(record.buses)) return record.buses

  return []
}

function extractEntityPayload(raw: unknown): unknown {
  if (!raw || typeof raw !== 'object') return raw

  const record = raw as Record<string, unknown>
  if (record.data && typeof record.data === 'object') {
    const nested = record.data as Record<string, unknown>
    return nested.bus ?? nested
  }

  return record.bus ?? raw
}

function extractBusNumbersPayload(raw: unknown): string[] {
  if (Array.isArray(raw)) {
    return raw.map(normalizeBusNumberValue).filter((value): value is string => Boolean(value))
  }

  if (!raw || typeof raw !== 'object') return []

  const record = raw as Record<string, unknown>
  const nested = record.data

  if (Array.isArray(nested)) {
    return nested.map(normalizeBusNumberValue).filter((value): value is string => Boolean(value))
  }

  if (nested && typeof nested === 'object') {
    const nestedRecord = nested as Record<string, unknown>
    if (Array.isArray(nestedRecord.busNumbers)) {
      return nestedRecord.busNumbers
        .map(normalizeBusNumberValue)
        .filter((value): value is string => Boolean(value))
    }
  }

  if (Array.isArray(record.busNumbers)) {
    return record.busNumbers.map(normalizeBusNumberValue).filter((value): value is string => Boolean(value))
  }

  return extractArrayPayload(raw).map(normalizeBusNumberValue).filter((value): value is string => Boolean(value))
}

function normalizeBusNumberValue(raw: unknown): string | null {
  if (typeof raw === 'string') {
    const trimmed = raw.trim()
    return trimmed.length > 0 ? trimmed : null
  }

  if (!raw || typeof raw !== 'object') return null

  const value = raw as Record<string, unknown>
  return normalizeString(value.busNumber) ?? null
}

export const masterBusesService = {
  /**
   * Loads master buses for Bus No masters + Excel/PDF exports.
   * When `page` is omitted, pages through the API so buses beyond the first
   * response are not silently missing from the grid or downloads.
   */
  async list(params?: { page?: number; limit?: number }): Promise<MasterBus[]> {
    if (params?.page != null) {
      const page = params.page
      const limit = params.limit ?? 50
      const { data } = await apiClient.get<unknown>(endpoint, { params: { page, limit } })
      return extractArrayPayload(data).map(normalizeMasterBus).filter((bus): bus is MasterBus => Boolean(bus))
    }

    const limit = Math.min(params?.limit ?? 50, 100)
    const maxPages = 50
    const busesById = new Map<string, MasterBus>()

    for (let page = 1; page <= maxPages; page += 1) {
      const { data } = await apiClient.get<unknown>(endpoint, { params: { page, limit } })
      const pageBuses = extractArrayPayload(data)
        .map(normalizeMasterBus)
        .filter((bus): bus is MasterBus => Boolean(bus))

      for (const bus of pageBuses) {
        busesById.set(bus.id, bus)
      }

      if (pageBuses.length === 0 || pageBuses.length < limit) {
        break
      }

      const meta = extractPaginationMeta(data, { page, limit })
      if (meta.hasExplicitTotalPages && page >= meta.totalPages) {
        break
      }
    }

    return Array.from(busesById.values())
  },

  async listBusNumbers(): Promise<string[]> {
    const { data } = await apiClient.get<unknown>(`${endpoint}/bus-numbers`)
    const busNumbers = extractBusNumbersPayload(data)
    return [...new Set(busNumbers)].sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
  },

  async create(input: CreateMasterBusInput): Promise<MasterBus> {
    const { data } = await apiClient.post<unknown>(endpoint, input)
    return normalizeMasterBus(extractEntityPayload(data)) ?? (extractEntityPayload(data) as MasterBus)
  },

  async update({ busId, ...input }: UpdateMasterBusInput): Promise<MasterBus> {
    const { data } = await apiClient.patch<unknown>(`${endpoint}/${busId}`, input)
    return normalizeMasterBus(extractEntityPayload(data)) ?? (extractEntityPayload(data) as MasterBus)
  },

  async remove(busId: string): Promise<void> {
    await apiClient.delete(`${endpoint}/${busId}`)
  },
}
