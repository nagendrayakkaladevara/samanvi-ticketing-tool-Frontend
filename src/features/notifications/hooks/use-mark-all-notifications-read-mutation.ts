import { useMutation, useQueryClient } from '@tanstack/react-query'

import { notificationsService } from '@/features/notifications/api/notifications.service'
import { notificationQueryKeys } from '@/features/notifications/hooks/notification-query-keys'

export function useMarkAllNotificationsReadMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => notificationsService.markAllRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationQueryKeys.all })
    },
  })
}
