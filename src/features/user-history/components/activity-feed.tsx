import { ArrowRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import type { ActivityItem } from '@/features/user-history/types/user-history'
import {
  formatActivityNote,
  formatActivityTicketHeading,
  formatDateTime,
  formatStatusLabel,
} from '@/features/user-history/utils/format'
import { getTicketDetailsPath } from '@/features/tickets/utils/ticket-routes'

const ACTION_LABELS: Record<ActivityItem['actionType'], string> = {
  created: 'Created ticket',
  assigned: 'Assigned ticket',
  status_changed: 'Changed status',
  commented: 'Added comment',
  reopened: 'Reopened ticket',
  closed: 'Closed ticket',
}

type ActivityFeedProps = {
  title: string
  description: string
  items: ActivityItem[]
  emptyMessage: string
}

export function ActivityFeed({ title, description, items, emptyMessage }: ActivityFeedProps) {
  const navigate = useNavigate()

  return (
    <Card className="border-border/80 bg-card/95 shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold tracking-tight">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {items.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">{emptyMessage}</p>
        ) : (
          items.map((item) => {
            const activityNote = formatActivityNote(item.note, item.ticket.id)

            return (
              <article key={item.id} className="user-history-activity-item">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 space-y-1">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[hsl(var(--uh-accent))]">
                      {ACTION_LABELS[item.actionType]}
                    </p>
                    <h3 className="font-medium leading-snug">
                      {formatActivityTicketHeading(item.ticket.ticketNumber, item.ticket.id, item.ticket.title)}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      {item.ticket.bus.busNumber} · {formatDateTime(item.createdAt)}
                    </p>
                    {item.fromStatus && item.toStatus ? (
                      <p className="text-xs text-muted-foreground">
                        <span className="capitalize">{formatStatusLabel(item.fromStatus)}</span>
                        {' → '}
                        <span className="capitalize font-medium text-foreground">
                          {formatStatusLabel(item.toStatus)}
                        </span>
                      </p>
                    ) : null}
                    {activityNote ? <p className="text-sm text-muted-foreground">{activityNote}</p> : null}
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full shrink-0 sm:w-auto"
                    onClick={() => navigate(getTicketDetailsPath(item.ticket.id))}
                  >
                    Ticket
                    <ArrowRight className="h-3.5 w-3.5" aria-hidden />
                  </Button>
                </div>
              </article>
            )
          })
        )}
      </CardContent>
    </Card>
  )
}
