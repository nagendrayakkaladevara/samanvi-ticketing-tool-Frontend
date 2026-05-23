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

type FetchTicketsForFilterOptions = {
  days?: number
}

async function fetchTicketsForFilter(
  filter: TicketListFilter,
  options?: FetchTicketsForFilterOptions,
): Promise<Ticket[]> {
  const listOptions = options?.days !== undefined ? { days: options.days } : undefined

  if (filter === 'closed_resolved') {
    const [resolved, closed] = await Promise.all([
      ticketsService.list({ status: 'resolved', ...listOptions }),
      ticketsService.list({ status: 'closed', ...listOptions }),
    ])
    return [...resolved, ...closed].sort(compareTicketsNewestFirst)
  }

  if (isTicketListApiStatus(filter)) {
    return ticketsService.list({ status: filter, ...listOptions })
  }

  const allTickets = await ticketsService.list(listOptions)
  return applyTicketListVirtualFilter(allTickets, filter).sort(compareTicketsNewestFirst)
}

type UseFilteredTicketsQueryOptions = {
  days?: number
  enabled?: boolean
}

export function useFilteredTicketsQuery(filter: TicketListFilter, options?: UseFilteredTicketsQueryOptions) {
  const days = options?.days

  return useQuery({
    queryKey: ['tickets', 'filtered', filter, days],
    queryFn: () => fetchTicketsForFilter(filter, { days }),
    enabled: options?.enabled ?? true,
  })
}
