import { useQuery } from '@tanstack/react-query'

import { userHistoryService } from '@/features/user-history/api/user-history.service'

export function useUserHistoryQuery(userId: string, days: number, recentLimit = 5) {
  return useQuery({
    queryKey: ['user-history', userId, days, recentLimit],
    queryFn: () => userHistoryService.getHistory(userId, days, recentLimit),
    enabled: Boolean(userId),
    staleTime: 30_000,
    refetchInterval: 60_000,
  })
}
