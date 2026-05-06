import { apiClient } from '@/lib/api/client'

export type DashboardLeaderboardAgent = {
  userId: string
  username: string
  displayName: string
  openAssignedCount: number
  resolvedInWindow: number
}

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
  trends?: {
    totalTicketsPct?: number
    openTicketsPct?: number
    inProgressTicketsPct?: number
    closedResolvedTicketsPct?: number
    overdueTicketsPct?: number
  }
  meta: {
    scope: string
    generatedAt?: string
    windowDays?: number
    windowFrom?: string
    windowTo?: string
  }
  snapshot: {
    newTicketsInWindow: number
    resolvedTicketsInWindow: number
    unassignedOpenTickets: number
    oldestOpenTicketAgeHours: number
    oldestOpenTicket?: {
      id: string
      ticketNumber: string
      priority: string
      status: string
    }
  }
  queue: {
    openByStatus: Record<string, number>
    openBySeverity: Record<string, number>
  }
  sla: {
    overdueOpenCount: number
    atRiskOpenCount: number
    resolvedWithinSlaCount: number
    resolvedInWindowCount: number
    slaCompliancePercent: number
  }
  speed: {
    averageResolutionTimeHours: number
  }
  leaderboard: DashboardLeaderboardAgent[]
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

function pickSignedNumber(record: Record<string, unknown> | null, keys: string[]): number | undefined {
  if (!record) {
    return undefined
  }

  for (const key of keys) {
    const candidate = record[key]
    if (typeof candidate === 'number' && Number.isFinite(candidate)) {
      return candidate
    }
  }

  return undefined
}

function pickTrendPercent(record: Record<string, unknown> | null, metricKeys: string[]): number | undefined {
  if (!record) {
    return undefined
  }

  for (const metricKey of metricKeys) {
    const nested = getRecord(record[metricKey])
    const direct =
      pickSignedNumber(nested, ['deltaPercent', 'changePercent', 'percentageChange', 'pctChange']) ??
      pickSignedNumber(nested, ['deltaPct', 'changePct']) ??
      pickSignedNumber(nested, ['trendPercent'])

    if (typeof direct === 'number') {
      return direct
    }
  }

  return pickSignedNumber(record, metricKeys)
}

function extractCountMap(record: Record<string, unknown> | null): Record<string, number> {
  if (!record) {
    return {}
  }

  const normalized: Record<string, number> = {}
  for (const [key, value] of Object.entries(record)) {
    if (typeof value === 'number' && Number.isFinite(value)) {
      normalized[key] = Math.max(0, value)
    }
  }
  return normalized
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
  const openByPriority = getRecord(queue?.openByPriority)
  const openByStatus = getRecord(queue?.openByStatus)
  const openBySeverity = getRecord(queue?.openBySeverity)
  const speed = getRecord(payload.speed)
  const window = getRecord(payload.window)
  const oldestOpenTicketRaw = getRecord(snapshot?.oldestOpenTicket)
  const leaderboardRaw = Array.isArray(payload.agentLeaderboard) ? payload.agentLeaderboard : []
  const snapshotOpen = pickNumber(snapshot, ['openTickets'])
  const snapshotClosed = pickNumber(snapshot, ['closedTickets'])
  const totalFromSnapshot =
    typeof snapshotOpen === 'number' || typeof snapshotClosed === 'number'
      ? (snapshotOpen ?? 0) + (snapshotClosed ?? 0)
      : undefined
  const openByStatusTotal = openByStatus
    ? (pickNumber(openByStatus, ['created']) ?? 0) +
      (pickNumber(openByStatus, ['assigned']) ?? 0) +
      (pickNumber(openByStatus, ['in_progress']) ?? 0) +
      (pickNumber(openByStatus, ['reopened']) ?? 0) +
      (pickNumber(openByStatus, ['blocked']) ?? 0)
    : undefined

  const totalTickets =
    pickNumber(snapshot, ['totalTickets', 'total', 'tickets']) ??
    totalFromSnapshot ??
    pickNumber(ticketMetrics, ['totalTickets', 'total']) ??
    pickNumber(payload, ['totalTickets', 'total']) ??
    0

  const openTickets =
    pickNumber(snapshot, ['openTickets', 'open']) ??
    pickNumber(queue, ['openTickets', 'open']) ??
    openByStatusTotal ??
    pickNumber(status, ['open', 'created', 'assigned']) ??
    0

  const inProgressTickets =
    pickNumber(snapshot, ['inProgressTickets', 'inProgress']) ??
    pickNumber(queue, ['inProgressTickets', 'inProgress']) ??
    pickNumber(openByStatus, ['in_progress']) ??
    pickNumber(status, ['inProgress', 'in_progress']) ??
    0

  const closedResolvedTickets =
    pickNumber(snapshot, ['closedResolvedTickets', 'closedResolved', 'closedTickets', 'resolvedTicketsInWindow']) ??
    ((pickNumber(status, ['closed']) ?? 0) + (pickNumber(status, ['resolved']) ?? 0))

  const overdueTickets =
    pickNumber(snapshot, ['overdueTickets', 'overdue']) ??
    pickNumber(sla, ['overdueTickets', 'overdueCount', 'overdueOpenCount']) ??
    pickNumber(ticketMetrics, ['overdueCount']) ??
    0

  const high =
    pickNumber(priority, ['high']) ??
    pickNumber(byPriority, ['high', 'p1']) ??
    pickNumber(openByPriority, ['high', 'p1']) ??
    pickNumber(payload, ['highPriorityTickets']) ??
    0
  const medium =
    pickNumber(priority, ['medium']) ??
    pickNumber(byPriority, ['medium', 'p2']) ??
    pickNumber(openByPriority, ['medium', 'p2']) ??
    pickNumber(payload, ['mediumPriorityTickets']) ??
    0
  const low =
    pickNumber(priority, ['low']) ??
    pickNumber(byPriority, ['low', 'p3']) ??
    pickNumber(openByPriority, ['low', 'p3']) ??
    pickNumber(payload, ['lowPriorityTickets']) ??
    0

  const trends = {
    totalTicketsPct:
      pickTrendPercent(snapshot, ['totalTicketsChangePercent', 'totalChangePercent', 'totalTicketsPct']) ??
      pickTrendPercent(payload, ['totalTicketsChangePercent']),
    openTicketsPct:
      pickTrendPercent(snapshot, ['openTicketsChangePercent', 'openChangePercent', 'openTicketsPct']) ??
      pickTrendPercent(queue, ['openTicketsChangePercent', 'openChangePercent']) ??
      pickTrendPercent(payload, ['openTicketsChangePercent']),
    inProgressTicketsPct:
      pickTrendPercent(snapshot, ['inProgressTicketsChangePercent', 'inProgressChangePercent', 'inProgressTicketsPct']) ??
      pickTrendPercent(queue, ['inProgressTicketsChangePercent', 'inProgressChangePercent']) ??
      pickTrendPercent(payload, ['inProgressTicketsChangePercent']),
    closedResolvedTicketsPct:
      pickTrendPercent(snapshot, [
        'closedResolvedTicketsChangePercent',
        'closedResolvedChangePercent',
        'resolvedTicketsChangePercent',
      ]) ??
      pickTrendPercent(speed, ['resolvedChangePercent', 'throughputChangePercent']) ??
      pickTrendPercent(payload, ['closedResolvedTicketsChangePercent', 'resolvedTicketsChangePercent']),
    overdueTicketsPct:
      pickTrendPercent(snapshot, ['overdueTicketsChangePercent', 'overdueChangePercent', 'overdueTicketsPct']) ??
      pickTrendPercent(sla, ['overdueChangePercent', 'overdueTicketsChangePercent']) ??
      pickTrendPercent(payload, ['overdueTicketsChangePercent']),
  }

  const leaderboard: DashboardLeaderboardAgent[] = leaderboardRaw
    .map((entry) => {
      const item = getRecord(entry)
      if (!item) {
        return null
      }

      const userId = typeof item.userId === 'string' ? item.userId : ''
      if (!userId) {
        return null
      }

      return {
        userId,
        username: typeof item.username === 'string' ? item.username : '-',
        displayName: typeof item.displayName === 'string' ? item.displayName : 'Unknown',
        openAssignedCount: pickNumber(item, ['openAssignedCount']) ?? 0,
        resolvedInWindow: pickNumber(item, ['resolvedInWindow']) ?? 0,
      }
    })
    .filter((entry): entry is DashboardLeaderboardAgent => Boolean(entry))

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
    trends,
    meta: {
      scope: typeof payload.scope === 'string' ? payload.scope : 'unknown',
      generatedAt: typeof payload.generatedAt === 'string' ? payload.generatedAt : undefined,
      windowDays: pickNumber(window, ['days']),
      windowFrom: typeof window?.fromInclusive === 'string' ? window.fromInclusive : undefined,
      windowTo: typeof window?.toInclusive === 'string' ? window.toInclusive : undefined,
    },
    snapshot: {
      newTicketsInWindow: pickNumber(snapshot, ['newTicketsInWindow']) ?? 0,
      resolvedTicketsInWindow: pickNumber(snapshot, ['resolvedTicketsInWindow']) ?? 0,
      unassignedOpenTickets: pickNumber(snapshot, ['unassignedOpenTickets']) ?? 0,
      oldestOpenTicketAgeHours: pickNumber(snapshot, ['oldestOpenTicketAgeHours']) ?? 0,
      oldestOpenTicket:
        oldestOpenTicketRaw && typeof oldestOpenTicketRaw.id === 'string'
          ? {
              id: oldestOpenTicketRaw.id,
              ticketNumber:
                typeof oldestOpenTicketRaw.ticketNumber === 'number'
                  ? String(oldestOpenTicketRaw.ticketNumber)
                  : typeof oldestOpenTicketRaw.ticketNumber === 'string'
                    ? oldestOpenTicketRaw.ticketNumber
                    : '-',
              priority: typeof oldestOpenTicketRaw.priority === 'string' ? oldestOpenTicketRaw.priority : '-',
              status: typeof oldestOpenTicketRaw.status === 'string' ? oldestOpenTicketRaw.status : '-',
            }
          : undefined,
    },
    queue: {
      openByStatus: extractCountMap(openByStatus),
      openBySeverity: extractCountMap(openBySeverity),
    },
    sla: {
      overdueOpenCount: pickNumber(sla, ['overdueOpenCount', 'overdueTickets', 'overdueCount']) ?? 0,
      atRiskOpenCount: pickNumber(sla, ['atRiskOpenCount']) ?? 0,
      resolvedWithinSlaCount: pickNumber(sla, ['resolvedWithinSlaCount']) ?? 0,
      resolvedInWindowCount: pickNumber(sla, ['resolvedInWindowCount']) ?? 0,
      slaCompliancePercent: pickNumber(sla, ['slaCompliancePercent']) ?? 0,
    },
    speed: {
      averageResolutionTimeHours: pickNumber(speed, ['averageResolutionTimeHours']) ?? 0,
    },
    leaderboard,
  }
}

export const dashboardService = {
  async getAdminSummary(): Promise<DashboardSummary> {
    const { data } = await apiClient.get<unknown>('/dashboard/admin-summary')
    return normalizeSummary(data)
  },
}
