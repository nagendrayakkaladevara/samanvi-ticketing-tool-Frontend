import { useQuery } from '@tanstack/react-query'

import { userHistoryService } from '@/features/user-history/api/user-history.service'
import type { UserTicketsQuery } from '@/features/user-history/types/user-history'

export function useUserTicketsQuery(userId: string, query: UserTicketsQuery) {
  return useQuery({
    queryKey: ['user-tickets', userId, query],
    queryFn: () => userHistoryService.listTickets(userId, query),
    enabled: Boolean(userId),
    placeholderData: (previous) => previous,
  })
}
