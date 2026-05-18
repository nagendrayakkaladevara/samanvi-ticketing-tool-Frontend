import { useQuery } from '@tanstack/react-query'

import { notificationsService } from '@/features/notifications/api/notifications.service'
import { notificationQueryKeys } from '@/features/notifications/hooks/notification-query-keys'
import type { NotificationsListParams } from '@/features/notifications/types/notification'

type UseNotificationsQueryOptions = NotificationsListParams & {
  enabled?: boolean
}

export function useNotificationsQuery(options: UseNotificationsQueryOptions = {}) {
  const { enabled = true, page = 1, limit = 20, unreadOnly = false } = options

  return useQuery({
    queryKey: notificationQueryKeys.list(page, limit, unreadOnly),
    queryFn: () => notificationsService.list({ page, limit, unreadOnly }),
    enabled,
  })
}
