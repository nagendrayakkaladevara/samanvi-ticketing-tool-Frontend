import { useQuery } from '@tanstack/react-query'

import { busesService } from '@/features/buses/api/buses.service'

export function useBusTicketHistoryQuery(busId: string) {
  return useQuery({
    queryKey: ['bus-ticket-history', busId],
    queryFn: () => busesService.listTicketHistory(busId),
    enabled: Boolean(busId),
  })
}
