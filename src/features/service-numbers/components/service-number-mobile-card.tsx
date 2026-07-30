import { Eye, MapPin, Pencil, Route, Trash2 } from 'lucide-react'
import type { MouseEvent, ReactNode } from 'react'

import '@/features/tickets/styles/tickets-grid.css'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import type { ServiceNumber } from '@/features/service-numbers/types/service-number'
import { formatDistance } from '@/features/service-numbers/utils/service-number-model'
import { cn } from '@/lib/utils'

type ServiceNumberMobileCardProps = {
  item: ServiceNumber
  canEdit?: boolean
  canDelete?: boolean
  onView?: () => void
  onEdit?: () => void
  onDelete?: (event: MouseEvent<HTMLButtonElement>) => void
  className?: string
}

type DetailField = {
  label: string
  value: string
  fullWidth?: boolean
}

function isEmptyLabel(value: string): boolean {
  const trimmed = value.trim()
  return !trimmed || trimmed === '—'
}

function DetailCell({ label, value, fullWidth = false }: DetailField) {
  const empty = isEmptyLabel(value)

  return (
    <div
      className={cn(
        'service-number-mobile-card__field',
        fullWidth && 'service-number-mobile-card__field--full',
      )}
    >
      <dt>{label}</dt>
      <dd className={cn(empty && 'service-number-mobile-card__value--empty')}>{value}</dd>
    </div>
  )
}

function Section({
  title,
  icon: Icon,
  children,
}: {
  title: string
  icon: typeof Route
  children: ReactNode
}) {
  return (
    <section className="service-number-mobile-card__section">
      <h4 className="service-number-mobile-card__section-title">
        <Icon className="service-number-mobile-card__section-icon" aria-hidden />
        {title}
      </h4>
      <dl className="service-number-mobile-card__grid">{children}</dl>
    </section>
  )
}

export function ServiceNumberMobileCard({
  item,
  canEdit = false,
  canDelete = false,
  onView,
  onEdit,
  onDelete,
  className,
}: ServiceNumberMobileCardProps) {
  return (
    <Card
      className={cn('service-number-mobile-card', className)}
      role="article"
      aria-label={`Service number ${item.serviceNo}`}
    >
      <div className="service-number-mobile-card__header">
        <span className="ticket-grid__bus-badge service-number-mobile-card__badge">
          <Route className="service-number-mobile-card__badge-icon" aria-hidden />
          {item.serviceNo}
        </span>
        <span className="service-number-mobile-card__distance">
          <MapPin className="service-number-mobile-card__distance-icon" aria-hidden />
          {formatDistance(item.distance)}
        </span>
      </div>

      <div className="service-number-mobile-card__body">
        <Section title="Route" icon={MapPin}>
          <DetailCell label="Service For" value={item.serviceFor.serviceFor} fullWidth />
          <DetailCell label="From" value={item.from} />
          <DetailCell label="To" value={item.to} />
          <DetailCell label="Via" value={item.via} fullWidth />
        </Section>
      </div>

      <div className="service-number-mobile-card__actions">
        {onView ? (
          <Button
            size="sm"
            variant="outline"
            className="service-number-mobile-card__action flex-1"
            onClick={onView}
          >
            <Eye className="h-3.5 w-3.5" aria-hidden />
            View
          </Button>
        ) : null}
        {canEdit && onEdit ? (
          <Button
            size="sm"
            variant="outline"
            className="service-number-mobile-card__action flex-1"
            onClick={onEdit}
          >
            <Pencil className="h-3.5 w-3.5" aria-hidden />
            Edit
          </Button>
        ) : null}
        {canDelete && onDelete ? (
          <Button
            size="sm"
            variant="destructive"
            className="service-number-mobile-card__action flex-1 border-red-600 bg-red-600 text-white hover:bg-red-700"
            onClick={onDelete}
          >
            <Trash2 className="h-3.5 w-3.5" aria-hidden />
            Delete
          </Button>
        ) : null}
      </div>
    </Card>
  )
}

export function ServiceNumberMobileCardSkeleton() {
  return (
    <Card className="service-number-mobile-card service-number-mobile-card--skeleton" aria-hidden>
      <div className="service-number-mobile-card__header">
        <div className="h-7 w-28 rounded-md bg-muted" />
        <div className="h-5 w-20 rounded-md bg-muted" />
      </div>
      <div className="service-number-mobile-card__body space-y-4 p-4 pt-0">
        <div className="grid grid-cols-2 gap-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-12 rounded-md bg-muted/70" />
          ))}
        </div>
      </div>
      <div className="service-number-mobile-card__actions">
        <div className="h-9 flex-1 rounded-md bg-muted" />
        <div className="h-9 flex-1 rounded-md bg-muted" />
        <div className="h-9 flex-1 rounded-md bg-muted" />
      </div>
    </Card>
  )
}
