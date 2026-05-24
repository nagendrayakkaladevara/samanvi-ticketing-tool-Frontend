import { apiClient } from '@/lib/api/client'
import type { CreateServiceForInput, ServiceFor, UpdateServiceForInput } from '@/features/service-for/types/service-for'

const endpoint = '/master/service-for'

function normalizeString(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : undefined
}

function normalizeServiceFor(raw: unknown): ServiceFor | null {
  if (!raw || typeof raw !== 'object') {
    return null
  }

  const value = raw as Record<string, unknown>
  const idCandidate = value.id ?? value.serviceForId ?? value._id
  const id =
    typeof idCandidate === 'string' ? idCandidate : typeof idCandidate === 'number' ? String(idCandidate) : undefined
  const serviceFor = normalizeString(value.serviceFor)

  if (!id || !serviceFor) {
    return null
  }

  return {
    id,
    serviceFor,
    createdAt: normalizeString(value.createdAt),
    updatedAt: normalizeString(value.updatedAt),
  }
}

function extractArrayPayload(raw: unknown): unknown[] {
  if (Array.isArray(raw)) {
    return raw
  }

  if (!raw || typeof raw !== 'object') {
    return []
  }

  const record = raw as Record<string, unknown>
  if (Array.isArray(record.data)) {
    return record.data
  }

  if (record.data && typeof record.data === 'object') {
    const nested = record.data as Record<string, unknown>
    if (Array.isArray(nested.items)) {
      return nested.items
    }
  }

  if (Array.isArray(record.items)) {
    return record.items
  }

  return []
}

function extractEntityPayload(raw: unknown): unknown {
  if (!raw || typeof raw !== 'object') {
    return raw
  }

  const record = raw as Record<string, unknown>
  if (record.data && typeof record.data === 'object') {
    const nested = record.data as Record<string, unknown>
    return nested
  }

  return raw
}

export const serviceForService = {
  async list(): Promise<ServiceFor[]> {
    const { data } = await apiClient.get<unknown>(endpoint)
    return extractArrayPayload(data).map(normalizeServiceFor).filter((item): item is ServiceFor => Boolean(item))
  },

  async create(input: CreateServiceForInput): Promise<ServiceFor> {
    const payload = { serviceFor: input.serviceFor.trim() }
    const { data } = await apiClient.post<unknown>(endpoint, payload)
    return normalizeServiceFor(extractEntityPayload(data)) ?? (extractEntityPayload(data) as ServiceFor)
  },

  async update({ serviceForId, serviceFor }: UpdateServiceForInput): Promise<ServiceFor> {
    const { data } = await apiClient.patch<unknown>(`${endpoint}/${serviceForId}`, {
      serviceFor: serviceFor.trim(),
    })
    return normalizeServiceFor(extractEntityPayload(data)) ?? (extractEntityPayload(data) as ServiceFor)
  },

  async remove(serviceForId: string): Promise<void> {
    await apiClient.delete(`${endpoint}/${serviceForId}`)
  },
}
