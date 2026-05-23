import { ArrowRight, BusFront, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useUserActivityQuery } from '@/features/user-history/hooks/use-user-activity-query'
import { useUserTicketsQuery } from '@/features/user-history/hooks/use-user-tickets-query'
import type { TicketRelation, TicketStatusApi, UserTicketItem } from '@/features/user-history/types/user-history'
import {
  formatActivityTicketHeading,
  formatDateTime,
  formatSeverityLabel,
  formatStatusLabel,
} from '@/features/user-history/utils/format'
import { getTicketDetailsPath } from '@/features/tickets/utils/ticket-routes'
import { cn } from '@/lib/utils'
import '@/features/tickets/styles/tickets-grid.css'

type DrilldownTab = 'tickets' | 'activity'

const RELATION_OPTIONS: Array<{ value: TicketRelation; label: string }> = [
  { value: 'assigned', label: 'Assigned' },
  { value: 'created', label: 'Created' },
  { value: 'acted_on', label: 'Acted on' },
]

const STATUS_OPTIONS: Array<{ value: TicketStatusApi | 'all'; label: string }> = [
  { value: 'all', label: 'All statuses' },
  { value: 'created', label: 'Created' },
  { value: 'assigned', label: 'Assigned' },
  { value: 'in_progress', label: 'In progress' },
  { value: 'blocked', label: 'Blocked' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'closed', label: 'Closed' },
  { value: 'reopened', label: 'Reopened' },
]

type UserTicketsDrilldownProps = {
  userId: string
}

function DrilldownTicketCard({ ticket }: { ticket: UserTicketItem }) {
  const navigate = useNavigate()
  const severity = ticket.severity.toLowerCase()

  return (
    <article
      className={cn(
        'user-history-drilldown-card',
        ticket.isOverdue && 'border-rose-300/60 bg-rose-50/30 dark:border-rose-900/50 dark:bg-rose-950/20',
      )}
    >
      <div className="space-y-1">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[0.65rem] font-semibold uppercase tracking-wider text-muted-foreground">
            {ticket.ticketNumber}
          </span>
          <span className={`ticket-grid__severity-badge ticket-grid__severity-badge--${severity}`}>
            {formatSeverityLabel(ticket.severity)}
          </span>
        </div>
        <h3 className="font-medium leading-snug">{ticket.title}</h3>
      </div>
      <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-2 text-xs">
        <div>
          <dt className="text-muted-foreground">Status</dt>
          <dd className="font-medium capitalize">{formatStatusLabel(ticket.status)}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Bus</dt>
          <dd className="inline-flex items-center gap-1 font-medium">
            <BusFront className="h-3 w-3 text-muted-foreground" aria-hidden />
            {ticket.bus.busNumber}
          </dd>
        </div>
        <div className="col-span-2">
          <dt className="text-muted-foreground">Updated</dt>
          <dd>{formatDateTime(ticket.updatedAt)}</dd>
        </div>
      </dl>
      <Button
        size="sm"
        className="mt-3 w-full"
        onClick={() => navigate(getTicketDetailsPath(ticket.id))}
      >
        View ticket
        <ArrowRight className="h-3.5 w-3.5" aria-hidden />
      </Button>
    </article>
  )
}

export function UserTicketsDrilldown({ userId }: UserTicketsDrilldownProps) {
  const navigate = useNavigate()
  const [tab, setTab] = useState<DrilldownTab>('tickets')
  const [relation, setRelation] = useState<TicketRelation>('assigned')
  const [status, setStatus] = useState<TicketStatusApi | 'all'>('all')
  const [page, setPage] = useState(1)
  const limit = 10

  const ticketQuery = useMemo(
    () => ({
      relation,
      page,
      limit,
      ...(status !== 'all' ? { status } : {}),
    }),
    [relation, status, page, limit],
  )

  const {
    data: ticketsData,
    isLoading: ticketsLoading,
    isFetching: ticketsFetching,
  } = useUserTicketsQuery(userId, ticketQuery)

  const {
    data: activityData,
    isLoading: activityLoading,
    isFetching: activityFetching,
  } = useUserActivityQuery(userId, page, limit)

  const ticketsMeta = ticketsData?.meta
  const activityMeta = activityData?.meta

  const handleTabChange = (next: DrilldownTab) => {
    setTab(next)
    setPage(1)
  }

  const handleRelationChange = (value: TicketRelation) => {
    setRelation(value)
    setPage(1)
  }

  const handleStatusChange = (value: string) => {
    setStatus(value as TicketStatusApi | 'all')
    setPage(1)
  }

  const isLoading = tab === 'tickets' ? ticketsLoading : activityLoading
  const isFetching = tab === 'tickets' ? ticketsFetching : activityFetching
  const meta = tab === 'tickets' ? ticketsMeta : activityMeta

  return (
    <Card className="min-w-0 border-border/80 bg-card/95 shadow-sm">
      <CardHeader className="gap-4 space-y-0 pb-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <CardTitle className="text-base font-semibold tracking-tight">Full history</CardTitle>
            <CardDescription>Paginated tickets and activity stream</CardDescription>
          </div>
          <div className="user-history-segment user-history-segment--block" role="tablist" aria-label="History drill-down">
            <button
              type="button"
              role="tab"
              aria-selected={tab === 'tickets'}
              data-active={tab === 'tickets'}
              className="user-history-segment__btn"
              onClick={() => handleTabChange('tickets')}
            >
              Tickets
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={tab === 'activity'}
              data-active={tab === 'activity'}
              className="user-history-segment__btn"
              onClick={() => handleTabChange('activity')}
            >
              Activity
            </button>
          </div>
        </div>

        {tab === 'tickets' ? (
          <div className="user-history-drilldown-filters">
            <Select value={relation} onValueChange={(value) => handleRelationChange(value as TicketRelation)}>
              <SelectTrigger className="w-full sm:w-[140px]">
                <SelectValue placeholder="Relation" />
              </SelectTrigger>
              <SelectContent>
                {RELATION_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={status} onValueChange={handleStatusChange}>
              <SelectTrigger className="w-full sm:w-[160px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ) : null}
      </CardHeader>

      <CardContent className="min-w-0 space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center gap-2 py-12 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            Loading…
          </div>
        ) : null}

        {!isLoading && tab === 'tickets' ? (
          <>
            {(ticketsData?.items.length ?? 0) === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">No tickets match these filters.</p>
            ) : (
              <>
                <div className="space-y-3 md:hidden">
                  {ticketsData?.items.map((ticket) => (
                    <DrilldownTicketCard key={ticket.id} ticket={ticket} />
                  ))}
                </div>

                <div className="hidden overflow-x-auto rounded-lg border md:block">
                  <table className="w-full min-w-[720px] border-collapse text-sm">
                    <thead>
                      <tr className="border-b bg-muted/30 text-left">
                        <th className="px-3 py-2.5 font-medium">Ticket</th>
                        <th className="px-3 py-2.5 font-medium">Status</th>
                        <th className="px-3 py-2.5 font-medium">Severity</th>
                        <th className="px-3 py-2.5 font-medium">Bus</th>
                        <th className="px-3 py-2.5 font-medium">Updated</th>
                        <th className="px-3 py-2.5 text-right font-medium">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ticketsData?.items.map((ticket) => (
                        <tr key={ticket.id} className="border-b last:border-b-0">
                          <td className="px-3 py-2.5">
                            <div className="font-medium">{ticket.title}</div>
                            <div className="text-xs text-muted-foreground">{ticket.ticketNumber}</div>
                          </td>
                          <td className="px-3 py-2.5 capitalize">{formatStatusLabel(ticket.status)}</td>
                          <td className="px-3 py-2.5">{formatSeverityLabel(ticket.severity)}</td>
                          <td className="px-3 py-2.5">{ticket.bus.busNumber}</td>
                          <td className="px-3 py-2.5 text-muted-foreground">{formatDateTime(ticket.updatedAt)}</td>
                          <td className="px-3 py-2.5 text-right">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => navigate(getTicketDetailsPath(ticket.id))}
                            >
                              View
                              <ArrowRight className="h-3.5 w-3.5" aria-hidden />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </>
        ) : null}

        {!isLoading && tab === 'activity' ? (
          <>
            {(activityData?.items.length ?? 0) === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">No activity recorded yet.</p>
            ) : (
              <ul className="space-y-3">
                {activityData?.items.map((item) => (
                  <li
                    key={item.id}
                    className="flex flex-col gap-2 rounded-lg border border-border/70 bg-muted/15 p-3 sm:flex-row sm:items-start sm:justify-between"
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        {item.actionType.replaceAll('_', ' ')}
                      </p>
                      <p className="font-medium leading-snug">
                        {formatActivityTicketHeading(
                          item.ticket.ticketNumber,
                          item.ticket.id,
                          item.ticket.title,
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {item.ticket.bus.busNumber} · {formatDateTime(item.createdAt)}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full shrink-0 sm:w-auto"
                      onClick={() => navigate(getTicketDetailsPath(item.ticket.id))}
                    >
                      Open
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </>
        ) : null}

        {meta && meta.totalPages > 0 ? (
          <div className="flex flex-col gap-3 border-t pt-3 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
            <span className="text-center sm:text-left">
              Page {meta.page} of {meta.totalPages} · {meta.total} total
              {isFetching ? ' · Updating…' : ''}
            </span>
            <div className="grid grid-cols-2 gap-2 sm:flex">
              <Button
                size="sm"
                variant="outline"
                className="w-full sm:w-auto"
                disabled={meta.page <= 1 || isFetching}
                onClick={() => setPage((current) => Math.max(1, current - 1))}
              >
                <ChevronLeft className="h-4 w-4" aria-hidden />
                Prev
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="w-full sm:w-auto"
                disabled={meta.page >= meta.totalPages || isFetching}
                onClick={() => setPage((current) => current + 1)}
              >
                Next
                <ChevronRight className="h-4 w-4" aria-hidden />
              </Button>
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}
