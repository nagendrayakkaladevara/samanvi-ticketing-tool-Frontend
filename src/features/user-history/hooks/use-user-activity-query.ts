import { useQuery } from '@tanstack/react-query'

import { userHistoryService } from '@/features/user-history/api/user-history.service'

export function useUserActivityQuery(userId: string, page: number, limit = 20) {
  return useQuery({
    queryKey: ['user-activity', userId, page, limit],
    queryFn: () => userHistoryService.listActivity(userId, page, limit),
    enabled: Boolean(userId),
    placeholderData: (previous) => previous,
  })
}
