import { apiClient } from '@/lib/api/client'
import { extractPaginationMeta } from '@/lib/utils/master-api'
import type {
  CreateSpareTankInput,
  SpareTank,
  UpdateSpareTankInput,
} from '@/features/spare-tanks/types/spare-tank'

const endpoint = '/master/spare-tanks'

function normalizeString(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : undefined
}

function normalizeSpareTank(raw: unknown): SpareTank | null {
  if (!raw || typeof raw !== 'object') return null

  const value = raw as Record<string, unknown>
  const idCandidate = value.id ?? value.spareTankId ?? value._id
  const id =
    typeof idCandidate === 'string' ? idCandidate : typeof idCandidate === 'number' ? String(idCandidate) : undefined
  const ownerName = normalizeString(value.ownerName)
  const busNumber = normalizeString(value.busNumber)

  if (!id || !ownerName || !busNumber) return null

  return {
    id,
    ownerName,
    busNumber,
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
  }

  if (Array.isArray(record.items)) return record.items

  return []
}

function extractEntityPayload(raw: unknown): unknown {
  if (!raw || typeof raw !== 'object') return raw

  const record = raw as Record<string, unknown>
  if (record.data && typeof record.data === 'object') {
    const nested = record.data as Record<string, unknown>
    return nested
  }

  return raw
}

export const spareTanksService = {
  /**
   * Loads spare tanks for Bus No (Spare) masters + Excel/PDF exports.
   * When `page` is omitted, pages through the API so tanks beyond the first
   * response are not silently missing from the grid or downloads.
   */
  async list(params?: { page?: number; limit?: number }): Promise<SpareTank[]> {
    if (params?.page != null) {
      const page = params.page
      const limit = params.limit ?? 100
      const { data } = await apiClient.get<unknown>(endpoint, { params: { page, limit } })
      return extractArrayPayload(data).map(normalizeSpareTank).filter((item): item is SpareTank => Boolean(item))
    }

    const limit = Math.min(params?.limit ?? 100, 100)
    const maxPages = 50
    const tanksById = new Map<string, SpareTank>()

    for (let page = 1; page <= maxPages; page += 1) {
      const { data } = await apiClient.get<unknown>(endpoint, { params: { page, limit } })
      const pageTanks = extractArrayPayload(data)
        .map(normalizeSpareTank)
        .filter((item): item is SpareTank => Boolean(item))

      for (const tank of pageTanks) {
        tanksById.set(tank.id, tank)
      }

      if (pageTanks.length === 0 || pageTanks.length < limit) {
        break
      }

      const meta = extractPaginationMeta(data, { page, limit })
      if (meta.hasExplicitTotalPages && page >= meta.totalPages) {
        break
      }
    }

    return Array.from(tanksById.values())
  },

  async create(input: CreateSpareTankInput): Promise<SpareTank> {
    const payload = {
      busNumber: input.busNumber.trim(),
      ownerName: input.ownerName.trim(),
    }
    const { data } = await apiClient.post<unknown>(endpoint, payload)
    return normalizeSpareTank(extractEntityPayload(data)) ?? (extractEntityPayload(data) as SpareTank)
  },

  async update({ spareTankId, ...input }: UpdateSpareTankInput): Promise<SpareTank> {
    const payload: Record<string, string> = {}
    if (input.busNumber !== undefined) payload.busNumber = input.busNumber.trim()
    if (input.ownerName !== undefined) payload.ownerName = input.ownerName.trim()

    const { data } = await apiClient.patch<unknown>(`${endpoint}/${spareTankId}`, payload)
    return normalizeSpareTank(extractEntityPayload(data)) ?? (extractEntityPayload(data) as SpareTank)
  },

  async remove(spareTankId: string): Promise<void> {
    await apiClient.delete(`${endpoint}/${spareTankId}`)
  },
}
