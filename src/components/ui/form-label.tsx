import type { ComponentPropsWithoutRef } from 'react'

import { Label } from '@/components/ui/label'
import { RequiredBadge } from '@/components/ui/required-badge'

type FormLabelProps = ComponentPropsWithoutRef<typeof Label> & {
  required?: boolean
}

export function FormLabel({ required = false, children, ...props }: FormLabelProps) {
  return (
    <Label {...props}>
      {children}
      {required ? <RequiredBadge /> : null}
    </Label>
  )
}
