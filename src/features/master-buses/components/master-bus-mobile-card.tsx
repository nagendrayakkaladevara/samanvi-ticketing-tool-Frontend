import {
  BusFront,
  ClipboardList,
  Gauge,
  Pencil,
  ShieldCheck,
  Trash2,
  Wrench,
} from 'lucide-react'
import { motion, useReducedMotion } from 'framer-motion'
import type { MouseEvent, ReactNode } from 'react'

import '@/features/tickets/styles/tickets-grid.css'

import { MasterDateDetailField } from '@/components/master-date-detail-field'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import type { MasterBusGridRow } from '@/features/master-buses/types/master-bus'
import { useIsMobile } from '@/hooks/use-mobile'
import { cn } from '@/lib/utils'

type MasterBusMobileCardProps = {
  row: MasterBusGridRow
  canEdit?: boolean
  canDelete?: boolean
  onEdit?: () => void
  onDelete?: (event: MouseEvent<HTMLButtonElement>) => void
  className?: string
  /** Extra delay so list stagger + field populate feel sequenced */
  animationDelay?: number
}

type DetailField = {
  label: string
  value: string
  dateValue?: string | null
  fullWidth?: boolean
}

const easeOutExpo = [0.22, 1, 0.36, 1] as const

const cardBodyVariants = {
  hidden: {},
  visible: (delay = 0) => ({
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1 + delay,
    },
  }),
}

const sectionVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.32,
      ease: easeOutExpo,
      staggerChildren: 0.045,
      delayChildren: 0.04,
    },
  },
}

const fieldVariants = {
  hidden: { opacity: 0, y: 10, scale: 0.97 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.3, ease: easeOutExpo },
  },
}

const headerVariants = {
  hidden: { opacity: 0, y: -8 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: easeOutExpo },
  },
}

const actionsVariants = {
  hidden: { opacity: 0, y: 8 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, ease: easeOutExpo },
  },
}

function isEmptyLabel(value: string): boolean {
  const trimmed = value.trim()
  return !trimmed || trimmed === '—'
}

function DetailCell({
  label,
  value,
  dateValue,
  fullWidth = false,
  animate,
}: DetailField & { animate: boolean }) {
  const empty = isEmptyLabel(value)

  const content =
    dateValue !== undefined ? (
      <MasterDateDetailField
        label={label}
        value={value}
        dateValue={dateValue}
        className={cn(fullWidth && 'master-bus-mobile-card__field--full')}
        valueClassName={empty ? 'font-medium italic text-muted-foreground/75' : undefined}
      />
    ) : (
      <div className={cn('master-bus-mobile-card__field', fullWidth && 'master-bus-mobile-card__field--full')}>
        <dt>{label}</dt>
        <dd className={cn(empty && 'master-bus-mobile-card__value--empty')}>{value}</dd>
      </div>
    )

  if (!animate) return content

  return (
    <motion.div
      variants={fieldVariants}
      className={cn(fullWidth && 'master-bus-mobile-card__field--full')}
    >
      {content}
    </motion.div>
  )
}

function Section({
  title,
  icon: Icon,
  children,
  animate,
}: {
  title: string
  icon: typeof BusFront
  children: ReactNode
  animate: boolean
}) {
  if (!animate) {
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

  return (
    <motion.section className="master-bus-mobile-card__section" variants={sectionVariants}>
      <motion.h4 className="master-bus-mobile-card__section-title" variants={fieldVariants}>
        <Icon className="master-bus-mobile-card__section-icon" aria-hidden />
        {title}
      </motion.h4>
      <motion.dl className="master-bus-mobile-card__grid" variants={sectionVariants}>
        {children}
      </motion.dl>
    </motion.section>
  )
}

export function MasterBusMobileCard({
  row,
  canEdit = false,
  canDelete = false,
  onEdit,
  onDelete,
  className,
  animationDelay = 0,
}: MasterBusMobileCardProps) {
  const remarks = row.remarks?.trim()
  const isMobile = useIsMobile()
  const shouldReduceMotion = useReducedMotion()
  const animate = isMobile && !shouldReduceMotion

  const body = (
    <>
      <Section title="Vehicle" icon={Wrench} animate={animate}>
        <DetailCell label="Engine" value={row.engineNumber} animate={animate} />
        <DetailCell label="Chassis" value={row.chassisNumber} animate={animate} />
        <DetailCell label="Purchase" value={row.purchaseDateLabel} animate={animate} />
        <DetailCell
          label="Service out"
          value={row.serviceOutDateLabel}
          dateValue={row.serviceOutDate}
          animate={animate}
        />
      </Section>

      <Section title="Compliance" icon={ShieldCheck} animate={animate}>
        <DetailCell
          label="Insurance"
          value={row.insuranceValidityLabel}
          dateValue={row.insuranceValidity}
          animate={animate}
        />
        <DetailCell
          label="Pollution"
          value={row.pollutionValidityLabel}
          dateValue={row.pollutionValidity}
          animate={animate}
        />
        <DetailCell label="FC" value={row.fcValidityLabel} dateValue={row.fcValidity} animate={animate} />
        <DetailCell
          label="Base permit"
          value={row.basePermitValidityLabel}
          dateValue={row.basePermitValidity}
          animate={animate}
        />
        <DetailCell
          label="Home tax"
          value={row.homeTaxValidityLabel}
          dateValue={row.homeTaxValidity}
          animate={animate}
        />
        <DetailCell
          label="AITP"
          value={row.aitpValidityLabel}
          dateValue={row.aitpValidity}
          animate={animate}
        />
        <DetailCell
          label="AITP auth"
          value={row.aitpAuthorizationValidityLabel}
          dateValue={row.aitpAuthorizationValidity}
          animate={animate}
        />
      </Section>

      {remarks ? (
        animate ? (
          <motion.section className="master-bus-mobile-card__section" variants={sectionVariants}>
            <motion.h4 className="master-bus-mobile-card__section-title" variants={fieldVariants}>
              <ClipboardList className="master-bus-mobile-card__section-icon" aria-hidden />
              Remarks
            </motion.h4>
            <motion.p className="master-bus-mobile-card__remarks" variants={fieldVariants}>
              {remarks}
            </motion.p>
          </motion.section>
        ) : (
          <section className="master-bus-mobile-card__section">
            <h4 className="master-bus-mobile-card__section-title">
              <ClipboardList className="master-bus-mobile-card__section-icon" aria-hidden />
              Remarks
            </h4>
            <p className="master-bus-mobile-card__remarks">{remarks}</p>
          </section>
        )
      ) : null}
    </>
  )

  const actions =
    (canEdit && onEdit) || (canDelete && onDelete) ? (
      animate ? (
        <motion.div className="master-bus-mobile-card__actions" variants={actionsVariants}>
          {canEdit && onEdit ? (
            <motion.div className="flex-1" whileTap={{ scale: 0.97 }}>
              <Button size="sm" variant="outline" className="master-bus-mobile-card__action w-full" onClick={onEdit}>
                <Pencil className="h-3.5 w-3.5" aria-hidden />
                Edit
              </Button>
            </motion.div>
          ) : null}
          {canDelete && onDelete ? (
            <motion.div whileTap={{ scale: 0.9 }}>
              <Button
                size="sm"
                variant="destructive"
                className="master-bus-mobile-card__action-delete shrink-0 border-red-600 bg-red-600 text-white hover:bg-red-700"
                onClick={onDelete}
                aria-label={`Delete bus ${row.busNumber}`}
              >
                <Trash2 className="h-4 w-4" aria-hidden />
              </Button>
            </motion.div>
          ) : null}
        </motion.div>
      ) : (
        <div className="master-bus-mobile-card__actions">
          {canEdit && onEdit ? (
            <Button size="sm" variant="outline" className="master-bus-mobile-card__action flex-1" onClick={onEdit}>
              <Pencil className="h-3.5 w-3.5" aria-hidden />
              Edit
            </Button>
          ) : null}
          {canDelete && onDelete ? (
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
      )
    ) : null

  return (
    <Card className={cn('master-bus-mobile-card', className)} role="article" aria-label={`Bus ${row.busNumber}`}>
      {animate ? (
        <motion.div
          initial="hidden"
          animate="visible"
          custom={animationDelay}
          variants={cardBodyVariants}
        >
          <motion.div className="master-bus-mobile-card__header" variants={headerVariants}>
            <span className="ticket-grid__bus-badge master-bus-mobile-card__bus-badge">
              <BusFront className="master-bus-mobile-card__bus-icon" aria-hidden />
              {row.busNumber}
            </span>
            <span className="master-bus-mobile-card__odometer">
              <Gauge className="master-bus-mobile-card__odometer-icon" aria-hidden />
              {row.odometer.toLocaleString()} km
            </span>
          </motion.div>

          <motion.div className="master-bus-mobile-card__body" variants={cardBodyVariants} custom={0}>
            {body}
          </motion.div>

          {actions}
        </motion.div>
      ) : (
        <>
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
          <div className="master-bus-mobile-card__body">{body}</div>
          {actions}
        </>
      )}
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
