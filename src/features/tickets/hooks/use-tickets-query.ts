import { useQuery } from '@tanstack/react-query'

import { ticketsService } from '@/features/tickets/api/tickets.service'

const TICKETS_POLL_INTERVAL_MS = 10_000

type UseTicketsQueryOptions = {
  /** When true, refetches the tickets list every 10s while this hook is mounted. */
  poll?: boolean
}

export function useTicketsQuery(options?: UseTicketsQueryOptions) {
  return useQuery({
    queryKey: ['tickets'],
    queryFn: () => ticketsService.list(),
    refetchInterval: options?.poll ? TICKETS_POLL_INTERVAL_MS : false,
    refetchIntervalInBackground: false,
  })
}
