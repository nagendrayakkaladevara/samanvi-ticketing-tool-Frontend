import { useEffect, useState, type FormEvent } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
import { toast } from '@/lib/toast'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { FieldError } from '@/components/ui/field-error'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { garageService } from '@/features/garage/api/garage.service'
import type {
  CreateRepairPartInput,
  RepairPart,
  RepairPartFormValues,
} from '@/features/garage/types/repair-part'
import {
  getRepairPartFieldError,
  validateRepairPartForm,
  type RepairPartFormField,
} from '@/features/garage/utils/repair-part-model'
import { invalidFieldClass } from '@/lib/form/form-field-styles'
import { queryClient } from '@/lib/query/query-client'
import { cn } from '@/lib/utils'

type FormMode = 'create' | 'edit'

const defaultFormValues: RepairPartFormValues = {
  partName: '',
  price: '',
  description: '',
}

type RepairPartFormDialogProps = {
  open: boolean
  mode: FormMode
  editingPart: RepairPart | null
  onOpenChange: (open: boolean) => void
}

export function RepairPartFormDialog({ open, mode, editingPart, onOpenChange }: RepairPartFormDialogProps) {
  const [formValues, setFormValues] = useState<RepairPartFormValues>(defaultFormValues)
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<RepairPartFormField, string>>>({})

  useEffect(() => {
    if (!open) return

    if (mode === 'edit' && editingPart) {
      setFormValues({
        partName: editingPart.partName,
        price: editingPart.price,
        description: editingPart.description ?? '',
      })
      setFieldErrors({})
      return
    }

    setFormValues(defaultFormValues)
    setFieldErrors({})
  }, [open, mode, editingPart])

  const createMutation = useMutation({
    mutationFn: (payload: CreateRepairPartInput) => garageService.createRepairPart(payload),
    onSuccess: () => {
      toast.success('Repair part created successfully.')
      queryClient.invalidateQueries({ queryKey: ['garage', 'repair-parts'] })
      onOpenChange(false)
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to create repair part.')
    },
  })

  const updateMutation = useMutation({
    mutationFn: (payload: CreateRepairPartInput) => {
      if (!editingPart) throw new Error('Unable to identify the selected repair part.')
      return garageService.updateRepairPart({
        partId: editingPart.id,
        partName: payload.partName,
        price: payload.price,
        description: payload.description ?? null,
      })
    },
    onSuccess: () => {
      toast.success('Repair part updated successfully.')
      queryClient.invalidateQueries({ queryKey: ['garage', 'repair-parts'] })
      onOpenChange(false)
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to update repair part.')
    },
  })

  const isSaving = createMutation.isPending || updateMutation.isPending

  const updateField = (field: RepairPartFormField, value: string) => {
    setFormValues((prev) => ({ ...prev, [field]: value }))
    setFieldErrors((prev) => ({ ...prev, [field]: undefined }))
  }

  const blurField = (field: RepairPartFormField) => {
    const error = getRepairPartFieldError(field, formValues)
    setFieldErrors((prev) => ({ ...prev, [field]: error }))
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const nextErrors = validateRepairPartForm(formValues)
    if (Object.keys(nextErrors).length > 0) {
      setFieldErrors(nextErrors)
      toast.error(Object.values(nextErrors)[0] ?? 'Please fix the highlighted fields.')
      return
    }

    const payload: CreateRepairPartInput = {
      partName: formValues.partName.trim(),
      price: Number.parseFloat(formValues.price.trim()),
    }

    const trimmedDescription = formValues.description.trim()
    if (trimmedDescription) {
      payload.description = trimmedDescription
    }

    if (mode === 'create') {
      createMutation.mutate(payload)
      return
    }

    updateMutation.mutate(payload)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{mode === 'create' ? 'Add Repair Part' : 'Edit Repair Part'}</DialogTitle>
          <DialogDescription>
            {mode === 'create'
              ? 'Add a spare part to the catalog with its current unit price.'
              : 'Update part details. Existing job attachments keep their snapshotted prices.'}
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="partName">Part Name</Label>
            <Input
              id="partName"
              value={formValues.partName}
              onChange={(event) => updateField('partName', event.target.value)}
              onBlur={() => blurField('partName')}
              placeholder="e.g., Oil Filter, Brake Pad Set"
              disabled={isSaving}
              maxLength={120}
              autoFocus
              aria-invalid={Boolean(fieldErrors.partName)}
              className={cn(fieldErrors.partName && invalidFieldClass)}
            />
            {fieldErrors.partName ? (
              <FieldError message={fieldErrors.partName} />
            ) : (
              <p className="text-xs text-muted-foreground">{formValues.partName.trim().length}/120 characters</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="price">Unit Price</Label>
            <Input
              id="price"
              type="number"
              inputMode="decimal"
              min="0"
              step="0.01"
              value={formValues.price}
              onChange={(event) => updateField('price', event.target.value)}
              onBlur={() => blurField('price')}
              placeholder="0.00"
              disabled={isSaving}
              aria-invalid={Boolean(fieldErrors.price)}
              className={cn(fieldErrors.price && invalidFieldClass)}
            />
            {fieldErrors.price ? (
              <FieldError message={fieldErrors.price} />
            ) : (
              <p className="text-xs text-muted-foreground">Non-negative amount stored with two decimal places.</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (optional)</Label>
            <Textarea
              id="description"
              value={formValues.description}
              onChange={(event) => updateField('description', event.target.value)}
              onBlur={() => blurField('description')}
              placeholder="Part specifications or usage notes"
              disabled={isSaving}
              maxLength={500}
              rows={3}
              aria-invalid={Boolean(fieldErrors.description)}
              className={cn(fieldErrors.description && invalidFieldClass)}
            />
            {fieldErrors.description ? (
              <FieldError message={fieldErrors.description} />
            ) : (
              <p className="text-xs text-muted-foreground">{formValues.description.trim().length}/500 characters</p>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {mode === 'create' ? 'Add Part' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
