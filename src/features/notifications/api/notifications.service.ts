import { apiClient } from '@/lib/api/client'
import type {
  AppNotification,
  NotificationType,
  NotificationsListMeta,
  NotificationsListParams,
  NotificationsListResult,
} from '@/features/notifications/types/notification'

const endpoint = '/notifications'

const NOTIFICATION_TYPES: NotificationType[] = [
  'ticket_created',
  'ticket_assigned',
  'ticket_status_changed',
  'ticket_closed',
  'ticket_reopened',
  'ticket_commented',
]

function toRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : {}
}

function normalizeString(value: unknown, fallback = ''): string {
  if (typeof value !== 'string') {
    return fallback
  }

  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : fallback
}

function normalizeNullableString(value: unknown): string | null {
  if (value === null || value === undefined) {
    return null
  }

  const normalized = normalizeString(value)
  return normalized.length > 0 ? normalized : null
}

function normalizeNotificationType(value: unknown): NotificationType {
  if (typeof value === 'string' && NOTIFICATION_TYPES.includes(value as NotificationType)) {
    return value as NotificationType
  }

  return 'ticket_created'
}

function normalizeTicketNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value
  }

  if (typeof value === 'string' && value.trim().length > 0) {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : null
  }

  return null
}

function normalizeNotification(raw: unknown): AppNotification | null {
  const record = toRecord(raw)
  const id = normalizeString(record.id)

  if (!id) {
    return null
  }

  return {
    id,
    type: normalizeNotificationType(record.type),
    title: normalizeString(record.title, 'Notification'),
    message: normalizeString(record.message),
    ticketId: normalizeNullableString(record.ticketId),
    ticketNumber: normalizeTicketNumber(record.ticketNumber),
    activityLogId: normalizeNullableString(record.activityLogId),
    readAt: normalizeNullableString(record.readAt),
    createdAt: normalizeString(record.createdAt),
  }
}

function extractArrayPayload(raw: unknown): unknown[] {
  if (Array.isArray(raw)) {
    return raw
  }

  const record = toRecord(raw)
  if (Array.isArray(record.data)) {
    return record.data
  }

  return []
}

function extractEntityPayload(raw: unknown): unknown {
  const record = toRecord(raw)
  if (record.data !== undefined) {
    return record.data
  }

  return raw
}

function normalizeMeta(raw: unknown, fallback: NotificationsListParams): NotificationsListMeta {
  const record = toRecord(raw)

  const page = typeof record.page === 'number' ? record.page : (fallback.page ?? 1)
  const limit = typeof record.limit === 'number' ? record.limit : (fallback.limit ?? 20)
  const total = typeof record.total === 'number' ? record.total : 0
  const totalPages = typeof record.totalPages === 'number' ? record.totalPages : 0

  return { page, limit, total, totalPages }
}

export const notificationsService = {
  async list(params: NotificationsListParams = {}): Promise<NotificationsListResult> {
    const page = params.page ?? 1
    const limit = params.limit ?? 20

    const queryParams: Record<string, string | number> = { page, limit }
    if (params.unreadOnly) {
      queryParams.unreadOnly = 'true'
    }

    const { data } = await apiClient.get<unknown>(endpoint, { params: queryParams })
    const record = toRecord(data)
    const items = extractArrayPayload(data)
      .map(normalizeNotification)
      .filter((item): item is AppNotification => Boolean(item))

    return {
      items,
      meta: normalizeMeta(record.meta, { page, limit }),
    }
  },

  async getUnreadCount(): Promise<number> {
    const { data } = await apiClient.get<unknown>(`${endpoint}/unread-count`)
    const payload = extractEntityPayload(data)
    const record = toRecord(payload)

    if (typeof record.count === 'number') {
      return record.count
    }

    return 0
  },

  async markRead(notificationId: string): Promise<AppNotification> {
    const { data } = await apiClient.patch<unknown>(`${endpoint}/${notificationId}/read`)
    const normalized = normalizeNotification(extractEntityPayload(data))

    if (!normalized) {
      throw new Error('Invalid notification response.')
    }

    return normalized
  },

  async markAllRead(): Promise<number> {
    const { data } = await apiClient.patch<unknown>(`${endpoint}/read-all`)
    const payload = extractEntityPayload(data)
    const record = toRecord(payload)

    if (typeof record.updatedCount === 'number') {
      return record.updatedCount
    }

    return 0
  },
}
