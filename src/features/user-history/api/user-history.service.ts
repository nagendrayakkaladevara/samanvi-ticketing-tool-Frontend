import { apiClient } from '@/lib/api/client'
import { getDisplayTicketNumber, isInternalRecordId } from '@/features/user-history/utils/format'
import type {
  ActivityItem,
  PaginationMeta,
  RoleCodeApi,
  TicketActivityType,
  TicketPriorityApi,
  TicketRelation,
  TicketSeverityApi,
  TicketStatusApi,
  UserActivityResult,
  UserHistorySnapshot,
  UserMetrics,
  UserSummary,
  UserTicketItem,
  UserTicketsQuery,
  UserTicketsResult,
} from '@/features/user-history/types/user-history'

function getRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : null
}

function pickString(record: Record<string, unknown> | null, keys: string[]): string | undefined {
  if (!record) return undefined
  for (const key of keys) {
    const candidate = record[key]
    if (typeof candidate === 'string' && candidate.trim()) {
      return candidate.trim()
    }
  }
  return undefined
}

function pickNumber(record: Record<string, unknown> | null, keys: string[], fallback = 0): number {
  if (!record) return fallback
  for (const key of keys) {
    const candidate = record[key]
    if (typeof candidate === 'number' && Number.isFinite(candidate)) {
      return candidate
    }
  }
  return fallback
}

function pickNullableNumber(record: Record<string, unknown> | null, keys: string[]): number | null {
  if (!record) return null
  for (const key of keys) {
    const candidate = record[key]
    if (candidate === null) return null
    if (typeof candidate === 'number' && Number.isFinite(candidate)) {
      return candidate
    }
  }
  return null
}

function extractDataPayload(raw: unknown): Record<string, unknown> | null {
  const root = getRecord(raw)
  if (!root) return null

  const data = getRecord(root.data) ?? root
  return data
}

function normalizeRoleCode(raw: unknown): RoleCodeApi {
  const value = typeof raw === 'string' ? raw.trim().toLowerCase() : ''
  if (value === 'admin' || value === 'supervisor' || value === 'worker') {
    return value
  }
  return 'worker'
}

function normalizeUserSummary(raw: unknown): UserSummary | null {
  const record = getRecord(raw)
  if (!record) return null

  const id = pickString(record, ['id', 'userId'])
  if (!id) return null

  const roleRecord = getRecord(record.role)
  const code = normalizeRoleCode(roleRecord?.code ?? record.roleCode ?? record.role)
  const label =
    pickString(roleRecord, ['label', 'name']) ??
    (code === 'admin' ? 'Admin' : code === 'supervisor' ? 'Supervisor' : 'Worker')

  return {
    id,
    username: pickString(record, ['username']) ?? id,
    displayName: pickString(record, ['displayName', 'name']) ?? id,
    role: { code, label },
  }
}

function normalizeTicketStatus(raw: unknown): TicketStatusApi {
  const value = typeof raw === 'string' ? raw.trim().toLowerCase() : ''
  const allowed: TicketStatusApi[] = [
    'created',
    'assigned',
    'in_progress',
    'blocked',
    'resolved',
    'closed',
    'reopened',
  ]
  return allowed.includes(value as TicketStatusApi) ? (value as TicketStatusApi) : 'created'
}

function normalizeSeverity(raw: unknown): TicketSeverityApi {
  const value = typeof raw === 'string' ? raw.trim().toLowerCase() : ''
  if (value === 'critical' || value === 'high' || value === 'medium' || value === 'low') {
    return value
  }
  return 'medium'
}

function normalizePriority(raw: unknown): TicketPriorityApi {
  const value = typeof raw === 'string' ? raw.trim().toLowerCase() : ''
  if (value === 'p1' || value === 'p2' || value === 'p3') {
    return value
  }
  return 'p2'
}

function normalizePerson(raw: unknown): { id: string; username: string; displayName: string } | null {
  const record = getRecord(raw)
  if (!record) return null

  const id = pickString(record, ['id', 'userId'])
  if (!id) return null

  const username = pickString(record, ['username']) ?? id
  const displayName = pickString(record, ['displayName', 'name']) ?? username

  return { id, username, displayName }
}

function normalizeTicketItem(raw: unknown): UserTicketItem | null {
  const record = getRecord(raw)
  if (!record) return null

  const id = pickString(record, ['id', 'ticketId'])
  if (!id) return null

  const busRecord = getRecord(record.bus)
  const categoryRecord = getRecord(record.category)
  const createdBy = normalizePerson(record.createdBy ?? record.createdByUser)
  const assignedTo = normalizePerson(record.assignedTo ?? record.assignedToUser)

  return {
    id,
    ticketNumber: pickString(record, ['ticketNumber', 'number']) ?? id,
    title: pickString(record, ['title']) ?? 'Untitled ticket',
    status: normalizeTicketStatus(record.status),
    severity: normalizeSeverity(record.severity),
    priority: normalizePriority(record.priority),
    slaDueAt: pickString(record, ['slaDueAt']) ?? '',
    assignedAt: pickString(record, ['assignedAt']) ?? null,
    resolvedAt: pickString(record, ['resolvedAt']) ?? null,
    closedAt: pickString(record, ['closedAt']) ?? null,
    reopenedCount: pickNumber(record, ['reopenedCount']),
    createdAt: pickString(record, ['createdAt']) ?? '',
    updatedAt: pickString(record, ['updatedAt']) ?? '',
    bus: {
      id: pickString(busRecord, ['id', 'busId']) ?? '',
      busNumber: pickString(busRecord, ['busNumber', 'number']) ?? '—',
    },
    category: {
      id: pickString(categoryRecord, ['id', 'categoryId']) ?? '',
      name: pickString(categoryRecord, ['name']) ?? '—',
    },
    createdBy: createdBy ?? { id: '', username: '—', displayName: '—' },
    assignedTo,
    isOverdue: Boolean(record.isOverdue),
    overdueDurationMs: pickNumber(record, ['overdueDurationMs']),
  }
}

function normalizeActivityItem(raw: unknown): ActivityItem | null {
  const record = getRecord(raw)
  if (!record) return null

  const id = pickString(record, ['id', 'activityId'])
  if (!id) return null

  const ticketRecord = getRecord(record.ticket)
  const ticketId = pickString(ticketRecord, ['id', 'ticketId'])
  if (!ticketId || !ticketRecord) return null

  const actionRaw = pickString(record, ['actionType', 'action']) ?? 'commented'
  const allowed: TicketActivityType[] = [
    'created',
    'assigned',
    'status_changed',
    'commented',
    'reopened',
    'closed',
  ]
  const actionType = allowed.includes(actionRaw as TicketActivityType)
    ? (actionRaw as TicketActivityType)
    : 'commented'

  const busRecord = getRecord(ticketRecord.bus)

  return {
    id,
    actionType,
    fromStatus: record.fromStatus != null ? normalizeTicketStatus(record.fromStatus) : null,
    toStatus: record.toStatus != null ? normalizeTicketStatus(record.toStatus) : null,
    note: (() => {
      const raw = pickString(record, ['note']) ?? null
      if (!raw || raw === ticketId || isInternalRecordId(raw)) return null
      return raw
    })(),
    createdAt: pickString(record, ['createdAt']) ?? '',
    ticket: {
      id: ticketId,
      ticketNumber:
        getDisplayTicketNumber(
          pickString(ticketRecord, ['ticketNumber', 'number']) ?? '',
          ticketId,
        ) ?? '',
      title: pickString(ticketRecord, ['title']) ?? 'Ticket',
      status: normalizeTicketStatus(ticketRecord.status),
      bus: {
        busNumber: pickString(busRecord, ['busNumber', 'number']) ?? '—',
      },
    },
  }
}

function normalizeStatusBreakdown(raw: unknown): Partial<Record<TicketStatusApi, number>> {
  const record = getRecord(raw)
  if (!record) return {}

  const result: Partial<Record<TicketStatusApi, number>> = {}
  for (const [key, value] of Object.entries(record)) {
    if (typeof value === 'number' && Number.isFinite(value)) {
      result[normalizeTicketStatus(key)] = value
    }
  }
  return result
}

function normalizeMetrics(raw: unknown): UserMetrics {
  const record = getRecord(raw)
  const windowRecord = getRecord(record?.window)
  const assignedRecord = getRecord(record?.assigned)
  const createdRecord = getRecord(record?.created)
  const actedOnRecord = getRecord(record?.actedOn)

  const resolvedPerDayRaw = Array.isArray(assignedRecord?.resolvedPerDay) ? assignedRecord.resolvedPerDay : []

  return {
    window: {
      days: pickNumber(windowRecord, ['days']),
      fromInclusive: pickString(windowRecord, ['fromInclusive', 'from']) ?? '',
      toInclusive: pickString(windowRecord, ['toInclusive', 'to']) ?? '',
    },
    assigned: {
      totalCount: pickNumber(assignedRecord, ['totalCount']),
      openCount: pickNumber(assignedRecord, ['openCount']),
      overdueOpenCount: pickNumber(assignedRecord, ['overdueOpenCount']),
      resolvedAllTimeCount: pickNumber(assignedRecord, ['resolvedAllTimeCount']),
      resolvedInWindowCount: pickNumber(assignedRecord, ['resolvedInWindowCount']),
      resolvedPerDay: resolvedPerDayRaw
        .map((entry) => {
          const dayRecord = getRecord(entry)
          const date = pickString(dayRecord, ['date'])
          if (!date) return null
          return { date, count: pickNumber(dayRecord, ['count']) }
        })
        .filter((entry): entry is { date: string; count: number } => entry !== null),
      averageResolutionTimeMs: pickNullableNumber(assignedRecord, ['averageResolutionTimeMs']),
      slaCompliancePercent: pickNullableNumber(assignedRecord, ['slaCompliancePercent']),
    },
    created: {
      totalCount: pickNumber(createdRecord, ['totalCount']),
    },
    actedOn: {
      distinctTicketCount: pickNumber(actedOnRecord, ['distinctTicketCount']),
      activityCount: pickNumber(actedOnRecord, ['activityCount']),
    },
  }
}

function normalizePaginationMeta(raw: unknown, fallbackPage: number, fallbackLimit: number): PaginationMeta {
  const record = getRecord(raw)
  const page = pickNumber(record, ['page'], fallbackPage)
  const limit = pickNumber(record, ['limit'], fallbackLimit)
  const total = pickNumber(record, ['total'])
  const totalPages = pickNumber(record, ['totalPages'], Math.max(1, Math.ceil(total / Math.max(limit, 1))))

  return { page, limit, total, totalPages }
}

function normalizeHistorySnapshot(raw: unknown): UserHistorySnapshot {
  const data = extractDataPayload(raw)
  const user = normalizeUserSummary(data?.user) ?? {
    id: '',
    username: '',
    displayName: 'Unknown user',
    role: { code: 'worker' as RoleCodeApi, label: 'Worker' },
  }

  const countsRecord = getRecord(data?.ticketCounts)
  const statusRecord = getRecord(data?.ticketsByStatus)
  const recentRecord = getRecord(data?.recent)

  const assignedTicketsRaw = Array.isArray(recentRecord?.assignedTickets) ? recentRecord.assignedTickets : []
  const createdTicketsRaw = Array.isArray(recentRecord?.createdTickets) ? recentRecord.createdTickets : []
  const activityRaw = Array.isArray(recentRecord?.activity) ? recentRecord.activity : []

  const assignedStatusRecord = getRecord(statusRecord?.assigned)
  const createdStatusRecord = getRecord(statusRecord?.created)

  return {
    user,
    generatedAt: pickString(data, ['generatedAt']) ?? new Date().toISOString(),
    ticketCounts: {
      assigned: pickNumber(countsRecord, ['assigned']),
      created: pickNumber(countsRecord, ['created']),
      actedOn: pickNumber(countsRecord, ['actedOn']),
    },
    ticketsByStatus: {
      assigned: normalizeStatusBreakdown(assignedStatusRecord),
      created: normalizeStatusBreakdown(createdStatusRecord),
    },
    metrics: normalizeMetrics(data?.metrics),
    recent: {
      assignedTickets: assignedTicketsRaw
        .map(normalizeTicketItem)
        .filter((item): item is UserTicketItem => item !== null),
      createdTickets: createdTicketsRaw
        .map(normalizeTicketItem)
        .filter((item): item is UserTicketItem => item !== null),
      activity: activityRaw
        .map(normalizeActivityItem)
        .filter((item): item is ActivityItem => item !== null),
    },
  }
}

function normalizeTicketsResult(raw: unknown, relation: TicketRelation, page: number, limit: number): UserTicketsResult {
  const data = extractDataPayload(raw)
  const root = getRecord(raw)
  const metaSource = getRecord(root?.meta) ?? getRecord(data?.meta) ?? root

  const itemsRaw = Array.isArray(data?.items) ? data.items : []

  return {
    userId: pickString(data, ['userId']) ?? '',
    relation: (pickString(data, ['relation']) as TicketRelation) ?? relation,
    items: itemsRaw.map(normalizeTicketItem).filter((item): item is UserTicketItem => item !== null),
    meta: normalizePaginationMeta(metaSource, page, limit),
  }
}

function normalizeActivityResult(raw: unknown, page: number, limit: number): UserActivityResult {
  const data = extractDataPayload(raw)
  const root = getRecord(raw)
  const metaSource = getRecord(root?.meta) ?? getRecord(data?.meta) ?? root
  const itemsRaw = Array.isArray(data?.items) ? data.items : []

  return {
    userId: pickString(data, ['userId']) ?? '',
    items: itemsRaw.map(normalizeActivityItem).filter((item): item is ActivityItem => item !== null),
    meta: normalizePaginationMeta(metaSource, page, limit),
  }
}

export const userHistoryService = {
  async getHistory(userId: string, days = 14, recentLimit = 5): Promise<UserHistorySnapshot> {
    const response = await apiClient.get(`/users/${encodeURIComponent(userId)}/history`, {
      params: { days, recentLimit },
    })
    return normalizeHistorySnapshot(response.data)
  },

  async getMetrics(userId: string, days = 14): Promise<{ user: UserSummary; generatedAt: string; metrics: UserMetrics }> {
    const response = await apiClient.get(`/users/${encodeURIComponent(userId)}/metrics`, {
      params: { days },
    })
    const data = extractDataPayload(response.data)
    return {
      user: normalizeUserSummary(data?.user) ?? {
        id: userId,
        username: userId,
        displayName: userId,
        role: { code: 'worker', label: 'Worker' },
      },
      generatedAt: pickString(data, ['generatedAt']) ?? new Date().toISOString(),
      metrics: normalizeMetrics(data?.metrics),
    }
  },

  async listTickets(userId: string, query: UserTicketsQuery = {}): Promise<UserTicketsResult> {
    const relation = query.relation ?? 'assigned'
    const page = query.page ?? 1
    const limit = query.limit ?? 20

    const response = await apiClient.get(`/users/${encodeURIComponent(userId)}/tickets`, {
      params: {
        relation,
        page,
        limit,
        ...(query.status ? { status: query.status } : {}),
        ...(query.severity ? { severity: query.severity } : {}),
        ...(query.priority ? { priority: query.priority } : {}),
        ...(query.categoryId ? { categoryId: query.categoryId } : {}),
        ...(query.busId ? { busId: query.busId } : {}),
      },
    })

    return normalizeTicketsResult(response.data, relation, page, limit)
  },

  async listActivity(userId: string, page = 1, limit = 20): Promise<UserActivityResult> {
    const response = await apiClient.get(`/users/${encodeURIComponent(userId)}/activity`, {
      params: { page, limit },
    })
    return normalizeActivityResult(response.data, page, limit)
  },
}
