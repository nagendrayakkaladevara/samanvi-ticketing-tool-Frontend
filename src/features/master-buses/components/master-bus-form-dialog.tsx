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
import { MasterDatePicker } from '@/components/ui/master-date-picker'
import { Textarea } from '@/components/ui/textarea'
import { masterBusesService } from '@/features/master-buses/api/master-buses.service'
import type { CreateMasterBusInput, MasterBus, MasterBusFormValues } from '@/features/master-buses/types/master-bus'
import {
  defaultMasterBusFormValues,
  masterBusToFormValues,
} from '@/features/master-buses/utils/master-bus-model'
import { inputValueToMasterDate } from '@/lib/utils/master-dates'
import { queryClient } from '@/lib/query/query-client'

type FormMode = 'create' | 'edit'

type MasterBusFormDialogProps = {
  open: boolean
  mode: FormMode
  editingBus: MasterBus | null
  onOpenChange: (open: boolean) => void
}

function buildPayload(values: MasterBusFormValues, mode: FormMode): CreateMasterBusInput | null {
  const busNumber = values.busNumber.trim()
  const engineNumber = values.engineNumber.trim()
  const chassisNumber = values.chassisNumber.trim()
  const odometerRaw = values.odometer.trim()
  const insuranceValidity = inputValueToMasterDate(values.insuranceValidity)

  if (mode === 'create') {
    if (!busNumber) {
      toast.error('Bus number is required.')
      return null
    }
    if (!engineNumber) {
      toast.error('Engine number is required.')
      return null
    }
    if (!chassisNumber) {
      toast.error('Chassis number is required.')
      return null
    }
    if (!odometerRaw) {
      toast.error('Odometer reading is required.')
      return null
    }
    const odometer = Number(odometerRaw)
    if (!Number.isInteger(odometer) || odometer < 0) {
      toast.error('Odometer must be a whole number greater than or equal to 0.')
      return null
    }
    if (!insuranceValidity) {
      toast.error('Insurance validity date is required.')
      return null
    }
  }

  const payload: CreateMasterBusInput = {
    busNumber,
    engineNumber,
    chassisNumber,
    odometer: Number(odometerRaw),
    insuranceValidity: insuranceValidity ?? '',
  }

  const purchaseDate = inputValueToMasterDate(values.purchaseDate)
  const pollutionValidity = inputValueToMasterDate(values.pollutionValidity)
  const fcValidity = inputValueToMasterDate(values.fcValidity)
  const basePermitValidity = inputValueToMasterDate(values.basePermitValidity)
  const homeTaxValidity = inputValueToMasterDate(values.homeTaxValidity)
  const aitpValidity = inputValueToMasterDate(values.aitpValidity)
  const aitpAuthorizationValidity = inputValueToMasterDate(values.aitpAuthorizationValidity)
  const serviceOutDate = inputValueToMasterDate(values.serviceOutDate)
  const lastMaintenanceDate = inputValueToMasterDate(values.lastMaintenanceDate)
  const remarks = values.remarks.trim()

  if (purchaseDate) payload.purchaseDate = purchaseDate
  if (pollutionValidity) payload.pollutionValidity = pollutionValidity
  if (fcValidity) payload.fcValidity = fcValidity
  if (basePermitValidity) payload.basePermitValidity = basePermitValidity
  if (homeTaxValidity) payload.homeTaxValidity = homeTaxValidity
  if (aitpValidity) payload.aitpValidity = aitpValidity
  if (aitpAuthorizationValidity) payload.aitpAuthorizationValidity = aitpAuthorizationValidity
  if (serviceOutDate) payload.serviceOutDate = serviceOutDate
  if (lastMaintenanceDate) payload.lastMaintenanceDate = lastMaintenanceDate
  if (remarks) payload.remarks = remarks

  if (mode === 'edit' && !insuranceValidity) {
    delete (payload as Partial<CreateMasterBusInput>).insuranceValidity
  }

  return payload
}

export function MasterBusFormDialog({ open, mode, editingBus, onOpenChange }: MasterBusFormDialogProps) {
  const [formValues, setFormValues] = useState<MasterBusFormValues>(defaultMasterBusFormValues)

  useEffect(() => {
    if (!open) return
    if (mode === 'edit' && editingBus) {
      setFormValues(masterBusToFormValues(editingBus))
      return
    }
    setFormValues(defaultMasterBusFormValues)
  }, [open, mode, editingBus])

  const createMutation = useMutation({
    mutationFn: (payload: CreateMasterBusInput) => masterBusesService.create(payload),
    onSuccess: () => {
      toast.success('Bus created successfully.')
      queryClient.invalidateQueries({ queryKey: ['master-buses'] })
      queryClient.invalidateQueries({ queryKey: ['master-bus-numbers'] })
      onOpenChange(false)
    },
    onError: (mutationError) => {
      toast.error(mutationError instanceof Error ? mutationError.message : 'Failed to create bus.')
    },
  })

  const updateMutation = useMutation({
    mutationFn: (payload: CreateMasterBusInput) => {
      if (!editingBus) throw new Error('Unable to identify the selected bus.')
      return masterBusesService.update({ busId: editingBus.id, ...payload })
    },
    onSuccess: () => {
      toast.success('Bus updated successfully.')
      queryClient.invalidateQueries({ queryKey: ['master-buses'] })
      queryClient.invalidateQueries({ queryKey: ['master-bus-numbers'] })
      onOpenChange(false)
    },
    onError: (mutationError) => {
      toast.error(mutationError instanceof Error ? mutationError.message : 'Failed to update bus.')
    },
  })

  const isSaving = createMutation.isPending || updateMutation.isPending

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const payload = buildPayload(formValues, mode)
    if (!payload) return

    if (mode === 'create') {
      createMutation.mutate(payload)
      return
    }

    updateMutation.mutate(payload)
  }

  const updateField = <K extends keyof MasterBusFormValues>(key: K, value: MasterBusFormValues[K]) => {
    setFormValues((prev) => ({ ...prev, [key]: value }))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-5xl">
        <DialogHeader>
          <DialogTitle>{mode === 'create' ? 'Add Bus' : 'Edit Bus'}</DialogTitle>
          <DialogDescription>
            {mode === 'create'
              ? 'Register a new bus with engine, chassis, and compliance details.'
              : 'Update bus details. Bus number must remain unique across the fleet.'}
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-5" onSubmit={handleSubmit}>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-2 sm:col-span-2 lg:col-span-3">
              <Label htmlFor="busNumber">Bus Number</Label>
              <Input
                id="busNumber"
                value={formValues.busNumber}
                onChange={(event) => updateField('busNumber', event.target.value)}
                placeholder="e.g., TN-01-AB-1234"
                disabled={isSaving}
                maxLength={50}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="engineNumber">Engine Number</Label>
              <Input
                id="engineNumber"
                value={formValues.engineNumber}
                onChange={(event) => updateField('engineNumber', event.target.value)}
                disabled={isSaving}
                maxLength={80}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="chassisNumber">Chassis Number</Label>
              <Input
                id="chassisNumber"
                value={formValues.chassisNumber}
                onChange={(event) => updateField('chassisNumber', event.target.value)}
                disabled={isSaving}
                maxLength={80}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="odometer">Odometer (km)</Label>
              <Input
                id="odometer"
                type="number"
                min={0}
                step={1}
                value={formValues.odometer}
                onChange={(event) => updateField('odometer', event.target.value)}
                disabled={isSaving}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="purchaseDate">Purchase Date</Label>
              <MasterDatePicker
                id="purchaseDate"
                value={formValues.purchaseDate}
                onChange={(value) => updateField('purchaseDate', value)}
                disabled={isSaving}
                placeholder="Pick purchase date"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="insuranceValidity">Insurance Validity</Label>
              <MasterDatePicker
                id="insuranceValidity"
                value={formValues.insuranceValidity}
                onChange={(value) => updateField('insuranceValidity', value)}
                disabled={isSaving}
                required={mode === 'create'}
                placeholder="Pick insurance validity"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="lastMaintenanceDate">Last Maintenance</Label>
              <MasterDatePicker
                id="lastMaintenanceDate"
                value={formValues.lastMaintenanceDate}
                onChange={(value) => updateField('lastMaintenanceDate', value)}
                disabled={isSaving}
                placeholder="Pick last maintenance date"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="pollutionValidity">Pollution Validity</Label>
              <MasterDatePicker
                id="pollutionValidity"
                value={formValues.pollutionValidity}
                onChange={(value) => updateField('pollutionValidity', value)}
                disabled={isSaving}
                placeholder="Pick pollution validity"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="fcValidity">FC Validity</Label>
              <MasterDatePicker
                id="fcValidity"
                value={formValues.fcValidity}
                onChange={(value) => updateField('fcValidity', value)}
                disabled={isSaving}
                placeholder="Pick FC validity"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="basePermitValidity">Base Permit Validity</Label>
              <MasterDatePicker
                id="basePermitValidity"
                value={formValues.basePermitValidity}
                onChange={(value) => updateField('basePermitValidity', value)}
                disabled={isSaving}
                placeholder="Pick base permit validity"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="homeTaxValidity">Home Tax Validity</Label>
              <MasterDatePicker
                id="homeTaxValidity"
                value={formValues.homeTaxValidity}
                onChange={(value) => updateField('homeTaxValidity', value)}
                disabled={isSaving}
                placeholder="Pick home tax validity"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="aitpValidity">AITP Validity</Label>
              <MasterDatePicker
                id="aitpValidity"
                value={formValues.aitpValidity}
                onChange={(value) => updateField('aitpValidity', value)}
                disabled={isSaving}
                placeholder="Pick AITP validity"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="aitpAuthorizationValidity">AITP Authorization Validity</Label>
              <MasterDatePicker
                id="aitpAuthorizationValidity"
                value={formValues.aitpAuthorizationValidity}
                onChange={(value) => updateField('aitpAuthorizationValidity', value)}
                disabled={isSaving}
                placeholder="Pick AITP authorization validity"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="serviceOutDate">Service Out Date</Label>
              <MasterDatePicker
                id="serviceOutDate"
                value={formValues.serviceOutDate}
                onChange={(value) => updateField('serviceOutDate', value)}
                disabled={isSaving}
                placeholder="Pick service out date"
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
                rows={2}
                placeholder="Optional notes about this bus"
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {mode === 'create' ? 'Add Bus' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
