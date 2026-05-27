import { useMemo } from 'react'
import { FolderTree, Package, Plus, RefreshCw, Settings2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { RepairCategoriesPanel } from '@/features/garage/components/repair-categories-panel'
import { RepairPartFormDialog } from '@/features/garage/components/repair-part-form-dialog'
import { RepairPartsPanel } from '@/features/garage/components/repair-parts-panel'
import { useRepairCategoriesQuery } from '@/features/garage/hooks/use-repair-categories-query'
import { useRepairPartsQuery } from '@/features/garage/hooks/use-repair-parts-query'
import { useCurrentUser } from '@/hooks/use-current-user'
import { useMasterDialogParams } from '@/hooks/use-master-dialog-params'
import { cn } from '@/lib/utils'

type GarageMastersTab = 'categories' | 'parts'

function parseGarageMastersTab(value: string | null): GarageMastersTab {
  return value === 'parts' ? 'parts' : 'categories'
}

export function GarageMastersPage() {
  const currentUser = useCurrentUser()
  const canManage = currentUser?.role === 'ADMIN' || currentUser?.role === 'SUPERVISOR'
  const { action, tab: tabParam, openDialog, closeDialog, setTabParam } = useMasterDialogParams()

  const activeTab = parseGarageMastersTab(tabParam)

  const {
    data: categoriesData,
    isLoading: isCategoriesLoading,
    isFetching: isCategoriesFetching,
    isError: isCategoriesError,
    error: categoriesError,
  } = useRepairCategoriesQuery()

  const {
    data: parts = [],
    isLoading: isPartsLoading,
    isFetching: isPartsFetching,
    isError: isPartsError,
    error: partsError,
  } = useRepairPartsQuery()

  const tree = categoriesData?.tree ?? []
  const isFetching = activeTab === 'categories' ? isCategoriesFetching : isPartsFetching
  const isCategoryCreateOpen = activeTab === 'categories' && action === 'create'
  const isPartFormOpen = activeTab === 'parts' && action === 'create'

  const addButtonLabel = useMemo(
    () => (activeTab === 'categories' ? 'Add Category' : 'Add Repair Part'),
    [activeTab],
  )

  const openCreateDialog = () => {
    openDialog({ action: 'create', tab: activeTab })
  }

  return (
    <section className="mx-auto w-full max-w-5xl space-y-6">
      <header className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-orange-500/10 via-background to-rose-500/10 p-6 shadow-sm">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-20 -top-20 h-52 w-52 rounded-full bg-orange-400/25 blur-3xl dark:bg-orange-500/15"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-16 left-12 h-48 w-48 rounded-full bg-rose-400/20 blur-3xl dark:bg-rose-500/10"
        />
        <div className="relative flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1.5">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-orange-700 dark:text-orange-400">
              Garage Masters
            </p>
            <div className="flex items-center gap-3">
              <div className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary shadow-sm">
                <Settings2 className="size-5" />
              </div>
              <div>
                <h1 className="text-3xl font-semibold tracking-tight text-foreground">Garage Masters</h1>
                <p className="max-w-xl text-sm text-muted-foreground">
                  Configure repair category hierarchy and spare parts catalog used across garage workflows.
                </p>
              </div>
            </div>
          </div>
          <div className="flex w-full items-stretch justify-end gap-2 sm:w-auto sm:items-center">
            {isFetching && !(activeTab === 'categories' ? isCategoriesLoading : isPartsLoading) ? (
              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                Syncing...
              </span>
            ) : null}
            {canManage ? (
              <Button className="w-full sm:w-auto" onClick={openCreateDialog}>
                <Plus className="h-4 w-4" />
                {addButtonLabel}
              </Button>
            ) : null}
          </div>
        </div>
      </header>

      <div className="inline-flex w-full rounded-xl border border-border bg-muted/30 p-1 sm:w-auto">
        <button
          type="button"
          onClick={() => setTabParam('categories')}
          className={cn(
            'inline-flex min-w-0 flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors sm:flex-none sm:gap-2 sm:px-4',
            activeTab === 'categories'
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground',
          )}
        >
          <FolderTree className="h-4 w-4 shrink-0" />
          <span className="truncate">Repair Categories</span>
        </button>
        <button
          type="button"
          onClick={() => setTabParam('parts')}
          className={cn(
            'inline-flex min-w-0 flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors sm:flex-none sm:gap-2 sm:px-4',
            activeTab === 'parts'
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground',
          )}
        >
          <Package className="h-4 w-4 shrink-0" />
          <span className="truncate">Repair Parts</span>
        </button>
      </div>

      {activeTab === 'categories' ? (
        <RepairCategoriesPanel
          tree={tree}
          isLoading={isCategoriesLoading}
          isError={isCategoriesError}
          error={categoriesError as Error | null}
          canManage={canManage}
          createDialogOpen={isCategoryCreateOpen}
          onCreateDialogOpenChange={(open) => {
            if (!open) closeDialog()
          }}
        />
      ) : (
        <RepairPartsPanel
          parts={parts}
          isLoading={isPartsLoading}
          isError={isPartsError}
          error={partsError as Error | null}
          canManage={canManage}
          onAdd={canManage ? openCreateDialog : undefined}
        />
      )}

      <RepairPartFormDialog
        open={isPartFormOpen}
        mode="create"
        editingPart={null}
        onOpenChange={(open) => {
          if (!open) closeDialog()
        }}
      />
    </section>
  )
}
