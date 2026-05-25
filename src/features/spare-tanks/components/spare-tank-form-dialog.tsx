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
import { spareTanksService } from '@/features/spare-tanks/api/spare-tanks.service'
import type { CreateSpareTankInput, SpareTank, SpareTankFormValues } from '@/features/spare-tanks/types/spare-tank'
import { BusNumberAutocomplete } from '@/features/tickets/components/bus-number-autocomplete'
import { queryClient } from '@/lib/query/query-client'

type FormMode = 'create' | 'edit'

const defaultFormValues: SpareTankFormValues = {
  busNumber: '',
  ownerName: '',
}

type SpareTankFormDialogProps = {
  open: boolean
  mode: FormMode
  editingItem: SpareTank | null
  onOpenChange: (open: boolean) => void
}

export function SpareTankFormDialog({ open, mode, editingItem, onOpenChange }: SpareTankFormDialogProps) {
  const [formValues, setFormValues] = useState<SpareTankFormValues>(defaultFormValues)

  useEffect(() => {
    if (!open) return
    if (mode === 'edit' && editingItem) {
      setFormValues({
        busNumber: editingItem.busNumber,
        ownerName: editingItem.ownerName,
      })
      return
    }
    setFormValues(defaultFormValues)
  }, [open, mode, editingItem])

  const createMutation = useMutation({
    mutationFn: (payload: CreateSpareTankInput) => spareTanksService.create(payload),
    onSuccess: () => {
      toast.success('Spare tank created successfully.')
      queryClient.invalidateQueries({ queryKey: ['spare-tanks'] })
      onOpenChange(false)
    },
    onError: (mutationError) => {
      toast.error(mutationError instanceof Error ? mutationError.message : 'Failed to create spare tank.')
    },
  })

  const updateMutation = useMutation({
    mutationFn: (payload: CreateSpareTankInput) => {
      if (!editingItem) throw new Error('Unable to identify the selected spare tank.')
      return spareTanksService.update({
        spareTankId: editingItem.id,
        busNumber: payload.busNumber,
        ownerName: payload.ownerName,
      })
    },
    onSuccess: () => {
      toast.success('Spare tank updated successfully.')
      queryClient.invalidateQueries({ queryKey: ['spare-tanks'] })
      onOpenChange(false)
    },
    onError: (mutationError) => {
      toast.error(mutationError instanceof Error ? mutationError.message : 'Failed to update spare tank.')
    },
  })

  const isSaving = createMutation.isPending || updateMutation.isPending

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const busNumber = formValues.busNumber.trim()
    const ownerName = formValues.ownerName.trim()

    if (!busNumber) {
      toast.error('Bus number is required.')
      return
    }
    if (busNumber.length > 50) {
      toast.error('Bus number must be 50 characters or fewer.')
      return
    }
    if (!ownerName) {
      toast.error('Owner name is required.')
      return
    }
    if (ownerName.length > 120) {
      toast.error('Owner name must be 120 characters or fewer.')
      return
    }

    const payload = { busNumber, ownerName }

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
          <DialogTitle>{mode === 'create' ? 'Add Spare Tank' : 'Edit Spare Tank'}</DialogTitle>
          <DialogDescription>
            {mode === 'create'
              ? 'Enter a bus number and owner details. The bus number does not need to exist in the Normal Bus master.'
              : 'Update the bus number or owner name for this spare tank.'}
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="spareTankBusNumber">Bus Number</Label>
            <BusNumberAutocomplete
              id="spareTankBusNumber"
              value={formValues.busNumber}
              onChange={(nextValue) => setFormValues((prev) => ({ ...prev, busNumber: nextValue }))}
              placeholder="e.g., EXT-9999"
              disabled={isSaving}
              source="master"
              maxLength={50}
            />
            <p className="text-xs text-muted-foreground">
              Stored as uppercase. Suggestions come from Normal Bus master but any value is allowed.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="ownerName">Owner Name</Label>
            <Input
              id="ownerName"
              value={formValues.ownerName}
              onChange={(event) => setFormValues((prev) => ({ ...prev, ownerName: event.target.value }))}
              placeholder="e.g., Ravi Kumar"
              disabled={isSaving}
              maxLength={120}
              required
            />
            <p className="text-xs text-muted-foreground">{formValues.ownerName.trim().length}/120 characters</p>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {mode === 'create' ? 'Add Spare Tank' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
