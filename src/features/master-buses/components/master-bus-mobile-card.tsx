import {
  BusFront,
  ClipboardList,
  Gauge,
  Pencil,
  ShieldCheck,
  Trash2,
  Wrench,
} from 'lucide-react'
import type { MouseEvent, ReactNode } from 'react'

import '@/features/tickets/styles/tickets-grid.css'

import { MasterDateDetailField } from '@/components/master-date-detail-field'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import type { MasterBusGridRow } from '@/features/master-buses/types/master-bus'
import { cn } from '@/lib/utils'

type MasterBusMobileCardProps = {
  row: MasterBusGridRow
  canManage?: boolean
  onEdit?: () => void
  onDelete?: (event: MouseEvent<HTMLButtonElement>) => void
  className?: string
}

type DetailField = {
  label: string
  value: string
  dateValue?: string | null
  fullWidth?: boolean
}

function isEmptyLabel(value: string): boolean {
  const trimmed = value.trim()
  return !trimmed || trimmed === '—'
}

function DetailCell({ label, value, dateValue, fullWidth = false }: DetailField) {
  const empty = isEmptyLabel(value)

  if (dateValue !== undefined) {
    return (
      <MasterDateDetailField
        label={label}
        value={value}
        dateValue={dateValue}
        className={cn(fullWidth && 'master-bus-mobile-card__field--full')}
        valueClassName={empty ? 'font-medium italic text-muted-foreground/75' : undefined}
      />
    )
  }

  return (
    <div className={cn('master-bus-mobile-card__field', fullWidth && 'master-bus-mobile-card__field--full')}>
      <dt>{label}</dt>
      <dd className={cn(empty && 'master-bus-mobile-card__value--empty')}>{value}</dd>
    </div>
  )
}

function Section({
  title,
  icon: Icon,
  children,
}: {
  title: string
  icon: typeof BusFront
  children: ReactNode
}) {
  return (
    <section className="master-bus-mobile-card__section">
      <h4 className="master-bus-mobile-card__section-title">
        <Icon className="master-bus-mobile-card__section-icon" aria-hidden />
        {title}
      </h4>
      <dl className="master-bus-mobile-card__grid">{children}</dl>
    </section>
  )
}

export function MasterBusMobileCard({
  row,
  canManage = false,
  onEdit,
  onDelete,
  className,
}: MasterBusMobileCardProps) {
  const remarks = row.remarks?.trim()

  return (
    <Card className={cn('master-bus-mobile-card', className)} role="article" aria-label={`Bus ${row.busNumber}`}>
      <div className="master-bus-mobile-card__header">
        <span className="ticket-grid__bus-badge master-bus-mobile-card__bus-badge">
          <BusFront className="master-bus-mobile-card__bus-icon" aria-hidden />
          {row.busNumber}
        </span>
        <span className="master-bus-mobile-card__odometer">
          <Gauge className="master-bus-mobile-card__odometer-icon" aria-hidden />
          {row.odometer.toLocaleString()} km
        </span>
      </div>

      <div className="master-bus-mobile-card__body">
        <Section title="Vehicle" icon={Wrench}>
          <DetailCell label="Engine" value={row.engineNumber} />
          <DetailCell label="Chassis" value={row.chassisNumber} />
          <DetailCell label="Purchase" value={row.purchaseDateLabel} />
          <DetailCell label="Service out" value={row.serviceOutDateLabel} dateValue={row.serviceOutDate} />
        </Section>

        <Section title="Compliance" icon={ShieldCheck}>
          <DetailCell label="Insurance" value={row.insuranceValidityLabel} dateValue={row.insuranceValidity} />
          <DetailCell label="Pollution" value={row.pollutionValidityLabel} dateValue={row.pollutionValidity} />
          <DetailCell label="FC" value={row.fcValidityLabel} dateValue={row.fcValidity} />
          <DetailCell label="Base permit" value={row.basePermitValidityLabel} dateValue={row.basePermitValidity} />
          <DetailCell label="Home tax" value={row.homeTaxValidityLabel} dateValue={row.homeTaxValidity} />
          <DetailCell label="AITP" value={row.aitpValidityLabel} dateValue={row.aitpValidity} />
          <DetailCell
            label="AITP auth"
            value={row.aitpAuthorizationValidityLabel}
            dateValue={row.aitpAuthorizationValidity}
          />
        </Section>

        {remarks ? (
          <section className="master-bus-mobile-card__section">
            <h4 className="master-bus-mobile-card__section-title">
              <ClipboardList className="master-bus-mobile-card__section-icon" aria-hidden />
              Remarks
            </h4>
            <p className="master-bus-mobile-card__remarks">{remarks}</p>
          </section>
        ) : null}
      </div>

      {canManage && (onEdit || onDelete) ? (
        <div className="master-bus-mobile-card__actions">
          {onEdit ? (
            <Button size="sm" variant="outline" className="master-bus-mobile-card__action flex-1" onClick={onEdit}>
              <Pencil className="h-3.5 w-3.5" aria-hidden />
              Edit
            </Button>
          ) : null}
          {onDelete ? (
            <Button
              size="sm"
              variant="destructive"
              className="master-bus-mobile-card__action-delete shrink-0 border-red-600 bg-red-600 text-white hover:bg-red-700"
              onClick={onDelete}
              aria-label={`Delete bus ${row.busNumber}`}
            >
              <Trash2 className="h-4 w-4" aria-hidden />
            </Button>
          ) : null}
        </div>
      ) : null}
    </Card>
  )
}

export function MasterBusMobileCardSkeleton() {
  return (
    <Card className="master-bus-mobile-card master-bus-mobile-card--skeleton" aria-hidden>
      <div className="master-bus-mobile-card__header">
        <div className="h-7 w-28 rounded-md bg-muted" />
        <div className="h-5 w-20 rounded-md bg-muted" />
      </div>
      <div className="master-bus-mobile-card__body space-y-4 p-4 pt-0">
        <div className="grid grid-cols-2 gap-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-12 rounded-md bg-muted/70" />
          ))}
        </div>
        <div className="grid grid-cols-2 gap-2">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="h-12 rounded-md bg-muted/50" />
          ))}
        </div>
      </div>
      <div className="master-bus-mobile-card__actions">
        <div className="h-9 flex-1 rounded-md bg-muted" />
        <div className="h-9 w-10 rounded-md bg-muted" />
      </div>
    </Card>
  )
}
