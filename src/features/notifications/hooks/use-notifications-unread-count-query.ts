import { useQuery } from '@tanstack/react-query'

import { notificationsService } from '@/features/notifications/api/notifications.service'
import { notificationQueryKeys } from '@/features/notifications/hooks/notification-query-keys'

const UNREAD_COUNT_POLL_INTERVAL_MS = 30_000

export function useNotificationsUnreadCountQuery() {
  return useQuery({
    queryKey: notificationQueryKeys.unreadCount(),
    queryFn: notificationsService.getUnreadCount,
    refetchInterval: UNREAD_COUNT_POLL_INTERVAL_MS,
    refetchOnWindowFocus: true,
  })
}
