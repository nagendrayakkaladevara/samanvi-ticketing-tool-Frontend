import { apiClient } from '@/lib/api/client'

export type DashboardSummary = {
  totalTickets: number
  openTickets: number
  inProgressTickets: number
  closedResolvedTickets: number
  overdueTickets: number
  priority: {
    high: number
    medium: number
    low: number
  }
}

function getRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : null
}

function pickNumber(record: Record<string, unknown> | null, keys: string[]): number | undefined {
  if (!record) {
    return undefined
  }

  for (const key of keys) {
    const candidate = record[key]
    if (typeof candidate === 'number' && Number.isFinite(candidate)) {
      return Math.max(0, candidate)
    }
  }

  return undefined
}

function extractPayload(raw: unknown): Record<string, unknown> {
  const root = getRecord(raw)
  if (!root) {
    return {}
  }

  const data = getRecord(root.data)
  return data ?? root
}

function normalizeSummary(raw: unknown): DashboardSummary {
  const payload = extractPayload(raw)
  const snapshot = getRecord(payload.snapshot)
  const queue = getRecord(payload.queue)
  const sla = getRecord(payload.sla)
  const ticketMetrics = getRecord(payload.ticketMetrics)
  const status = getRecord(payload.status)
  const priority = getRecord(payload.priority)
  const byPriority = getRecord(payload.ticketsByPriority)

  const totalTickets =
    pickNumber(snapshot, ['totalTickets', 'total', 'tickets']) ??
    pickNumber(ticketMetrics, ['totalTickets', 'total']) ??
    pickNumber(payload, ['totalTickets', 'total']) ??
    0

  const openTickets =
    pickNumber(snapshot, ['openTickets', 'open']) ??
    pickNumber(queue, ['openTickets', 'open']) ??
    pickNumber(status, ['open', 'created', 'assigned']) ??
    0

  const inProgressTickets =
    pickNumber(snapshot, ['inProgressTickets', 'inProgress']) ??
    pickNumber(queue, ['inProgressTickets', 'inProgress']) ??
    pickNumber(status, ['inProgress', 'in_progress']) ??
    0

  const closedResolvedTickets =
    pickNumber(snapshot, ['closedResolvedTickets', 'closedResolved', 'closedTickets']) ??
    ((pickNumber(status, ['closed']) ?? 0) + (pickNumber(status, ['resolved']) ?? 0))

  const overdueTickets =
    pickNumber(snapshot, ['overdueTickets', 'overdue']) ??
    pickNumber(sla, ['overdueTickets', 'overdueCount']) ??
    pickNumber(ticketMetrics, ['overdueCount']) ??
    0

  const high =
    pickNumber(priority, ['high']) ??
    pickNumber(byPriority, ['high', 'p1']) ??
    pickNumber(payload, ['highPriorityTickets']) ??
    0
  const medium =
    pickNumber(priority, ['medium']) ??
    pickNumber(byPriority, ['medium', 'p2']) ??
    pickNumber(payload, ['mediumPriorityTickets']) ??
    0
  const low =
    pickNumber(priority, ['low']) ??
    pickNumber(byPriority, ['low', 'p3']) ??
    pickNumber(payload, ['lowPriorityTickets']) ??
    0

  return {
    totalTickets,
    openTickets,
    inProgressTickets,
    closedResolvedTickets,
    overdueTickets,
    priority: {
      high,
      medium,
      low,
    },
  }
}

export const dashboardService = {
  async getAdminSummary(): Promise<DashboardSummary> {
    const { data } = await apiClient.get<unknown>('/dashboard/admin-summary')
    return normalizeSummary(data)
  },
}
