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
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { serviceNumbersService } from '@/features/service-numbers/api/service-numbers.service'
import type { CreateServiceNumberInput, ServiceNumber } from '@/features/service-numbers/types/service-number'
import {
  buildServiceNumberPayload,
  defaultServiceNumberFormValues,
  serviceNumberToFormValues,
} from '@/features/service-numbers/utils/service-number-model'
import type { ServiceFor } from '@/features/service-for/types/service-for'
import { queryClient } from '@/lib/query/query-client'

type FormMode = 'create' | 'edit'

type ServiceNumberFormDialogProps = {
  open: boolean
  mode: FormMode
  editingItem: ServiceNumber | null
  serviceForOptions: ServiceFor[]
  onOpenChange: (open: boolean) => void
}

export function ServiceNumberFormDialog({
  open,
  mode,
  editingItem,
  serviceForOptions,
  onOpenChange,
}: ServiceNumberFormDialogProps) {
  const [formValues, setFormValues] = useState(defaultServiceNumberFormValues)

  useEffect(() => {
    if (!open) return
    if (mode === 'edit' && editingItem) {
      setFormValues(serviceNumberToFormValues(editingItem))
      return
    }
    setFormValues(defaultServiceNumberFormValues)
  }, [open, mode, editingItem])

  const createMutation = useMutation({
    mutationFn: (payload: CreateServiceNumberInput) => serviceNumbersService.create(payload),
    onSuccess: () => {
      toast.success('Service number created successfully.')
      queryClient.invalidateQueries({ queryKey: ['service-numbers'] })
      onOpenChange(false)
    },
    onError: (mutationError) => {
      toast.error(mutationError instanceof Error ? mutationError.message : 'Failed to create service number.')
    },
  })

  const updateMutation = useMutation({
    mutationFn: (payload: CreateServiceNumberInput) => {
      if (!editingItem) throw new Error('Unable to identify the selected service number.')
      return serviceNumbersService.update({ serviceNumberId: editingItem.id, ...payload })
    },
    onSuccess: () => {
      toast.success('Service number updated successfully.')
      queryClient.invalidateQueries({ queryKey: ['service-numbers'] })
      onOpenChange(false)
    },
    onError: (mutationError) => {
      toast.error(mutationError instanceof Error ? mutationError.message : 'Failed to update service number.')
    },
  })

  const isSaving = createMutation.isPending || updateMutation.isPending

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    try {
      const payload = buildServiceNumberPayload(formValues)
      if (mode === 'create') {
        createMutation.mutate(payload)
        return
      }
      updateMutation.mutate(payload)
    } catch (validationError) {
      toast.error(validationError instanceof Error ? validationError.message : 'Invalid form values.')
    }
  }

  const updateField = <K extends keyof typeof formValues>(key: K, value: (typeof formValues)[K]) => {
    setFormValues((prev) => ({ ...prev, [key]: value }))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-5xl">
        <DialogHeader>
          <DialogTitle>{mode === 'create' ? 'Add Service Number' : 'Edit Service Number'}</DialogTitle>
          <DialogDescription>
            {mode === 'create'
              ? 'Define a route with fare amounts, beta rates, and optional crew assignments.'
              : 'Update route details, amounts, and crew information for this service number.'}
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-5" onSubmit={handleSubmit}>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="serviceForId">Service For</Label>
              <Select
                value={formValues.serviceForId || undefined}
                onValueChange={(value) => updateField('serviceForId', value)}
                disabled={isSaving}
              >
                <SelectTrigger id="serviceForId">
                  <SelectValue placeholder="Select service type" />
                </SelectTrigger>
                <SelectContent>
                  {serviceForOptions.map((option) => (
                    <SelectItem key={option.id} value={option.id}>
                      {option.serviceFor}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="serviceNo">Service Number</Label>
              <Input
                id="serviceNo"
                value={formValues.serviceNo}
                onChange={(event) => updateField('serviceNo', event.target.value)}
                placeholder="e.g., SRV-101"
                disabled={isSaving}
                maxLength={50}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="distance">Distance (km)</Label>
              <Input
                id="distance"
                type="number"
                min={0}
                step="0.01"
                value={formValues.distance}
                onChange={(event) => updateField('distance', event.target.value)}
                disabled={isSaving}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="from">From</Label>
              <Input
                id="from"
                value={formValues.from}
                onChange={(event) => updateField('from', event.target.value)}
                placeholder="Origin city"
                disabled={isSaving}
                maxLength={120}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="to">To</Label>
              <Input
                id="to"
                value={formValues.to}
                onChange={(event) => updateField('to', event.target.value)}
                placeholder="Destination city"
                disabled={isSaving}
                maxLength={120}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="via">Via</Label>
              <Input
                id="via"
                value={formValues.via}
                onChange={(event) => updateField('via', event.target.value)}
                placeholder="Via route"
                disabled={isSaving}
                maxLength={120}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="parkingAmount">Parking Amount</Label>
              <Input
                id="parkingAmount"
                type="number"
                min={0}
                step="0.01"
                value={formValues.parkingAmount}
                onChange={(event) => updateField('parkingAmount', event.target.value)}
                disabled={isSaving}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="driverOneBeta">Driver One Beta</Label>
              <Input
                id="driverOneBeta"
                type="number"
                min={0}
                step="0.01"
                value={formValues.driverOneBeta}
                onChange={(event) => updateField('driverOneBeta', event.target.value)}
                disabled={isSaving}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="driverTwoBeta">Driver Two Beta</Label>
              <Input
                id="driverTwoBeta"
                type="number"
                min={0}
                step="0.01"
                value={formValues.driverTwoBeta}
                onChange={(event) => updateField('driverTwoBeta', event.target.value)}
                disabled={isSaving}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="helperBeta">Helper Beta</Label>
              <Input
                id="helperBeta"
                type="number"
                min={0}
                step="0.01"
                value={formValues.helperBeta}
                onChange={(event) => updateField('helperBeta', event.target.value)}
                disabled={isSaving}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="conductorBeta">Conductor Beta</Label>
              <Input
                id="conductorBeta"
                type="number"
                min={0}
                step="0.01"
                value={formValues.conductorBeta}
                onChange={(event) => updateField('conductorBeta', event.target.value)}
                disabled={isSaving}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="optDriver">Optional Driver</Label>
              <Input
                id="optDriver"
                value={formValues.optDriver}
                onChange={(event) => updateField('optDriver', event.target.value)}
                disabled={isSaving}
                maxLength={120}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="optHelper">Optional Helper</Label>
              <Input
                id="optHelper"
                value={formValues.optHelper}
                onChange={(event) => updateField('optHelper', event.target.value)}
                disabled={isSaving}
                maxLength={120}
                required
              />
            </div>

            <div className="space-y-2 sm:col-span-2 lg:col-span-3">
              <Label htmlFor="remarks">Remarks</Label>
              <Textarea
                id="remarks"
                value={formValues.remarks}
                onChange={(event) => updateField('remarks', event.target.value)}
                disabled={isSaving}
                maxLength={500}
                rows={3}
                placeholder="Notes about this service route"
                required
              />
              <p className="text-xs text-muted-foreground">{formValues.remarks.trim().length}/500 characters</p>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {mode === 'create' ? 'Add Service Number' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
