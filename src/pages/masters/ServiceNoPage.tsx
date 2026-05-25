import { useMemo } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Eye, Loader2, Pencil, Plus, RefreshCw, Route, Trash2 } from 'lucide-react'
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
import { ServiceNumberFormDialog } from '@/features/service-numbers/components/service-number-form-dialog'
import { ServiceNumberViewDialog } from '@/features/service-numbers/components/service-number-view-dialog'
import { serviceNumbersService } from '@/features/service-numbers/api/service-numbers.service'
import { useServiceNumbersQuery } from '@/features/service-numbers/hooks/use-service-numbers-query'
import type { ServiceNumber } from '@/features/service-numbers/types/service-number'
import {
  compareServiceNumbersByNo,
  formatDateTime,
  formatDistance,
} from '@/features/service-numbers/utils/service-number-model'
import { useServiceForQuery } from '@/features/service-for/hooks/use-service-for-query'
import { useMasterDialogParams } from '@/hooks/use-master-dialog-params'
import { queryClient } from '@/lib/query/query-client'

export function ServiceNoPage() {
  const { data: items = [], isLoading, isFetching, isError, error } = useServiceNumbersQuery()
  const { data: serviceForOptions = [] } = useServiceForQuery()
  const { action, id, openDialog, closeDialog } = useMasterDialogParams()

  const sortedItems = useMemo(() => [...items].sort(compareServiceNumbersByNo), [items])

  const editingItem = useMemo(
    () => (action === 'edit' && id ? sortedItems.find((item) => item.id === id) ?? null : null),
    [action, id, sortedItems],
  )

  const viewTarget = useMemo(
    () => (action === 'view' && id ? sortedItems.find((item) => item.id === id) ?? null : null),
    [action, id, sortedItems],
  )

  const deleteTarget = useMemo(
    () => (action === 'delete' && id ? sortedItems.find((item) => item.id === id) ?? null : null),
    [action, id, sortedItems],
  )

  const isFormOpen = action === 'create' || (action === 'edit' && Boolean(editingItem))
  const isViewOpen = action === 'view' && Boolean(viewTarget)
  const isDeleteOpen = action === 'delete' && Boolean(deleteTarget)

  const deleteMutation = useMutation({
    mutationFn: (serviceNumberId: string) => serviceNumbersService.remove(serviceNumberId),
    onSuccess: () => {
      toast.success('Service number deleted successfully.')
      queryClient.invalidateQueries({ queryKey: ['service-numbers'] })
      closeDialog()
    },
    onError: (mutationError) => {
      toast.error(mutationError instanceof Error ? mutationError.message : 'Failed to delete service number.')
    },
  })

  const openCreateForm = () => openDialog({ action: 'create' })
  const openEditForm = (item: ServiceNumber) => openDialog({ action: 'edit', id: item.id })
  const openViewDialog = (item: ServiceNumber) => openDialog({ action: 'view', id: item.id })
  const openDeleteDialog = (item: ServiceNumber) => openDialog({ action: 'delete', id: item.id })


  const confirmDelete = () => {
    if (!deleteTarget) return
    deleteMutation.mutate(deleteTarget.id)
  }

  return (
    <section className="space-y-6">
      <header className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-emerald-500/10 via-background to-rose-500/10 p-6 shadow-sm">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-20 -top-20 h-52 w-52 rounded-full bg-emerald-400/25 blur-3xl dark:bg-emerald-500/15"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-16 left-12 h-48 w-48 rounded-full bg-rose-400/20 blur-3xl dark:bg-rose-500/10"
        />
        <div className="relative flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1.5">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700 dark:text-emerald-400">
              Master Data
            </p>
            <h1 className="text-3xl font-semibold tracking-tight text-foreground">Service No</h1>
            <p className="max-w-xl text-sm text-muted-foreground">
              Manage route service numbers with fare amounts, beta rates, and crew assignments.
            </p>
          </div>
          <div className="flex w-full items-stretch justify-end gap-2 sm:w-auto sm:items-center">
            {isFetching && !isLoading ? (
              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                Syncing...
              </span>
            ) : null}
            <Button className="w-full sm:w-auto" onClick={openCreateForm}>
              <Plus className="h-4 w-4" />
              Add Service Number
            </Button>
          </div>
        </div>
      </header>

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
          <p className="font-semibold text-destructive">Unable to load service numbers</p>
          <p className="text-sm text-muted-foreground">{(error as Error)?.message ?? 'Unexpected error occurred.'}</p>
        </Card>
      ) : null}

      {!isLoading && !isError && sortedItems.length === 0 ? (
        <Card className="flex flex-col items-center gap-3 p-10 text-center">
          <Route className="h-10 w-10 text-muted-foreground" />
          <h2 className="text-lg font-semibold">No service numbers yet</h2>
          <p className="max-w-md text-sm text-muted-foreground">
            Create your first service number to define routes, fares, and crew beta amounts.
          </p>
          <Button onClick={openCreateForm}>
            <Plus className="h-4 w-4" />
            Add Service Number
          </Button>
        </Card>
      ) : null}

      {!isLoading && !isError && sortedItems.length > 0 ? (
        <>
          <div className="space-y-3 md:hidden">
            {sortedItems.map((item) => (
              <Card key={item.id} className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 space-y-1.5">
                    <span className="inline-flex items-center gap-2 rounded-full border bg-muted/40 px-3 py-1 text-sm font-medium">
                      <Route className="h-3.5 w-3.5 text-muted-foreground" />
                      {item.serviceNo}
                    </span>
                    <p className="text-sm text-muted-foreground">{item.serviceFor.serviceFor}</p>
                    <p className="text-sm">
                      {item.from} → {item.to}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Via {item.via} · {formatDistance(item.distance)}
                    </p>
                    <p className="text-xs text-muted-foreground">Updated {formatDateTime(item.updatedAt)}</p>
                  </div>
                  <div className="flex shrink-0 gap-1.5">
                    <Button variant="outline" size="sm" onClick={() => openViewDialog(item)}>
                      <Eye className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => openEditForm(item)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      className="border-red-600 bg-red-600 text-white hover:bg-red-700"
                      onClick={() => openDeleteDialog(item)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          <Card className="hidden overflow-x-auto md:block">
            <table className="w-full min-w-[960px] border-collapse text-sm">
              <thead>
                <tr className="border-b bg-muted/30 text-left">
                  <th className="px-4 py-3 font-medium">Service No</th>
                  <th className="px-4 py-3 font-medium">Service For</th>
                  <th className="px-4 py-3 font-medium">Route</th>
                  <th className="px-4 py-3 font-medium">Via</th>
                  <th className="px-4 py-3 font-medium">Distance</th>
                  <th className="px-4 py-3 font-medium">Last Updated</th>
                  <th className="px-4 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {sortedItems.map((item) => (
                  <tr key={item.id} className="border-b transition-colors last:border-b-0 hover:bg-muted/40">
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-2 rounded-full border bg-muted/40 px-3 py-1 font-medium">
                        <Route className="h-3.5 w-3.5 text-muted-foreground" />
                        {item.serviceNo}
                      </span>
                    </td>
                    <td className="px-4 py-3">{item.serviceFor.serviceFor}</td>
                    <td className="px-4 py-3">
                      {item.from} → {item.to}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{item.via}</td>
                    <td className="px-4 py-3">{formatDistance(item.distance)}</td>
                    <td className="px-4 py-3 text-muted-foreground">{formatDateTime(item.updatedAt)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="outline" size="sm" onClick={() => openViewDialog(item)}>
                          <Eye className="h-3.5 w-3.5" />
                          View
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => openEditForm(item)}>
                          <Pencil className="h-3.5 w-3.5" />
                          Edit
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          className="border-red-600 bg-red-600 text-white hover:bg-red-700"
                          onClick={() => openDeleteDialog(item)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </>
      ) : null}

      <ServiceNumberFormDialog
        open={isFormOpen}
        mode={action === 'edit' ? 'edit' : 'create'}
        editingItem={editingItem}
        serviceForOptions={serviceForOptions}
        onOpenChange={(open) => {
          if (!open) closeDialog()
        }}
      />

      <ServiceNumberViewDialog
        open={isViewOpen}
        item={viewTarget}
        onOpenChange={(open) => {
          if (!open) closeDialog()
        }}
      />

      <AlertDialog open={isDeleteOpen} onOpenChange={(open) => !open && closeDialog()}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete service number?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget
                ? `This will permanently remove "${deleteTarget.serviceNo}" (${deleteTarget.from} → ${deleteTarget.to}). Deletion is blocked if tickets or records still reference this service number.`
                : 'This action cannot be undone.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="border-red-600 bg-red-600 text-white hover:bg-red-700"
              onClick={confirmDelete}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  )
}
