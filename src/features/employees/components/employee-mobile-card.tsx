import { Eye, IdCard, Pencil, Phone, Trash2 } from 'lucide-react'
import { motion, useReducedMotion } from 'framer-motion'
import type { ComponentType, ReactNode } from 'react'

import '@/features/tickets/styles/tickets-grid.css'

import { MasterDateDetailField } from '@/components/master-date-detail-field'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { useIsMobile } from '@/hooks/use-mobile'
import { cn } from '@/lib/utils'

export type EmployeeMobileField<T> = {
  label: string
  getValue: (item: T) => ReactNode
  fullWidth?: boolean
  getDateValue?: (item: T) => string | null | undefined
}

type EmployeeMobileCardProps<T> = {
  item: T
  index: number
  badge: ReactNode
  meta?: ReactNode
  fields: EmployeeMobileField<T>[]
  sectionTitle?: string
  sectionIcon?: ComponentType<{ className?: string }>
  canEdit?: boolean
  canDelete?: boolean
  onView: (item: T) => void
  onEdit: (item: T) => void
  onDelete: (item: T) => void
  animationDelay?: number
  className?: string
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

function isEmptyLabel(value: unknown): boolean {
  if (value == null) return true
  if (typeof value === 'string') {
    const trimmed = value.trim()
    return !trimmed || trimmed === '—'
  }
  return false
}

function fieldToDisplay(value: ReactNode): string {
  if (value == null) return '—'
  if (typeof value === 'string' || typeof value === 'number') return String(value)
  return ''
}

function DetailCell({
  label,
  value,
  dateValue,
  fullWidth = false,
  animate,
}: {
  label: string
  value: ReactNode
  dateValue?: string | null
  fullWidth?: boolean
  animate: boolean
}) {
  const display = fieldToDisplay(value)
  const empty = isEmptyLabel(display) && (typeof value === 'string' || value == null)

  const content =
    dateValue !== undefined ? (
      <MasterDateDetailField
        label={label}
        value={display || '—'}
        dateValue={dateValue}
        className={cn(fullWidth && 'employee-mobile-card__field--full')}
        valueClassName={empty ? 'font-medium italic text-muted-foreground/75' : undefined}
      />
    ) : typeof value !== 'string' && value != null && typeof value !== 'number' ? (
      <div className={cn('employee-mobile-card__field', fullWidth && 'employee-mobile-card__field--full')}>
        <dt>{label}</dt>
        <dd>{value}</dd>
      </div>
    ) : (
      <div className={cn('employee-mobile-card__field', fullWidth && 'employee-mobile-card__field--full')}>
        <dt>{label}</dt>
        <dd className={cn(empty && 'employee-mobile-card__value--empty')}>{display || '—'}</dd>
      </div>
    )

  if (!animate) return content

  return (
    <motion.div
      variants={fieldVariants}
      className={cn(fullWidth && 'employee-mobile-card__field--full')}
    >
      {content}
    </motion.div>
  )
}

export function EmployeeMobileCard<T>({
  item,
  index,
  badge,
  meta,
  fields,
  sectionTitle = 'Details',
  sectionIcon: SectionIcon = IdCard,
  canEdit = false,
  canDelete = false,
  onView,
  onEdit,
  onDelete,
  animationDelay = 0,
  className,
}: EmployeeMobileCardProps<T>) {
  const isMobile = useIsMobile()
  const shouldReduceMotion = useReducedMotion()
  const animate = isMobile && !shouldReduceMotion

  const body = animate ? (
    <motion.section className="employee-mobile-card__section" variants={sectionVariants}>
      <motion.h4 className="employee-mobile-card__section-title" variants={fieldVariants}>
        <SectionIcon className="employee-mobile-card__section-icon" aria-hidden />
        {sectionTitle}
      </motion.h4>
      <motion.dl className="employee-mobile-card__grid" variants={sectionVariants}>
        {fields.map((field) => (
          <DetailCell
            key={field.label}
            label={field.label}
            value={field.getValue(item)}
            dateValue={field.getDateValue?.(item)}
            fullWidth={field.fullWidth}
            animate={animate}
          />
        ))}
      </motion.dl>
    </motion.section>
  ) : (
    <section className="employee-mobile-card__section">
      <h4 className="employee-mobile-card__section-title">
        <SectionIcon className="employee-mobile-card__section-icon" aria-hidden />
        {sectionTitle}
      </h4>
      <dl className="employee-mobile-card__grid">
        {fields.map((field) => (
          <DetailCell
            key={field.label}
            label={field.label}
            value={field.getValue(item)}
            dateValue={field.getDateValue?.(item)}
            fullWidth={field.fullWidth}
            animate={false}
          />
        ))}
      </dl>
    </section>
  )

  const actions = animate ? (
    <motion.div className="employee-mobile-card__actions" variants={actionsVariants}>
      <motion.div className="flex-1" whileTap={{ scale: 0.97 }}>
        <Button
          size="sm"
          variant="outline"
          className="employee-mobile-card__action w-full"
          onClick={() => onView(item)}
        >
          <Eye className="h-3.5 w-3.5" aria-hidden />
          View
        </Button>
      </motion.div>
      {canEdit ? (
        <motion.div className="flex-1" whileTap={{ scale: 0.97 }}>
          <Button
            size="sm"
            variant="outline"
            className="employee-mobile-card__action w-full"
            onClick={() => onEdit(item)}
          >
            <Pencil className="h-3.5 w-3.5" aria-hidden />
            Edit
          </Button>
        </motion.div>
      ) : null}
      {canDelete ? (
        <motion.div className="flex-1" whileTap={{ scale: 0.97 }}>
          <Button
            size="sm"
            variant="destructive"
            className="employee-mobile-card__action w-full border-red-600 bg-red-600 text-white hover:bg-red-700"
            onClick={() => onDelete(item)}
          >
            <Trash2 className="h-3.5 w-3.5" aria-hidden />
            Delete
          </Button>
        </motion.div>
      ) : null}
    </motion.div>
  ) : (
    <div className="employee-mobile-card__actions">
      <Button
        size="sm"
        variant="outline"
        className="employee-mobile-card__action flex-1"
        onClick={() => onView(item)}
      >
        <Eye className="h-3.5 w-3.5" aria-hidden />
        View
      </Button>
      {canEdit ? (
        <Button
          size="sm"
          variant="outline"
          className="employee-mobile-card__action flex-1"
          onClick={() => onEdit(item)}
        >
          <Pencil className="h-3.5 w-3.5" aria-hidden />
          Edit
        </Button>
      ) : null}
      {canDelete ? (
        <Button
          size="sm"
          variant="destructive"
          className="employee-mobile-card__action flex-1 border-red-600 bg-red-600 text-white hover:bg-red-700"
          onClick={() => onDelete(item)}
        >
          <Trash2 className="h-3.5 w-3.5" aria-hidden />
          Delete
        </Button>
      ) : null}
    </div>
  )

  return (
    <div className="space-y-1">
      <p className="px-1 text-xs text-muted-foreground">S.No {index + 1}</p>
      <Card className={cn('employee-mobile-card', className)} role="article">
        {animate ? (
          <motion.div
            initial="hidden"
            animate="visible"
            custom={animationDelay}
            variants={cardBodyVariants}
          >
            <motion.div className="employee-mobile-card__header" variants={headerVariants}>
              <div className="employee-mobile-card__badge-wrap">{badge}</div>
              {meta ? (
                <span className="employee-mobile-card__meta">
                  {typeof meta === 'string' && !meta.startsWith('@') ? (
                    <>
                      <Phone className="employee-mobile-card__meta-icon" aria-hidden />
                      {meta}
                    </>
                  ) : (
                    meta
                  )}
                </span>
              ) : null}
            </motion.div>
            <motion.div className="employee-mobile-card__body" variants={cardBodyVariants} custom={0}>
              {body}
            </motion.div>
            {actions}
          </motion.div>
        ) : (
          <>
            <div className="employee-mobile-card__header">
              <div className="employee-mobile-card__badge-wrap">{badge}</div>
              {meta ? (
                <span className="employee-mobile-card__meta">
                  {typeof meta === 'string' && !meta.startsWith('@') ? (
                    <>
                      <Phone className="employee-mobile-card__meta-icon" aria-hidden />
                      {meta}
                    </>
                  ) : (
                    meta
                  )}
                </span>
              ) : null}
            </div>
            <div className="employee-mobile-card__body">{body}</div>
            {actions}
          </>
        )}
      </Card>
    </div>
  )
}

export function EmployeeMobileCardSkeleton() {
  return (
    <Card className="employee-mobile-card employee-mobile-card--skeleton" aria-hidden>
      <div className="employee-mobile-card__header">
        <div className="h-7 w-28 rounded-md bg-muted" />
        <div className="h-5 w-24 rounded-md bg-muted" />
      </div>
      <div className="employee-mobile-card__body space-y-4 p-4 pt-0">
        <div className="grid grid-cols-2 gap-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-12 rounded-md bg-muted/70" />
          ))}
        </div>
      </div>
      <div className="employee-mobile-card__actions">
        <div className="h-9 flex-1 rounded-md bg-muted" />
        <div className="h-9 flex-1 rounded-md bg-muted" />
        <div className="h-9 flex-1 rounded-md bg-muted" />
      </div>
    </Card>
  )
}
