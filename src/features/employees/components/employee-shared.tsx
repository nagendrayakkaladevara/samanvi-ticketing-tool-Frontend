import { useRef, useState, type ChangeEvent } from 'react'
import { ImagePlus, Loader2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { FormLabel } from '@/components/ui/form-label'
import { fileToBase64 } from '@/lib/utils/file-to-base64'
import { MasterDateDetailField } from '@/components/master-date-detail-field'
import { cn } from '@/lib/utils'

type DocumentUploadFieldProps = {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  disabled?: boolean
  required?: boolean
  hint?: string
}

export function DocumentUploadField({
  id,
  label,
  value,
  onChange,
  disabled = false,
  required = false,
  hint,
}: DocumentUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [isReading, setIsReading] = useState(false)

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return

    if (!file.type.startsWith('image/')) {
      return
    }

    setIsReading(true)
    try {
      const base64 = await fileToBase64(file)
      onChange(base64)
    } finally {
      setIsReading(false)
    }
  }

  return (
    <div className="space-y-2">
      <FormLabel htmlFor={id} required={required}>
        {label}
      </FormLabel>
      <div
        className={cn(
          'flex flex-col gap-3 rounded-xl border border-dashed bg-muted/20 p-3',
          value && 'border-solid border-border bg-background',
        )}
      >
        {value ? (
          <img
            src={value.startsWith('data:') ? value : `data:image/jpeg;base64,${value}`}
            alt={label}
            className="h-28 w-full rounded-lg object-cover"
          />
        ) : (
          <div className="flex h-28 items-center justify-center rounded-lg border border-dashed bg-muted/30 text-xs text-muted-foreground">
            No document uploaded
          </div>
        )}
        <div className="flex flex-wrap items-center gap-2">
          <input
            ref={inputRef}
            id={id}
            type="file"
            accept="image/*"
            className="hidden"
            disabled={disabled || isReading}
            onChange={handleFileChange}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={disabled || isReading}
            onClick={() => inputRef.current?.click()}
          >
            {isReading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ImagePlus className="h-3.5 w-3.5" />}
            {value ? 'Replace' : 'Upload'}
          </Button>
          {value ? (
            <Button type="button" variant="ghost" size="sm" disabled={disabled || isReading} onClick={() => onChange('')}>
              Remove
            </Button>
          ) : null}
        </div>
        {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
      </div>
    </div>
  )
}

export function EmployeeFormSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3 border-t pt-4 first:border-t-0 first:pt-0">
      <p className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">{title}</p>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{children}</div>
    </div>
  )
}

export function EmployeeDetailItem({
  label,
  value,
  dateValue,
}: {
  label: string
  value: string | null | undefined
  dateValue?: string | null
}) {
  const displayValue = value?.trim() ? value : '—'

  if (dateValue) {
    return <MasterDateDetailField label={label} value={displayValue} dateValue={dateValue} />
  }

  return (
    <div className="space-y-1 rounded-lg border bg-muted/20 px-3 py-2.5">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="text-sm font-medium text-foreground">{displayValue}</p>
    </div>
  )
}

export function EmployeeFormLoadingState() {
  return (
    <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
      <Loader2 className="h-4 w-4 animate-spin" />
      Loading employee details...
    </div>
  )
}

export function EmployeeDocumentPreview({ label, base64 }: { label: string; base64?: string | null }) {
  if (!base64) return null

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <img
        src={base64.startsWith('data:') ? base64 : `data:image/jpeg;base64,${base64}`}
        alt={label}
        className="max-h-48 w-full rounded-lg border object-contain bg-muted/20"
      />
    </div>
  )
}
