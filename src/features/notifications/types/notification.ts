export type NotificationType =
  | 'ticket_created'
  | 'ticket_assigned'
  | 'ticket_status_changed'
  | 'ticket_closed'
  | 'ticket_reopened'
  | 'ticket_commented'

export type AppNotification = {
  id: string
  type: NotificationType
  title: string
  message: string
  ticketId: string | null
  ticketNumber: number | null
  activityLogId: string | null
  readAt: string | null
  createdAt: string
}

export type NotificationsListMeta = {
  page: number
  limit: number
  total: number
  totalPages: number
}

export type NotificationsListResult = {
  items: AppNotification[]
  meta: NotificationsListMeta
}

export type NotificationsListParams = {
  page?: number
  limit?: number
  unreadOnly?: boolean
}
