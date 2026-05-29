import { useEffect, useMemo, useState, type FormEvent } from 'react'
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
import { Skeleton } from '@/components/ui/skeleton'
import { garageService } from '@/features/garage/api/garage.service'
import { useRepairPartsQuery } from '@/features/garage/hooks/use-repair-parts-query'
import type { RepairPart } from '@/features/garage/types/repair-part'
import { compareRepairPartsByName, formatRepairPartPrice } from '@/features/garage/utils/repair-part-model'
import { queryClient } from '@/lib/query/query-client'

type AddJobPartDialogProps = {
  open: boolean
  jobId: string
  onOpenChange: (open: boolean) => void
}

export function AddJobPartDialog({ open, jobId, onOpenChange }: AddJobPartDialogProps) {
  const [repairPartId, setRepairPartId] = useState('')
  const [quantity, setQuantity] = useState('1')

  const { data: catalogParts = [], isLoading: isCatalogLoading, isError: isCatalogError } = useRepairPartsQuery()

  const sortedParts = useMemo(
    () => [...catalogParts].sort(compareRepairPartsByName),
    [catalogParts],
  )

  const selectedPart = useMemo(
    () => sortedParts.find((part) => part.id === repairPartId),
    [repairPartId, sortedParts],
  )

  useEffect(() => {
    if (!open) {
      setRepairPartId('')
      setQuantity('1')
    }
  }, [open])

  const addMutation = useMutation({
    mutationFn: (payload: { repairPartId: string; quantity: number }) =>
      garageService.addJobPart({ jobId, ...payload }),
    onSuccess: () => {
      toast.success('Spare part added to repair job.')
      queryClient.invalidateQueries({ queryKey: ['garage', 'jobs', jobId] })
      queryClient.invalidateQueries({ queryKey: ['garage', 'jobs'] })
      onOpenChange(false)
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to add spare part.')
    },
  })

  const isSaving = addMutation.isPending

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!repairPartId) {
      toast.error('Select a spare part from the catalog.')
      return
    }

    const parsedQuantity = Number.parseInt(quantity, 10)
    if (Number.isNaN(parsedQuantity) || parsedQuantity < 1) {
      toast.error('Quantity must be at least 1.')
      return
    }

    addMutation.mutate({ repairPartId, quantity: parsedQuantity })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Spare Part</DialogTitle>
          <DialogDescription>
            Select a part from the repair parts catalog. The unit price is snapshotted when added to this job.
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="jobRepairPart">Spare Part</Label>
            {isCatalogLoading ? (
              <Skeleton className="h-10 w-full" />
            ) : isCatalogError ? (
              <p className="text-sm text-destructive">Unable to load repair parts catalog.</p>
            ) : sortedParts.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No repair parts in the catalog. Add parts under Garage Masters first.
              </p>
            ) : (
              <Select
                value={repairPartId || undefined}
                onValueChange={setRepairPartId}
                disabled={isSaving}
              >
                <SelectTrigger id="jobRepairPart">
                  <SelectValue placeholder="Select spare part" />
                </SelectTrigger>
                <SelectContent>
                  {sortedParts.map((part: RepairPart) => (
                    <SelectItem key={part.id} value={part.id}>
                      {part.partName} — {formatRepairPartPrice(part.price)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {selectedPart ? (
            <p className="text-xs text-muted-foreground">
              Catalog price: {formatRepairPartPrice(selectedPart.price)} per unit (snapshotted on add).
            </p>
          ) : null}

          <div className="space-y-2">
            <Label htmlFor="jobPartQuantity">Quantity</Label>
            <Input
              id="jobPartQuantity"
              type="number"
              min={1}
              step={1}
              value={quantity}
              onChange={(event) => setQuantity(event.target.value)}
              disabled={isSaving || sortedParts.length === 0}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSaving || isCatalogLoading || sortedParts.length === 0 || !repairPartId}
            >
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Add Part
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
