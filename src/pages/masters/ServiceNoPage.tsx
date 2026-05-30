import { useMemo } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Loader2, Plus, RefreshCw } from 'lucide-react'
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
import { ServiceNumberFormDialog } from '@/features/service-numbers/components/service-number-form-dialog'
import { ServiceNumberViewDialog } from '@/features/service-numbers/components/service-number-view-dialog'
import { ServiceNumbersGrid } from '@/features/service-numbers/components/service-numbers-grid'
import { serviceNumbersService } from '@/features/service-numbers/api/service-numbers.service'
import { useServiceNumbersQuery } from '@/features/service-numbers/hooks/use-service-numbers-query'
import type { ServiceNumber } from '@/features/service-numbers/types/service-number'
import { useServiceForQuery } from '@/features/service-for/hooks/use-service-for-query'
import { useMasterDialogParams } from '@/hooks/use-master-dialog-params'
import { usePermissions } from '@/hooks/use-permissions'
import { queryClient } from '@/lib/query/query-client'

export function ServiceNoPage() {
  const { can } = usePermissions()
  const canCreate = can('masters', 'service_number', 'create')
  const canEdit = can('masters', 'service_number', 'edit')
  const canDelete = can('masters', 'service_number', 'delete')
  const { data: items = [], isLoading, isFetching, isError, error } = useServiceNumbersQuery()
  const { data: serviceForOptions = [] } = useServiceForQuery()
  const { action, id, openDialog, closeDialog } = useMasterDialogParams()

  const editingItem = useMemo(
    () => (action === 'edit' && id ? items.find((item) => item.id === id) ?? null : null),
    [action, id, items],
  )

  const viewTarget = useMemo(
    () => (action === 'view' && id ? items.find((item) => item.id === id) ?? null : null),
    [action, id, items],
  )

  const deleteTarget = useMemo(
    () => (action === 'delete' && id ? items.find((item) => item.id === id) ?? null : null),
    [action, id, items],
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
            {canCreate ? (
              <Button className="w-full sm:w-auto" onClick={openCreateForm}>
                <Plus className="h-4 w-4" />
                Add Service Number
              </Button>
            ) : null}
          </div>
        </div>
      </header>

      <ServiceNumbersGrid
        items={items}
        isLoading={isLoading}
        isError={isError}
        error={error as Error | null}
        canEdit={canEdit}
        canDelete={canDelete}
        onAdd={canCreate ? openCreateForm : undefined}
        onView={openViewDialog}
        onEdit={openEditForm}
        onDelete={openDeleteDialog}
      />

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
