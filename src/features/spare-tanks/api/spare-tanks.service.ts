import { apiClient } from '@/lib/api/client'
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

  let busNumber = normalizeString(value.busNumber)
  let busId: string | undefined

  if (value.bus && typeof value.bus === 'object') {
    const bus = value.bus as Record<string, unknown>
    busNumber = busNumber ?? normalizeString(bus.busNumber)
    const nestedId = bus.id ?? bus.busId
    busId = typeof nestedId === 'string' ? nestedId : typeof nestedId === 'number' ? String(nestedId) : undefined
  }

  if (!id || !ownerName || !busNumber) return null

  return {
    id,
    ownerName,
    busNumber,
    busId,
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
  async list(params?: { page?: number; limit?: number }): Promise<SpareTank[]> {
    const page = params?.page ?? 1
    const limit = params?.limit ?? 50
    const { data } = await apiClient.get<unknown>(endpoint, { params: { page, limit } })
    return extractArrayPayload(data).map(normalizeSpareTank).filter((item): item is SpareTank => Boolean(item))
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
