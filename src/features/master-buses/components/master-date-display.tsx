import type { MasterBusGridRow } from '@/features/master-buses/types/master-bus'
import {
  getMasterDateHighlightStatus,
  masterDateHighlightClassName,
} from '@/lib/utils/master-dates'
import { cn } from '@/lib/utils'

type MasterBusDateField = keyof Pick<
  MasterBusGridRow,
  | 'insuranceValidity'
  | 'pollutionValidity'
  | 'fcValidity'
  | 'basePermitValidity'
  | 'homeTaxValidity'
  | 'aitpValidity'
  | 'aitpAuthorizationValidity'
  | 'serviceOutDate'
>

type MasterDateDisplayProps = {
  label: string
  dateValue?: string | null
  className?: string
}

export function MasterDateDisplay({ label, dateValue, className }: MasterDateDisplayProps) {
  const status = getMasterDateHighlightStatus(dateValue)

  return (
    <span className={cn(masterDateHighlightClassName(status), className)}>
      {label}
    </span>
  )
}

type MasterDateCellProps = {
  label: string
  dateValue?: string | null
}

export function MasterDateCell({ label, dateValue }: MasterDateCellProps) {
  if (!label.trim() || label.trim() === '—') {
    return <span className="text-muted-foreground">{label}</span>
  }

  return <MasterDateDisplay label={label} dateValue={dateValue} />
}

export type { MasterBusDateField }
