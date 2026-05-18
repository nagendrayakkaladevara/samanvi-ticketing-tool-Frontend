import type { NotificationsListParams } from '@/features/notifications/types/notification'

export const notificationQueryKeys = {
  all: ['notifications'] as const,
  unreadCount: () => [...notificationQueryKeys.all, 'unread-count'] as const,
  list: (params: NotificationsListParams) => [...notificationQueryKeys.all, 'list', params] as const,
}
