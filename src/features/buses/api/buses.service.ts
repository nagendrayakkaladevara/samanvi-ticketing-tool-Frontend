import { apiClient } from '@/lib/api/client'
import type { Bus, BusHistoryTicket, CreateBusInput } from '@/features/buses/types/bus'

const endpoint = '/buses'

function normalizeString(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : undefined
}

function normalizeBus(raw: unknown): Bus | null {
  if (!raw || typeof raw !== 'object') {
    return null
  }

  const value = raw as Record<string, unknown>
  const idCandidate = value.id ?? value.busId ?? value._id
  const id =
    typeof idCandidate === 'string' ? idCandidate : typeof idCandidate === 'number' ? String(idCandidate) : undefined
  const busNumber =
    normalizeString(value.busNumber) ??
    normalizeString(value.bus_no) ??
    normalizeString(value.busNo) ??
    normalizeString(value.number)

  if (!id || !busNumber) {
    return null
  }

  return {
    id,
    busNumber,
    lastMaintenanceDate:
      normalizeString(value.lastMaintenanceDate) ??
      normalizeString(value.last_maintenance_date) ??
      normalizeString(value.maintenanceDate),
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
    if (Array.isArray(nested.buses)) {
      return nested.buses
    }
    if (Array.isArray(nested.items)) {
      return nested.items
    }
  }

  if (Array.isArray(record.buses)) {
    return record.buses
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
    return nested.bus ?? nested
  }

  return record.bus ?? raw
}

export const busesService = {
  async list(): Promise<Bus[]> {
    const { data } = await apiClient.get<unknown>(endpoint)
    return extractArrayPayload(data).map(normalizeBus).filter((bus): bus is Bus => Boolean(bus))
  },

  async create(input: CreateBusInput): Promise<Bus> {
    const payload = {
      busNumber: input.busNumber.trim(),
      ...(input.lastMaintenanceDate ? { lastMaintenanceDate: input.lastMaintenanceDate } : {}),
    }
    const { data } = await apiClient.post<unknown>(endpoint, payload)
    return normalizeBus(extractEntityPayload(data)) ?? (extractEntityPayload(data) as Bus)
  },

  async listTicketHistory(busId: string): Promise<BusHistoryTicket[]> {
    const { data } = await apiClient.get<unknown>(`${endpoint}/${busId}/tickets`)
    return extractArrayPayload(data)
      .map((item) => normalizeBusHistoryTicket(item))
      .filter((ticket): ticket is BusHistoryTicket => Boolean(ticket))
  },
}

function normalizeBusHistoryTicket(raw: unknown): BusHistoryTicket | null {
  if (!raw || typeof raw !== 'object') {
    return null
  }

  const value = raw as Record<string, unknown>
  const idCandidate = value.id ?? value.ticketId ?? value._id
  const id = typeof idCandidate === 'string' ? idCandidate : typeof idCandidate === 'number' ? String(idCandidate) : null
  const title = normalizeString(value.title)
  if (!id || !title) {
    return null
  }

  const rawStatus = normalizeString(value.status)?.toUpperCase() ?? 'CREATED'
  const status: BusHistoryTicket['status'] =
    rawStatus === 'ASSIGNED' ||
    rawStatus === 'IN_PROGRESS' ||
    rawStatus === 'BLOCKED' ||
    rawStatus === 'RESOLVED' ||
    rawStatus === 'CLOSED' ||
    rawStatus === 'REOPENED'
      ? rawStatus
      : 'CREATED'

  const rawSeverity = normalizeString(value.severity)?.toUpperCase() ?? 'LOW'
  const severity: BusHistoryTicket['severity'] =
    rawSeverity === 'CRITICAL' || rawSeverity === 'HIGH' || rawSeverity === 'MEDIUM' ? rawSeverity : 'LOW'

  const rawPriority = normalizeString(value.priority)?.toUpperCase() ?? 'P3'
  const priority: BusHistoryTicket['priority'] = rawPriority === 'P1' || rawPriority === 'P2' ? rawPriority : 'P3'

  return {
    id,
    title,
    status,
    severity,
    priority,
    assignedToName:
      normalizeString(value.assignedToName) ??
      normalizeString(value.assigneeName) ??
      (value.assignedTo && typeof value.assignedTo === 'object'
        ? normalizeString((value.assignedTo as Record<string, unknown>).displayName) ??
          normalizeString((value.assignedTo as Record<string, unknown>).name)
        : undefined),
    createdAt: normalizeString(value.createdAt) ?? normalizeString(value.created_at),
  }
}
