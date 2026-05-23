import { ArrowLeft } from 'lucide-react'
import { Link, Navigate, useParams, useSearchParams } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { useScrollToTop } from '@/hooks/use-scroll-to-top'
import { TicketsListView } from '@/features/tickets/components/tickets-list-view'
import { useFilteredTicketsQuery } from '@/features/tickets/hooks/use-filtered-tickets-query'
import {
  formatTicketListWindowLabel,
  getTicketListFilterLabel,
  isTicketListFilter,
  parseTicketListWindowDays,
  type TicketListFilter,
} from '@/features/tickets/utils/ticket-list-filter'

export function TicketsByStatusPage() {
  const { statusFilter = '' } = useParams<{ statusFilter: string }>()
  const [searchParams] = useSearchParams()
  const windowDays = parseTicketListWindowDays(searchParams.get('days'))
  const isValidFilter = isTicketListFilter(statusFilter)
  const filter = (isValidFilter ? statusFilter : 'created') as TicketListFilter
  const { data: tickets = [], isLoading, isError, error } = useFilteredTicketsQuery(filter, {
    days: windowDays,
    enabled: isValidFilter,
  })

  useScrollToTop([statusFilter, windowDays, isLoading])

  if (!isValidFilter) {
    return <Navigate to="/dashboard" replace />
  }

  const statusLabel = getTicketListFilterLabel(filter)

  return (
    <section className="ticket-page">
      <header className="ticket-page__header">
        <div className="ticket-page__header-content space-y-3">
          <Button variant="ghost" size="sm" className="-ml-2 w-fit gap-2 px-2" asChild>
            <Link to="/dashboard">
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Link>
          </Button>
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Status</p>
            <h1 className="ticket-page__title">{statusLabel}</h1>
            <p className="ticket-page__subtitle">
              Tickets matching this dashboard metric within {formatTicketListWindowLabel(windowDays)}
            </p>
          </div>
        </div>
      </header>

      <TicketsListView
        tickets={tickets}
        isLoading={isLoading}
        isError={isError}
        error={error}
        emptyDescription={`No tickets are currently in the ${statusLabel.toLowerCase()} view.`}
        invalidateQueryKeys={[['tickets'], ['tickets', 'filtered', filter, windowDays]]}
      />
    </section>
  )
}
