import { ArrowRight, BusFront } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import type { UserTicketItem } from '@/features/user-history/types/user-history'
import {
  formatDateTime,
  formatPriorityLabel,
  formatSeverityLabel,
  formatStatusLabel,
} from '@/features/user-history/utils/format'
import { getTicketDetailsPath } from '@/features/tickets/utils/ticket-routes'
import { cn } from '@/lib/utils'
import '@/features/tickets/styles/tickets-grid.css'

type RecentTicketListProps = {
  title: string
  description: string
  tickets: UserTicketItem[]
  emptyMessage: string
}

export function RecentTicketList({ title, description, tickets, emptyMessage }: RecentTicketListProps) {
  const navigate = useNavigate()

  return (
    <Card className="border-border/80 bg-card/95 shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold tracking-tight">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {tickets.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">{emptyMessage}</p>
        ) : (
          tickets.map((ticket) => (
            <article
              key={ticket.id}
              className={cn(
                'rounded-lg border border-border/80 bg-muted/20 p-3 transition-colors hover:bg-muted/35',
                ticket.isOverdue && 'border-rose-300/60 bg-rose-50/40 dark:border-rose-900/50 dark:bg-rose-950/20',
              )}
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0 space-y-1">
                  <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                    <span className="text-[0.65rem] font-semibold uppercase tracking-wider text-muted-foreground">
                      {ticket.ticketNumber}
                    </span>
                    <span
                      className={`ticket-grid__severity-badge ticket-grid__severity-badge--${ticket.severity}`}
                    >
                      {formatSeverityLabel(ticket.severity)}
                    </span>
                    {ticket.isOverdue ? (
                      <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[0.65rem] font-semibold uppercase text-rose-700 dark:bg-rose-950 dark:text-rose-300">
                        Overdue
                      </span>
                    ) : null}
                  </div>
                  <h3 className="font-medium leading-snug">{ticket.title}</h3>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full shrink-0 sm:w-auto"
                  onClick={() => navigate(getTicketDetailsPath(ticket.id))}
                >
                  View
                  <ArrowRight className="h-3.5 w-3.5" aria-hidden />
                </Button>
              </div>
              <dl className="grid grid-cols-2 gap-x-3 gap-y-2 text-xs">
                <div>
                  <dt className="text-muted-foreground">Status</dt>
                  <dd className="font-medium capitalize">{formatStatusLabel(ticket.status)}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Priority</dt>
                  <dd className="font-medium">{formatPriorityLabel(ticket.priority)}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Bus</dt>
                  <dd className="inline-flex items-center gap-1 font-medium">
                    <BusFront className="h-3 w-3 text-muted-foreground" aria-hidden />
                    {ticket.bus.busNumber}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Updated</dt>
                  <dd>{formatDateTime(ticket.updatedAt)}</dd>
                </div>
              </dl>
            </article>
          ))
        )}
      </CardContent>
    </Card>
  )
}
