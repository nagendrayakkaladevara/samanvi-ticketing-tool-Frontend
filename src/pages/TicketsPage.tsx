import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Clock, Loader2, RefreshCw, Search } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { toast } from '@/lib/toast'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ticketsService } from '@/features/tickets/api/tickets.service'
import { useTicketsQuery } from '@/features/tickets/hooks/use-tickets-query'
import { TicketsListView } from '@/features/tickets/components/tickets-list-view'
import { getCreateTicketPath, getTicketDetailsPath } from '@/features/tickets/utils/ticket-routes'
import { useCurrentUser } from '@/hooks/use-current-user'
import { cn } from '@/lib/utils'

const TICKETS_AUTO_REFRESH_KEY = 'tickets-auto-refresh'

function readAutoRefreshPreference(): boolean {
  try {
    return window.localStorage.getItem(TICKETS_AUTO_REFRESH_KEY) === 'true'
  } catch {
    return false
  }
}

function persistAutoRefreshPreference(enabled: boolean) {
  try {
    window.localStorage.setItem(TICKETS_AUTO_REFRESH_KEY, String(enabled))
  } catch {
    // Ignore storage errors (private mode, quota, etc.)
  }
}

export function TicketsPage() {
  const [autoRefresh, setAutoRefresh] = useState(readAutoRefreshPreference)
  const { data: tickets = [], isLoading, isFetching, isError, error } = useTicketsQuery({ poll: autoRefresh })
  const navigate = useNavigate()
  const currentUser = useCurrentUser()
  const canCreateTicket = currentUser?.role === 'ADMIN' || currentUser?.role === 'SUPERVISOR'
  const [ticketNumberQuery, setTicketNumberQuery] = useState('')

  function toggleAutoRefresh() {
    setAutoRefresh((current) => {
      const next = !current
      persistAutoRefreshPreference(next)
      return next
    })
  }

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
          <div className="ticket-page__auto-refresh">
            <RefreshCw
              className={cn(
                'ticket-page__auto-refresh-icon',
                autoRefresh && isFetching && !isLoading && 'ticket-page__auto-refresh-icon--spin',
              )}
              aria-hidden
            />
            <span className="ticket-page__auto-refresh-label" id="tickets-auto-refresh-label">
              Auto refresh
            </span>
            <button
              type="button"
              role="switch"
              aria-checked={autoRefresh}
              aria-labelledby="tickets-auto-refresh-label"
              onClick={toggleAutoRefresh}
              className={cn(
                'ticket-page__auto-refresh-switch',
                autoRefresh && 'ticket-page__auto-refresh-switch--on',
              )}
            >
              <span className="ticket-page__auto-refresh-thumb" />
            </button>
          </div>
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
