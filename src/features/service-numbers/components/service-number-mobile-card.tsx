import { Eye, MapPin, Pencil, Route, Trash2 } from 'lucide-react'
import { motion, useReducedMotion } from 'framer-motion'
import type { MouseEvent, ReactNode } from 'react'

import '@/features/tickets/styles/tickets-grid.css'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import type { ServiceNumber } from '@/features/service-numbers/types/service-number'
import { formatDistance } from '@/features/service-numbers/utils/service-number-model'
import { useIsMobile } from '@/hooks/use-mobile'
import { cn } from '@/lib/utils'

type ServiceNumberMobileCardProps = {
  item: ServiceNumber
  canEdit?: boolean
  canDelete?: boolean
  onView?: () => void
  onEdit?: () => void
  onDelete?: (event: MouseEvent<HTMLButtonElement>) => void
  className?: string
  /** Extra delay so list stagger + field populate feel sequenced */
  animationDelay?: number
}

type DetailField = {
  label: string
  value: string
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
  fullWidth = false,
  animate,
}: DetailField & { animate: boolean }) {
  const empty = isEmptyLabel(value)

  const content = (
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

  if (!animate) return content

  return (
    <motion.div
      variants={fieldVariants}
      className={cn(fullWidth && 'service-number-mobile-card__field--full')}
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
  icon: typeof Route
  children: ReactNode
  animate: boolean
}) {
  if (!animate) {
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

  return (
    <motion.section className="service-number-mobile-card__section" variants={sectionVariants}>
      <motion.h4 className="service-number-mobile-card__section-title" variants={fieldVariants}>
        <Icon className="service-number-mobile-card__section-icon" aria-hidden />
        {title}
      </motion.h4>
      <motion.dl className="service-number-mobile-card__grid" variants={sectionVariants}>
        {children}
      </motion.dl>
    </motion.section>
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
  animationDelay = 0,
}: ServiceNumberMobileCardProps) {
  const isMobile = useIsMobile()
  const shouldReduceMotion = useReducedMotion()
  const animate = isMobile && !shouldReduceMotion

  const body = (
    <Section title="Route" icon={MapPin} animate={animate}>
      <DetailCell label="Service For" value={item.serviceFor.serviceFor} fullWidth animate={animate} />
      <DetailCell label="From" value={item.from} animate={animate} />
      <DetailCell label="To" value={item.to} animate={animate} />
      <DetailCell label="Via" value={item.via} fullWidth animate={animate} />
    </Section>
  )

  const hasActions = Boolean(onView || (canEdit && onEdit) || (canDelete && onDelete))

  const actions = hasActions ? (
    animate ? (
      <motion.div className="service-number-mobile-card__actions" variants={actionsVariants}>
        {onView ? (
          <motion.div className="flex-1" whileTap={{ scale: 0.97 }}>
            <Button
              size="sm"
              variant="outline"
              className="service-number-mobile-card__action w-full"
              onClick={onView}
            >
              <Eye className="h-3.5 w-3.5" aria-hidden />
              View
            </Button>
          </motion.div>
        ) : null}
        {canEdit && onEdit ? (
          <motion.div className="flex-1" whileTap={{ scale: 0.97 }}>
            <Button
              size="sm"
              variant="outline"
              className="service-number-mobile-card__action w-full"
              onClick={onEdit}
            >
              <Pencil className="h-3.5 w-3.5" aria-hidden />
              Edit
            </Button>
          </motion.div>
        ) : null}
        {canDelete && onDelete ? (
          <motion.div className="flex-1" whileTap={{ scale: 0.97 }}>
            <Button
              size="sm"
              variant="destructive"
              className="service-number-mobile-card__action w-full border-red-600 bg-red-600 text-white hover:bg-red-700"
              onClick={onDelete}
            >
              <Trash2 className="h-3.5 w-3.5" aria-hidden />
              Delete
            </Button>
          </motion.div>
        ) : null}
      </motion.div>
    ) : (
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
    )
  ) : null

  return (
    <Card
      className={cn('service-number-mobile-card', className)}
      role="article"
      aria-label={`Service number ${item.serviceNo}`}
    >
      {animate ? (
        <motion.div
          initial="hidden"
          animate="visible"
          custom={animationDelay}
          variants={cardBodyVariants}
        >
          <motion.div className="service-number-mobile-card__header" variants={headerVariants}>
            <span className="ticket-grid__bus-badge service-number-mobile-card__badge">
              <Route className="service-number-mobile-card__badge-icon" aria-hidden />
              {item.serviceNo}
            </span>
            <span className="service-number-mobile-card__distance">
              <MapPin className="service-number-mobile-card__distance-icon" aria-hidden />
              {formatDistance(item.distance)}
            </span>
          </motion.div>

          <motion.div className="service-number-mobile-card__body" variants={cardBodyVariants} custom={0}>
            {body}
          </motion.div>

          {actions}
        </motion.div>
      ) : (
        <>
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
          <div className="service-number-mobile-card__body">{body}</div>
          {actions}
        </>
      )}
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
