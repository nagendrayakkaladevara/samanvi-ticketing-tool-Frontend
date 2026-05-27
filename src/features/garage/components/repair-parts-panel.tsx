import { useMemo, useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Loader2, Package, Pencil, Trash2 } from 'lucide-react'
import { toast } from '@/lib/toast'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { RepairPartFormDialog } from '@/features/garage/components/repair-part-form-dialog'
import { garageService } from '@/features/garage/api/garage.service'
import type { RepairPart } from '@/features/garage/types/repair-part'
import {
  compareRepairPartsByName,
  formatRepairPartPrice,
  formatRepairPartUpdatedAt,
} from '@/features/garage/utils/repair-part-model'
import { queryClient } from '@/lib/query/query-client'

type RepairPartsPanelProps = {
  parts: RepairPart[]
  isLoading: boolean
  isError: boolean
  error: Error | null
  canManage: boolean
  onAdd?: () => void
}

export function RepairPartsPanel({
  parts,
  isLoading,
  isError,
  error,
  canManage,
  onAdd,
}: RepairPartsPanelProps) {
  const [editingPart, setEditingPart] = useState<RepairPart | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<RepairPart | null>(null)

  const sortedParts = useMemo(() => [...parts].sort(compareRepairPartsByName), [parts])

  const deleteMutation = useMutation({
    mutationFn: (partId: string) => garageService.deleteRepairPart(partId),
    onSuccess: () => {
      toast.success('Repair part deleted successfully.')
      queryClient.invalidateQueries({ queryKey: ['garage', 'repair-parts'] })
      setDeleteTarget(null)
    },
    onError: (mutationError) => {
      toast.error(mutationError instanceof Error ? mutationError.message : 'Failed to delete repair part.')
    },
  })

  return (
    <>
      {isLoading ? (
        <>
          <div className="space-y-3 md:hidden">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="h-24 w-full rounded-xl" />
            ))}
          </div>
          <Card className="hidden space-y-3 p-4 md:block">
            {Array.from({ length: 6 }).map((_, index) => (
              <Skeleton key={index} className="h-10 w-full" />
            ))}
          </Card>
        </>
      ) : null}

      {isError ? (
        <Card className="space-y-2 p-5">
          <p className="font-semibold text-destructive">Unable to load repair parts</p>
          <p className="text-sm text-muted-foreground">{error?.message ?? 'Unexpected error occurred.'}</p>
        </Card>
      ) : null}

      {!isLoading && !isError && sortedParts.length === 0 ? (
        <Card className="flex flex-col items-center gap-3 p-10 text-center">
          <Package className="h-10 w-10 text-muted-foreground" />
          <h2 className="text-lg font-semibold">No repair parts in catalog</h2>
          <p className="max-w-md text-sm text-muted-foreground">
            Add spare parts with unit prices. Prices are snapshotted when attached to repair jobs.
          </p>
          {canManage && onAdd ? (
            <Button onClick={onAdd}>
              <Package className="h-4 w-4" />
              Add Repair Part
            </Button>
          ) : null}
        </Card>
      ) : null}

      {!isLoading && !isError && sortedParts.length > 0 ? (
        <>
          <div className="space-y-3 md:hidden">
            {sortedParts.map((part, index) => (
              <Card key={part.id} className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 space-y-1">
                    <p className="text-xs text-muted-foreground">S.No {index + 1}</p>
                    <p className="font-medium">{part.partName}</p>
                    <p className="text-sm font-semibold text-primary">{formatRepairPartPrice(part.price)}</p>
                    {part.description ? (
                      <p className="line-clamp-2 text-xs text-muted-foreground">{part.description}</p>
                    ) : null}
                    <p className="text-xs text-muted-foreground">Updated {formatRepairPartUpdatedAt(part.updatedAt)}</p>
                  </div>
                  {canManage ? (
                    <div className="flex shrink-0 gap-2">
                      <Button variant="outline" size="sm" onClick={() => setEditingPart(part)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        className="border-red-600 bg-red-600 text-white hover:bg-red-700"
                        onClick={() => setDeleteTarget(part)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ) : null}
                </div>
              </Card>
            ))}
          </div>

          <Card className="hidden overflow-x-auto md:block">
            <table className="w-full min-w-[720px] border-collapse text-sm">
              <thead>
                <tr className="border-b bg-muted/30 text-left">
                  <th className="w-16 px-4 py-3 font-medium">S.No</th>
                  <th className="px-4 py-3 font-medium">Part Name</th>
                  <th className="px-4 py-3 font-medium">Unit Price</th>
                  <th className="px-4 py-3 font-medium">Description</th>
                  <th className="px-4 py-3 font-medium">Last Updated</th>
                  {canManage ? <th className="px-4 py-3 text-right font-medium">Actions</th> : null}
                </tr>
              </thead>
              <tbody>
                {sortedParts.map((part, index) => (
                  <tr key={part.id} className="border-b transition-colors last:border-b-0 hover:bg-muted/40">
                    <td className="px-4 py-3 text-muted-foreground">{index + 1}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-2 rounded-full border bg-muted/40 px-3 py-1 font-medium">
                        <Package className="h-3.5 w-3.5 text-muted-foreground" />
                        {part.partName}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-semibold text-primary">{formatRepairPartPrice(part.price)}</td>
                    <td className="max-w-xs px-4 py-3 text-muted-foreground">
                      {part.description ? (
                        <span className="line-clamp-2">{part.description}</span>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{formatRepairPartUpdatedAt(part.updatedAt)}</td>
                    {canManage ? (
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <Button variant="outline" size="sm" onClick={() => setEditingPart(part)}>
                            <Pencil className="h-3.5 w-3.5" />
                            Edit
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            className="border-red-600 bg-red-600 text-white hover:bg-red-700"
                            onClick={() => setDeleteTarget(part)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            Delete
                          </Button>
                        </div>
                      </td>
                    ) : null}
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </>
      ) : null}

      <RepairPartFormDialog
        open={Boolean(editingPart)}
        mode="edit"
        editingPart={editingPart}
        onOpenChange={(open) => {
          if (!open) setEditingPart(null)
        }}
      />

      <AlertDialog open={Boolean(deleteTarget)} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete repair part?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget
                ? `This will permanently remove "${deleteTarget.partName}" from the catalog. Deletion is blocked if the part is used on repair jobs.`
                : 'This action cannot be undone.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="border-red-600 bg-red-600 text-white hover:bg-red-700"
              onClick={() => {
                if (deleteTarget) deleteMutation.mutate(deleteTarget.id)
              }}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
