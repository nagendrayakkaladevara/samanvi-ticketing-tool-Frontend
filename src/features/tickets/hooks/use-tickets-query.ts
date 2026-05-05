import { useQuery } from '@tanstack/react-query'

import { ticketsService } from '@/features/tickets/api/tickets.service'

export function useTicketsQuery() {
  return useQuery({
    queryKey: ['tickets'],
    queryFn: ticketsService.list,
  })
}
