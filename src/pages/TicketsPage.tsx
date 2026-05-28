import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Clock, Loader2, Search } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { toast } from '@/lib/toast'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ticketsService } from '@/features/tickets/api/tickets.service'
import { useTicketsQuery } from '@/features/tickets/hooks/use-tickets-query'
import { useTicketsAutoRefresh } from '@/features/tickets/hooks/use-tickets-auto-refresh'
import { TicketsListView } from '@/features/tickets/components/tickets-list-view'
import { getCreateTicketPath, getTicketDetailsPath } from '@/features/tickets/utils/ticket-routes'
import { usePermissions } from '@/hooks/use-permissions'

export function TicketsPage() {
  const { autoRefresh } = useTicketsAutoRefresh()
  const { data: tickets = [], isLoading, isFetching, isError, error } = useTicketsQuery({ poll: autoRefresh })
  const navigate = useNavigate()
  const { can } = usePermissions()
  const canCreateTicket = can('tickets', '', 'create')
  const [ticketNumberQuery, setTicketNumberQuery] = useState('')

  const searchTicketMutation = useMutation({
    mutationFn: async (ticketNumber: string) => ticketsService.searchByTicketNumber(ticketNumber),
    onSuccess: (ticket) => {
      navigate(getTicketDetailsPath(ticket.id))
    },
    onError: (mutationError) => {
      toast.error(mutationError instanceof Error ? mutationError.message : 'Unable to find ticket.')
    },
  })

  function handleTicketSearch() {
    if (searchTicketMutation.isPending) {
      return
    }

    const trimmedTicketNumber = ticketNumberQuery.trim()
    if (!/^\d{4}$/.test(trimmedTicketNumber)) {
      toast.error('Enter a valid 4-digit ticket number.')
      return
    }

    searchTicketMutation.mutate(trimmedTicketNumber)
  }

  return (
    <section className="ticket-page">
      <header className="ticket-page__header">
        <div className="ticket-page__header-content">
          <h1 className="ticket-page__title">Tickets</h1>
          <p className="ticket-page__subtitle">
            Track and manage active issues across your fleet
          </p>
        </div>
        <div className="ticket-page__header-actions">
          <div className="ticket-page__search-row flex w-full max-w-sm items-center gap-2">
            <Input
              value={ticketNumberQuery}
              onChange={(event) => setTicketNumberQuery(event.target.value.replace(/\D/g, '').slice(0, 4))}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault()
                  handleTicketSearch()
                }
              }}
              inputMode="numeric"
              pattern="[0-9]{4}"
              maxLength={4}
              placeholder="Search ticket # (4 digits)"
              aria-label="Search ticket by number"
            />
            <Button
              type="button"
              variant="outline"
              onClick={handleTicketSearch}
              disabled={searchTicketMutation.isPending}
              className="gap-2"
            >
              {searchTicketMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
              Search
            </Button>
          </div>
          {canCreateTicket ? (
            <Button className="ticket-page__create-btn" onClick={() => navigate(getCreateTicketPath())}>
              Create Ticket
            </Button>
          ) : null}
          {autoRefresh && isFetching && !isLoading ? (
            <div className="ticket-page__refresh-indicator">
              <Clock className="ticket-page__refresh-icon" />
              <span>Syncing...</span>
            </div>
          ) : null}
        </div>
      </header>

      <TicketsListView
        tickets={tickets}
        isLoading={isLoading}
        isError={isError}
        error={error}
      />
    </section>
  )
}
