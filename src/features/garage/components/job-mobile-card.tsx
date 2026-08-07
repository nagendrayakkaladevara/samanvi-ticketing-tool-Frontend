import { ArrowRight, Bus, Calendar, Pencil, Trash2, User, Wrench } from 'lucide-react'
import { motion, useReducedMotion } from 'framer-motion'
import type { MouseEvent } from 'react'

import '@/features/tickets/styles/tickets-grid.css'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  formatJobDate,
  getPrioritySeverityClass,
} from '@/features/garage/utils/job-list-model'
import type { JobPriority } from '@/features/garage/types/job'
import { useIsMobile } from '@/hooks/use-mobile'
import { cn } from '@/lib/utils'

export type JobMobileCardProps = {
  jobId: string
  jobIdNumber: string
  description: string
  busNumber: string
  category: string
  priority: JobPriority
  status: string
  assignedTo: string
  createdBy: string
  createdAt: string
  onView: () => void
  onEdit?: () => void
  onDelete?: (event: MouseEvent<HTMLButtonElement>) => void
  showActions?: boolean
  className?: string
  /** Extra delay so list stagger + field populate feel sequenced */
  animationDelay?: number
}

const easeOutExpo = [0.22, 1, 0.36, 1] as const

const cardBodyVariants = {
  hidden: {},
  visible: (delay = 0) => ({
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.08 + delay,
    },
  }),
}

const headerVariants = {
  hidden: { opacity: 0, y: -8 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: easeOutExpo },
  },
}

const metaListVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.3,
      ease: easeOutExpo,
      staggerChildren: 0.04,
      delayChildren: 0.04,
    },
  },
}

const fieldVariants = {
  hidden: { opacity: 0, y: 8, scale: 0.98 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.28, ease: easeOutExpo },
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

function PriorityBadge({ priority }: { priority: JobPriority }) {
  const severityClass = getPrioritySeverityClass(priority)

  return (
    <span className={`ticket-grid__severity-badge ticket-grid__severity-badge--${severityClass}`}>
      {priority.toUpperCase()}
    </span>
  )
}

export function JobMobileCard({
  jobIdNumber,
  description,
  busNumber,
  category,
  priority,
  status,
  assignedTo,
  createdBy,
  createdAt,
  onView,
  onEdit,
  onDelete,
  showActions = true,
  className,
  animationDelay = 0,
}: JobMobileCardProps) {
  const isUnassigned = assignedTo === 'Unassigned'
  const isUnknownCreator = createdBy === 'Unknown'
  const isMobile = useIsMobile()
  const shouldReduceMotion = useReducedMotion()
  const animate = isMobile && !shouldReduceMotion

  const header = (
    <div className="ticket-mobile-card__header">
      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="ticket-grid__ticket-number">{jobIdNumber}</span>
          <PriorityBadge priority={priority} />
        </div>
        <h3 className="ticket-mobile-card__title line-clamp-2">{description}</h3>
      </div>
      <span className="ticket-grid__bus-badge shrink-0">
        <Bus className="ticket-mobile-card__bus-icon" aria-hidden />
        {busNumber}
      </span>
    </div>
  )

  const meta = (
    <dl className="ticket-mobile-card__meta">
      <div className="ticket-mobile-card__meta-item">
        <dt>Category</dt>
        <dd>
          <Wrench className="ticket-mobile-card__meta-icon" aria-hidden />
          {category}
        </dd>
      </div>
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
        <dt>Status</dt>
        <dd>
          <span className="ticket-grid__sla-badge capitalize">
            <Calendar className="ticket-grid__sla-icon" aria-hidden />
            {status} · {formatJobDate(createdAt)}
          </span>
        </dd>
      </div>
    </dl>
  )

  const animatedMeta = (
    <motion.dl className="ticket-mobile-card__meta" variants={metaListVariants}>
      <motion.div className="ticket-mobile-card__meta-item" variants={fieldVariants}>
        <dt>Category</dt>
        <dd>
          <Wrench className="ticket-mobile-card__meta-icon" aria-hidden />
          {category}
        </dd>
      </motion.div>
      <motion.div className="ticket-mobile-card__meta-item" variants={fieldVariants}>
        <dt>Assigned</dt>
        <dd className={cn(isUnassigned && 'ticket-mobile-card__meta-value--muted')}>
          <User className="ticket-mobile-card__meta-icon" aria-hidden />
          {assignedTo}
        </dd>
      </motion.div>
      <motion.div className="ticket-mobile-card__meta-item" variants={fieldVariants}>
        <dt>Created by</dt>
        <dd className={cn(isUnknownCreator && 'ticket-mobile-card__meta-value--muted')}>
          <User className="ticket-mobile-card__meta-icon" aria-hidden />
          {createdBy}
        </dd>
      </motion.div>
      <motion.div className="ticket-mobile-card__meta-item ticket-mobile-card__meta-item--full" variants={fieldVariants}>
        <dt>Status</dt>
        <dd>
          <span className="ticket-grid__sla-badge capitalize">
            <Calendar className="ticket-grid__sla-icon" aria-hidden />
            {status} · {formatJobDate(createdAt)}
          </span>
        </dd>
      </motion.div>
    </motion.dl>
  )

  const actions = showActions ? (
    animate ? (
      <motion.div className="ticket-mobile-card__actions" variants={actionsVariants}>
        <motion.div className="flex-1" whileTap={{ scale: 0.97 }}>
          <Button size="sm" className="ticket-mobile-card__action-primary w-full" onClick={onView}>
            View
            <ArrowRight className="ticket-grid__action-icon" aria-hidden />
          </Button>
        </motion.div>
        {onEdit ? (
          <motion.div className="flex-1" whileTap={{ scale: 0.97 }}>
            <Button
              size="sm"
              variant="outline"
              className="ticket-mobile-card__action-secondary w-full"
              onClick={onEdit}
            >
              <Pencil className="h-4 w-4" aria-hidden />
              Edit
            </Button>
          </motion.div>
        ) : null}
        {onDelete ? (
          <motion.div whileTap={{ scale: 0.9 }}>
            <Button
              size="sm"
              variant="destructive"
              className="ticket-mobile-card__action-delete shrink-0"
              onClick={onDelete}
              aria-label={`Delete job ${jobIdNumber}`}
            >
              <Trash2 className="h-4 w-4" aria-hidden />
            </Button>
          </motion.div>
        ) : null}
      </motion.div>
    ) : (
      <div className="ticket-mobile-card__actions">
        <Button size="sm" className="ticket-mobile-card__action-primary flex-1" onClick={onView}>
          View
          <ArrowRight className="ticket-grid__action-icon" aria-hidden />
        </Button>
        {onEdit ? (
          <Button
            size="sm"
            variant="outline"
            className="ticket-mobile-card__action-secondary flex-1"
            onClick={onEdit}
          >
            <Pencil className="h-4 w-4" aria-hidden />
            Edit
          </Button>
        ) : null}
        {onDelete ? (
          <Button
            size="sm"
            variant="destructive"
            className="ticket-mobile-card__action-delete shrink-0"
            onClick={onDelete}
            aria-label={`Delete job ${jobIdNumber}`}
          >
            <Trash2 className="h-4 w-4" aria-hidden />
          </Button>
        ) : null}
      </div>
    )
  ) : null

  return (
    <Card
      className={cn('ticket-mobile-card', className)}
      role="article"
      aria-label={`Job ${jobIdNumber}: ${description}`}
    >
      {animate ? (
        <motion.div
          initial="hidden"
          animate="visible"
          custom={animationDelay}
          variants={cardBodyVariants}
        >
          <button
            type="button"
            className="ticket-mobile-card__body"
            onClick={onView}
            aria-label={`View job ${jobIdNumber}`}
          >
            <motion.div variants={headerVariants}>{header}</motion.div>
            {animatedMeta}
          </button>
          {actions}
        </motion.div>
      ) : (
        <>
          <button
            type="button"
            className="ticket-mobile-card__body"
            onClick={onView}
            aria-label={`View job ${jobIdNumber}`}
          >
            {header}
            {meta}
          </button>
          {actions}
        </>
      )}
    </Card>
  )
}

export function JobMobileCardSkeleton() {
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
