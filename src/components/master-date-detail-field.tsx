import {
  getMasterDateHighlightStatus,
  type MasterDateHighlightStatus,
} from '@/lib/utils/master-dates'
import { cn } from '@/lib/utils'

function highlightContainerClass(status: MasterDateHighlightStatus): string {
  if (status === 'expired') return 'border-destructive/60 bg-destructive/10'
  if (status === 'warning') return 'border-orange-500/60 bg-orange-500/10'
  return ''
}

function highlightTextClass(status: MasterDateHighlightStatus): string {
  if (status === 'expired') return 'text-destructive'
  if (status === 'warning') return 'text-orange-600 dark:text-orange-400'
  return ''
}

type MasterDateDetailFieldProps = {
  label: string
  value: string
  dateValue?: string | null
  className?: string
  valueClassName?: string
}

export function MasterDateDetailField({
  label,
  value,
  dateValue,
  className,
  valueClassName,
}: MasterDateDetailFieldProps) {
  const status = dateValue ? getMasterDateHighlightStatus(dateValue) : null
  const empty = !value.trim() || value.trim() === '—'

  return (
    <div
      className={cn(
        'space-y-1 rounded-lg border bg-muted/20 px-3 py-2.5',
        highlightContainerClass(status),
        className,
      )}
    >
      <p
        className={cn(
          'text-xs font-medium uppercase tracking-wide text-muted-foreground',
          highlightTextClass(status),
        )}
      >
        {label}
      </p>
      <p
        className={cn(
          'text-sm font-medium text-foreground',
          empty && 'text-muted-foreground',
          highlightTextClass(status),
          valueClassName,
        )}
      >
        {value}
      </p>
    </div>
  )
}
