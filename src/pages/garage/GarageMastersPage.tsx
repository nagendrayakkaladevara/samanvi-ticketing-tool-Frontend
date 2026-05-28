import { useEffect, useMemo } from 'react'
import { FolderTree, Package, Plus, RefreshCw } from 'lucide-react'

import { PageGradientHeader } from '@/components/page-gradient-header'
import { Button } from '@/components/ui/button'
import { RepairCategoriesPanel } from '@/features/garage/components/repair-categories-panel'
import { RepairPartFormDialog } from '@/features/garage/components/repair-part-form-dialog'
import { RepairPartsPanel } from '@/features/garage/components/repair-parts-panel'
import { useRepairCategoriesQuery } from '@/features/garage/hooks/use-repair-categories-query'
import { useRepairPartsQuery } from '@/features/garage/hooks/use-repair-parts-query'
import { usePermissions, useSubmoduleActions } from '@/hooks/use-permissions'
import { useMasterDialogParams } from '@/hooks/use-master-dialog-params'
import { cn } from '@/lib/utils'

type GarageMastersTab = 'categories' | 'parts'

function parseGarageMastersTab(value: string | null): GarageMastersTab {
  return value === 'parts' ? 'parts' : 'categories'
}

export function GarageMastersPage() {
  const { has } = usePermissions()
  const canViewCategories = has('garage', 'repair_category', 'view')
  const canViewParts = has('garage', 'repair_part', 'view')
  const categoryActions = useSubmoduleActions('garage', 'repair_category')
  const partActions = useSubmoduleActions('garage', 'repair_part')
  const { action, tab: tabParam, openDialog, closeDialog, setTabParam } = useMasterDialogParams()

  const activeTab = parseGarageMastersTab(tabParam)

  useEffect(() => {
    if (activeTab === 'categories' && !canViewCategories && canViewParts) {
      setTabParam('parts')
    } else if (activeTab === 'parts' && !canViewParts && canViewCategories) {
      setTabParam('categories')
    }
  }, [activeTab, canViewCategories, canViewParts, setTabParam])

  const tabActions = activeTab === 'categories' ? categoryActions : partActions

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

  const isLoading = activeTab === 'categories' ? isCategoriesLoading : isPartsLoading

  return (
    <section className="space-y-6">
      <PageGradientHeader
        accent="orange"
        eyebrow="Garage"
        title="Garage Masters"
        description="Configure repair category hierarchy and spare parts catalog used across garage workflows."
        actions={
          <>
            {isFetching && !isLoading ? (
              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                Syncing...
              </span>
            ) : null}
            {tabActions.canCreate ? (
              <Button className="w-full sm:w-auto" onClick={openCreateDialog}>
                <Plus className="h-4 w-4" />
                {addButtonLabel}
              </Button>
            ) : null}
          </>
        }
      />

      <div className="inline-flex flex-wrap rounded-xl border border-border bg-muted/30 p-1">
        {canViewCategories ? (
          <button
            type="button"
            onClick={() => setTabParam('categories')}
            className={cn(
              'inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors',
              activeTab === 'categories'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            <FolderTree className="h-4 w-4 shrink-0" />
            <span className="truncate">Repair Categories</span>
          </button>
        ) : null}
        {canViewParts ? (
          <button
            type="button"
            onClick={() => setTabParam('parts')}
            className={cn(
              'inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors',
              activeTab === 'parts'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            <Package className="h-4 w-4 shrink-0" />
            <span className="truncate">Repair Parts</span>
          </button>
        ) : null}
      </div>

      {activeTab === 'categories' && canViewCategories ? (
        <RepairCategoriesPanel
          tree={tree}
          isLoading={isCategoriesLoading}
          isError={isCategoriesError}
          error={categoriesError as Error | null}
          canCreate={categoryActions.canCreate}
          canEdit={categoryActions.canEdit}
          canDelete={categoryActions.canDelete}
          createDialogOpen={isCategoryCreateOpen}
          onCreateDialogOpenChange={(open) => {
            if (!open) closeDialog()
          }}
        />
      ) : null}
      {activeTab === 'parts' && canViewParts ? (
        <RepairPartsPanel
          parts={parts}
          isLoading={isPartsLoading}
          isError={isPartsError}
          error={partsError as Error | null}
          canEdit={partActions.canEdit}
          canDelete={partActions.canDelete}
          onAdd={partActions.canCreate ? openCreateDialog : undefined}
        />
      ) : null}

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
