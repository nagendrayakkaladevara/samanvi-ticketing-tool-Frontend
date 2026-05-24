import { useState } from 'react'
import { CalendarIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  dateToInputValue,
  formatMasterDateDisplay,
  inputValueToDate,
  inputValueToMasterDate,
} from '@/lib/utils/master-dates'
import { cn } from '@/lib/utils'

type MasterDatePickerProps = {
  id?: string
  value: string
  onChange: (value: string) => void
  disabled?: boolean
  placeholder?: string
  required?: boolean
  className?: string
}

export function MasterDatePicker({
  id,
  value,
  onChange,
  disabled = false,
  placeholder = 'Pick a date',
  required = false,
  className,
}: MasterDatePickerProps) {
  const [open, setOpen] = useState(false)
  const selectedDate = inputValueToDate(value)
  const masterDate = value ? inputValueToMasterDate(value) : undefined
  const displayValue = masterDate ? formatMasterDateDisplay(masterDate) : null

  return (
    <Popover open={open} onOpenChange={setOpen} modal>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          disabled={disabled}
          className={cn(
            'w-full justify-start text-left font-normal',
            !displayValue && 'text-muted-foreground',
            className,
          )}
          aria-required={required}
        >
          <CalendarIcon />
          {displayValue ?? placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="z-[100] w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={(date) => {
            onChange(date ? dateToInputValue(date) : '')
            setOpen(false)
          }}
          defaultMonth={selectedDate}
        />
      </PopoverContent>
    </Popover>
  )
}
