import { AlertTriangle, ArrowRight, Bus, Calendar, Trash2, User } from 'lucide-react'
import type { MouseEvent } from 'react'

import '@/features/tickets/styles/tickets-grid.css'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ShareTicketButton } from '@/features/tickets/components/share-ticket-button'
import { cn } from '@/lib/utils'

export type TicketMobileCardProps = {
  ticketId: string
  ticketNumber: string
  title: string
  busNumber: string
  createdBy: string
  assignedTo: string
  severity: string
  slaLabel: string
  isOverdue?: boolean
  onView: () => void
  onDelete?: (event: MouseEvent<HTMLButtonElement>) => void
  showDelete?: boolean
  className?: string
}

function SeverityBadge({ severity }: { severity: string }) {
  const normalized = severity.toUpperCase()

  return (
    <span className={`ticket-grid__severity-badge ticket-grid__severity-badge--${normalized.toLowerCase()}`}>
      {normalized}
    </span>
  )
}

export function TicketMobileCard({
  ticketId,
  ticketNumber,
  title,
  busNumber,
  createdBy,
  assignedTo,
  severity,
  slaLabel,
  isOverdue = false,
  onView,
  onDelete,
  showDelete = false,
  className,
}: TicketMobileCardProps) {
  const isUnassigned = assignedTo === 'Unassigned'
  const isUnknownCreator = createdBy === 'Unknown'

  return (
    <Card
      className={cn('ticket-mobile-card', isOverdue && 'ticket-mobile-card--overdue', className)}
      role="article"
      aria-label={`Ticket ${ticketNumber}: ${title}`}
    >
      <button
        type="button"
        className="ticket-mobile-card__body"
        onClick={onView}
        aria-label={`View ticket ${ticketNumber}`}
      >
        <div className="ticket-mobile-card__header">
          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="ticket-grid__ticket-number">{ticketNumber}</span>
              <SeverityBadge severity={severity} />
            </div>
            <h3 className="ticket-mobile-card__title">{title}</h3>
          </div>
          <span className="ticket-grid__bus-badge shrink-0">
            <Bus className="ticket-mobile-card__bus-icon" aria-hidden />
            {busNumber}
          </span>
        </div>

        <dl className="ticket-mobile-card__meta">
          <div className="ticket-mobile-card__meta-item">
            <dt>Assigned</dt>
            <dd className={cn(isUnassigned && 'ticket-mobile-card__meta-value--muted')}>
              <User className="ticket-mobile-card__meta-icon" aria-hidden />
              {assignedTo}
            </dd>
          </div>
          <div className="ticket-mobile-card__meta-item">
            <dt>Created by</dt>
            <dd className={cn(isUnknownCreator && 'ticket-mobile-card__meta-value--muted')}>
              <User className="ticket-mobile-card__meta-icon" aria-hidden />
              {createdBy}
            </dd>
          </div>
          <div className="ticket-mobile-card__meta-item ticket-mobile-card__meta-item--full">
            <dt>Due</dt>
            <dd>
              <span
                className={cn(
                  'ticket-grid__sla-badge',
                  isOverdue && 'ticket-grid__sla-badge--overdue',
                )}
              >
                {isOverdue ? (
                  <AlertTriangle className="ticket-grid__sla-icon" aria-hidden />
                ) : (
                  <Calendar className="ticket-grid__sla-icon" aria-hidden />
                )}
                {slaLabel}
              </span>
            </dd>
          </div>
        </dl>
      </button>

      <div className="ticket-mobile-card__actions">
        <Button size="sm" className="ticket-mobile-card__action-primary flex-1" onClick={onView}>
          View
          <ArrowRight className="ticket-grid__action-icon" aria-hidden />
        </Button>
        <ShareTicketButton
          ticketId={ticketId}
          ticketNumber={ticketNumber !== '—' ? ticketNumber : undefined}
          title={title}
          className="ticket-mobile-card__action-secondary flex-1"
        />
        {showDelete && onDelete ? (
          <Button
            size="sm"
            variant="destructive"
            className="ticket-mobile-card__action-delete shrink-0"
            onClick={onDelete}
            aria-label={`Delete ticket ${ticketNumber}`}
          >
            <Trash2 className="h-4 w-4" aria-hidden />
          </Button>
        ) : null}
      </div>
    </Card>
  )
}

export function TicketMobileCardSkeleton() {
  return (
    <Card className="ticket-mobile-card ticket-mobile-card--skeleton" aria-hidden>
      <div className="ticket-mobile-card__body space-y-3 p-4">
        <div className="flex justify-between gap-3">
          <div className="h-5 w-24 rounded-md bg-muted" />
          <div className="h-6 w-16 rounded-md bg-muted" />
        </div>
        <div className="h-4 w-full rounded-md bg-muted" />
        <div className="h-4 w-4/5 rounded-md bg-muted" />
        <div className="grid grid-cols-2 gap-2">
          <div className="h-10 rounded-md bg-muted/70" />
          <div className="h-10 rounded-md bg-muted/70" />
        </div>
      </div>
      <div className="ticket-mobile-card__actions">
        <div className="h-9 flex-1 rounded-md bg-muted" />
        <div className="h-9 flex-1 rounded-md bg-muted" />
      </div>
    </Card>
  )
}
