import { useMemo, useState, type FormEvent } from 'react'
import { useMutation } from '@tanstack/react-query'
import { FileSpreadsheet, Layers, Loader2, Pencil, Plus, RefreshCw, Trash2 } from 'lucide-react'
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
import { Skeleton } from '@/components/ui/skeleton'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { serviceForService } from '@/features/service-for/api/service-for.service'
import { useServiceForQuery } from '@/features/service-for/hooks/use-service-for-query'
import type { ServiceFor } from '@/features/service-for/types/service-for'
import { downloadServiceForExcel } from '@/features/service-for/utils/download-service-for-excel'
import { queryClient } from '@/lib/query/query-client'

type FormMode = 'create' | 'edit'

function formatDateTime(rawDate?: string): string {
  if (!rawDate) return '—'
  const parsed = new Date(rawDate)
  if (Number.isNaN(parsed.getTime())) return '—'

  return new Intl.DateTimeFormat(undefined, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(parsed)
}

function validateServiceFor(value: string): string | null {
  const trimmed = value.trim()
  if (!trimmed) return 'Service For name is required.'
  if (trimmed.length > 120) return 'Service For name must be 120 characters or fewer.'
  return null
}

export function ServiceForPage() {
  const { data: items = [], isLoading, isFetching, isError, error } = useServiceForQuery()

  const [isFormOpen, setIsFormOpen] = useState(false)
  const [formMode, setFormMode] = useState<FormMode>('create')
  const [editingItem, setEditingItem] = useState<ServiceFor | null>(null)
  const [serviceForValue, setServiceForValue] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<ServiceFor | null>(null)

  const sortedItems = useMemo(
    () => [...items].sort((a, b) => a.serviceFor.localeCompare(b.serviceFor)),
    [items],
  )

  const createMutation = useMutation({
    mutationFn: () => serviceForService.create({ serviceFor: serviceForValue }),
    onSuccess: () => {
      toast.success('Service For created successfully.')
      queryClient.invalidateQueries({ queryKey: ['service-for'] })
      closeForm()
    },
    onError: (mutationError) => {
      toast.error(mutationError instanceof Error ? mutationError.message : 'Failed to create Service For.')
    },
  })

  const updateMutation = useMutation({
    mutationFn: () => {
      if (!editingItem) {
        throw new Error('Unable to identify the selected entry.')
      }
      return serviceForService.update({
        serviceForId: editingItem.id,
        serviceFor: serviceForValue,
      })
    },
    onSuccess: () => {
      toast.success('Service For updated successfully.')
      queryClient.invalidateQueries({ queryKey: ['service-for'] })
      closeForm()
    },
    onError: (mutationError) => {
      toast.error(mutationError instanceof Error ? mutationError.message : 'Failed to update Service For.')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (serviceForId: string) => serviceForService.remove(serviceForId),
    onSuccess: () => {
      toast.success('Service For deleted successfully.')
      queryClient.invalidateQueries({ queryKey: ['service-for'] })
      setDeleteTarget(null)
    },
    onError: (mutationError) => {
      toast.error(mutationError instanceof Error ? mutationError.message : 'Failed to delete Service For.')
    },
  })

  const isSaving = createMutation.isPending || updateMutation.isPending

  const closeForm = () => {
    setIsFormOpen(false)
    setEditingItem(null)
    setServiceForValue('')
  }

  const openCreateForm = () => {
    setFormMode('create')
    setEditingItem(null)
    setServiceForValue('')
    setIsFormOpen(true)
  }

  const openEditForm = (item: ServiceFor) => {
    setFormMode('edit')
    setEditingItem(item)
    setServiceForValue(item.serviceFor)
    setIsFormOpen(true)
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const validationError = validateServiceFor(serviceForValue)
    if (validationError) {
      toast.error(validationError)
      return
    }

    if (formMode === 'create') {
      createMutation.mutate()
      return
    }

    updateMutation.mutate()
  }

  const confirmDelete = () => {
    if (!deleteTarget) return
    deleteMutation.mutate(deleteTarget.id)
  }

  const handleDownloadExcel = async () => {
    if (sortedItems.length === 0) {
      toast.error('No Service For entries to export.')
      return
    }
    try {
      await downloadServiceForExcel(sortedItems)
      toast.success('Service For list downloaded as Excel.')
    } catch {
      toast.error('Failed to download Excel file.')
    }
  }

  return (
    <section className="space-y-6">
      <header className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-sky-500/10 via-background to-violet-500/10 p-6 shadow-sm">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-20 -top-20 h-52 w-52 rounded-full bg-sky-400/25 blur-3xl dark:bg-sky-500/15"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-16 left-12 h-48 w-48 rounded-full bg-violet-400/20 blur-3xl dark:bg-violet-500/10"
        />
        <div className="relative flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1.5">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-700 dark:text-sky-400">Master Data</p>
            <h1 className="text-3xl font-semibold tracking-tight text-foreground">Service For</h1>
            <p className="max-w-xl text-sm text-muted-foreground">
              Manage service type labels used when creating service numbers and route assignments.
            </p>
          </div>
          <div className="flex w-full items-stretch justify-end gap-2 sm:w-auto sm:items-center">
            {isFetching && !isLoading ? (
              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                Syncing...
              </span>
            ) : null}
            <div className="flex w-full min-w-0 items-center justify-end gap-2 sm:w-auto">
              <TooltipProvider delayDuration={300}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="shrink-0"
                      onClick={handleDownloadExcel}
                      disabled={isLoading || sortedItems.length === 0}
                      aria-label="Download Excel"
                    >
                      <FileSpreadsheet className="h-4 w-4" aria-hidden />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">Download Excel</TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <Button className="min-w-0 flex-1 sm:w-auto sm:flex-none" onClick={openCreateForm}>
                <Plus className="h-4 w-4" />
                Add Service For
              </Button>
            </div>
          </div>
        </div>
      </header>

      {isLoading ? (
        <>
          <div className="space-y-3 md:hidden">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="h-20 w-full rounded-xl" />
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
          <p className="font-semibold text-destructive">Unable to load Service For entries</p>
          <p className="text-sm text-muted-foreground">{(error as Error)?.message ?? 'Unexpected error occurred.'}</p>
        </Card>
      ) : null}

      {!isLoading && !isError && sortedItems.length === 0 ? (
        <Card className="flex flex-col items-center gap-3 p-10 text-center">
          <Layers className="h-10 w-10 text-muted-foreground" />
          <h2 className="text-lg font-semibold">No Service For entries yet</h2>
          <p className="max-w-md text-sm text-muted-foreground">
            Create your first service type to use it in service number forms and dropdowns.
          </p>
          <Button onClick={openCreateForm}>
            <Plus className="h-4 w-4" />
            Add Service For
          </Button>
        </Card>
      ) : null}

      {!isLoading && !isError && sortedItems.length > 0 ? (
        <>
          <div className="space-y-3 md:hidden">
            {sortedItems.map((item) => (
              <Card key={item.id} className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 space-y-1">
                    <p className="truncate font-medium">{item.serviceFor}</p>
                    <p className="text-xs text-muted-foreground">Updated {formatDateTime(item.updatedAt)}</p>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <Button variant="outline" size="sm" onClick={() => openEditForm(item)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      className="border-red-600 bg-red-600 text-white hover:bg-red-700"
                      onClick={() => setDeleteTarget(item)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          <Card className="hidden overflow-x-auto md:block">
            <table className="w-full min-w-[640px] border-collapse text-sm">
              <thead>
                <tr className="border-b bg-muted/30 text-left">
                  <th className="px-4 py-3 font-medium">Service For</th>
                  <th className="px-4 py-3 font-medium">Last Updated</th>
                  <th className="px-4 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {sortedItems.map((item) => (
                  <tr key={item.id} className="border-b transition-colors last:border-b-0 hover:bg-muted/40">
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-2 rounded-full border bg-muted/40 px-3 py-1 font-medium">
                        <Layers className="h-3.5 w-3.5 text-muted-foreground" />
                        {item.serviceFor}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{formatDateTime(item.updatedAt)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="outline" size="sm" onClick={() => openEditForm(item)}>
                          <Pencil className="h-3.5 w-3.5" />
                          Edit
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          className="border-red-600 bg-red-600 text-white hover:bg-red-700"
                          onClick={() => setDeleteTarget(item)}
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

      <Dialog
        open={isFormOpen}
        onOpenChange={(open) => {
          if (!open) {
            closeForm()
            return
          }
          setIsFormOpen(true)
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{formMode === 'create' ? 'Add Service For' : 'Edit Service For'}</DialogTitle>
            <DialogDescription>
              {formMode === 'create'
                ? 'Enter a unique service type label for use in service number forms.'
                : 'Update the service type label. Existing service numbers will reflect the new name.'}
            </DialogDescription>
          </DialogHeader>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="serviceFor">Service For</Label>
              <Input
                id="serviceFor"
                value={serviceForValue}
                onChange={(event) => setServiceForValue(event.target.value)}
                placeholder="e.g., Express, Ordinary, Deluxe"
                disabled={isSaving}
                maxLength={120}
                autoFocus
                required
              />
              <p className="text-xs text-muted-foreground">{serviceForValue.trim().length}/120 characters</p>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeForm} disabled={isSaving}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {formMode === 'create' ? 'Add Service For' : 'Save Changes'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={Boolean(deleteTarget)} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Service For?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget
                ? `This will permanently remove "${deleteTarget.serviceFor}". Deletion is blocked if service numbers still reference this entry.`
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
