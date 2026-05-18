import { useMutation, useQueryClient } from '@tanstack/react-query'

import { notificationsService } from '@/features/notifications/api/notifications.service'
import { notificationQueryKeys } from '@/features/notifications/hooks/notification-query-keys'

export function useMarkNotificationReadMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (notificationId: string) => notificationsService.markRead(notificationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationQueryKeys.all })
    },
  })
}
