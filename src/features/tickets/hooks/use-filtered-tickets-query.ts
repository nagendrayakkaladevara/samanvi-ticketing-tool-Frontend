import { useQuery } from '@tanstack/react-query'

import { ticketsService } from '@/features/tickets/api/tickets.service'
import type { Ticket } from '@/features/tickets/types/ticket'
import {
  applyTicketListVirtualFilter,
  isTicketListApiStatus,
  type TicketListFilter,
} from '@/features/tickets/utils/ticket-list-filter'

function compareTicketsNewestFirst(a: Ticket, b: Ticket): number {
  const dateA = a.createdAt ? new Date(a.createdAt).getTime() || 0 : 0
  const dateB = b.createdAt ? new Date(b.createdAt).getTime() || 0 : 0
  if (dateB !== dateA) {
    return dateB - dateA
  }
  return b.id.localeCompare(a.id)
}

async function fetchTicketsForFilter(filter: TicketListFilter): Promise<Ticket[]> {
  if (filter === 'closed_resolved') {
    const [resolved, closed] = await Promise.all([
      ticketsService.list({ status: 'resolved' }),
      ticketsService.list({ status: 'closed' }),
    ])
    return [...resolved, ...closed].sort(compareTicketsNewestFirst)
  }

  if (isTicketListApiStatus(filter)) {
    return ticketsService.list({ status: filter })
  }

  const allTickets = await ticketsService.list()
  return applyTicketListVirtualFilter(allTickets, filter).sort(compareTicketsNewestFirst)
}

type UseFilteredTicketsQueryOptions = {
  enabled?: boolean
}

export function useFilteredTicketsQuery(filter: TicketListFilter, options?: UseFilteredTicketsQueryOptions) {
  return useQuery({
    queryKey: ['tickets', 'filtered', filter],
    queryFn: () => fetchTicketsForFilter(filter),
    enabled: options?.enabled ?? true,
  })
}
