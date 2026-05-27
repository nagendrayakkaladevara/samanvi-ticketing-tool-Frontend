import { useMemo, useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import {
  ChevronDown,
  ChevronRight,
  FolderTree,
  Loader2,
  Pencil,
  Plus,
  Trash2,
} from 'lucide-react'
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
import { RepairCategoryFormDialog } from '@/features/garage/components/repair-category-form-dialog'
import { garageService } from '@/features/garage/api/garage.service'
import type { RepairCategoryTreeNode } from '@/features/garage/types/repair-category'
import {
  canAddChildCategory,
  countRepairCategoryNodes,
  formatRepairCategoryUpdatedAt,
} from '@/features/garage/utils/repair-category-model'
import { queryClient } from '@/lib/query/query-client'
import { cn } from '@/lib/utils'

type CategoryDialogState =
  | { mode: 'create-root' }
  | { mode: 'create-child'; parent: RepairCategoryTreeNode }
  | { mode: 'edit'; category: RepairCategoryTreeNode }

type RepairCategoriesPanelProps = {
  tree: RepairCategoryTreeNode[]
  isLoading: boolean
  isError: boolean
  error: Error | null
  canManage: boolean
  createDialogOpen?: boolean
  onCreateDialogOpenChange?: (open: boolean) => void
}

function CategoryTreeNodeRow({
  node,
  depth,
  canManage,
  onAddChild,
  onEdit,
  onDelete,
}: {
  node: RepairCategoryTreeNode
  depth: number
  canManage: boolean
  onAddChild: (category: RepairCategoryTreeNode) => void
  onEdit: (category: RepairCategoryTreeNode) => void
  onDelete: (category: RepairCategoryTreeNode) => void
}) {
  const [expanded, setExpanded] = useState(true)
  const hasChildren = node.children.length > 0
  const isLeaf = !hasChildren

  return (
    <div>
      <div
        className="group flex items-center gap-2 rounded-lg border border-transparent px-2 py-2 transition-colors hover:border-border hover:bg-muted/40"
        style={{ marginLeft: depth > 0 ? `${depth * 1.25}rem` : undefined }}
      >
        <button
          type="button"
          className={cn(
            'inline-flex size-7 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted',
            !hasChildren && 'invisible',
          )}
          onClick={() => setExpanded((value) => !value)}
          aria-label={expanded ? 'Collapse category' : 'Expand category'}
        >
          {expanded ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
        </button>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-medium">{node.name}</span>
            <span className="rounded-full border bg-muted/50 px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              Level {node.level}
            </span>
            {isLeaf ? (
              <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-700 dark:text-emerald-300">
                Leaf
              </span>
            ) : null}
          </div>
          <p className="text-xs text-muted-foreground">Updated {formatRepairCategoryUpdatedAt(node.updatedAt)}</p>
        </div>

        {canManage ? (
          <div className="flex shrink-0 items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100">
            {canAddChildCategory(node) ? (
              <Button variant="ghost" size="icon" className="size-8" onClick={() => onAddChild(node)} aria-label="Add subcategory">
                <Plus className="size-4" />
              </Button>
            ) : null}
            <Button variant="ghost" size="icon" className="size-8" onClick={() => onEdit(node)} aria-label="Edit category">
              <Pencil className="size-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="size-8 text-destructive hover:text-destructive"
              onClick={() => onDelete(node)}
              aria-label="Delete category"
            >
              <Trash2 className="size-4" />
            </Button>
          </div>
        ) : null}
      </div>

      {hasChildren && expanded
        ? node.children.map((child) => (
            <CategoryTreeNodeRow
              key={child.id}
              node={child}
              depth={depth + 1}
              canManage={canManage}
              onAddChild={onAddChild}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))
        : null}
    </div>
  )
}

export function RepairCategoriesPanel({
  tree,
  isLoading,
  isError,
  error,
  canManage,
  createDialogOpen = false,
  onCreateDialogOpenChange,
}: RepairCategoriesPanelProps) {
  const [dialogState, setDialogState] = useState<CategoryDialogState | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<RepairCategoryTreeNode | null>(null)

  const categoryCount = useMemo(() => countRepairCategoryNodes(tree), [tree])

  const openCreateRoot = () => {
    setDialogState({ mode: 'create-root' })
    onCreateDialogOpenChange?.(true)
  }

  const closeCategoryDialog = () => {
    setDialogState(null)
    onCreateDialogOpenChange?.(false)
  }

  const isFormOpen = Boolean(dialogState) || createDialogOpen
  const activeDialogState: CategoryDialogState | null =
    dialogState ?? (createDialogOpen ? { mode: 'create-root' } : null)

  const deleteMutation = useMutation({
    mutationFn: (categoryId: string) => garageService.deleteRepairCategory(categoryId),
    onSuccess: () => {
      toast.success('Repair category deleted successfully.')
      queryClient.invalidateQueries({ queryKey: ['garage', 'repair-categories'] })
      setDeleteTarget(null)
    },
    onError: (mutationError) => {
      toast.error(mutationError instanceof Error ? mutationError.message : 'Failed to delete repair category.')
    },
  })

  const editingCategory = activeDialogState?.mode === 'edit' ? activeDialogState.category : null
  const parentCategory = activeDialogState?.mode === 'create-child' ? activeDialogState.parent : null
  const dialogMode = activeDialogState?.mode ?? 'create-root'

  return (
    <>
      {isLoading ? (
        <Card className="space-y-3 p-4">
          {Array.from({ length: 5 }).map((_, index) => (
            <Skeleton key={index} className="h-12 w-full rounded-lg" />
          ))}
        </Card>
      ) : null}

      {isError ? (
        <Card className="space-y-2 p-5">
          <p className="font-semibold text-destructive">Unable to load repair categories</p>
          <p className="text-sm text-muted-foreground">{error?.message ?? 'Unexpected error occurred.'}</p>
        </Card>
      ) : null}

      {!isLoading && !isError && categoryCount === 0 ? (
        <Card className="flex flex-col items-center gap-3 p-10 text-center">
          <FolderTree className="h-10 w-10 text-muted-foreground" />
          <h2 className="text-lg font-semibold">No repair categories yet</h2>
          <p className="max-w-md text-sm text-muted-foreground">
            Build a hierarchy of repair types up to five levels deep. Leaf categories can be assigned to repair jobs.
          </p>
          {canManage ? (
            <Button onClick={openCreateRoot}>
              <Plus className="h-4 w-4" />
              Add Root Category
            </Button>
          ) : null}
        </Card>
      ) : null}

      {!isLoading && !isError && categoryCount > 0 ? (
        <Card className="p-3 sm:p-4">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2 border-b border-border/70 pb-3">
            <p className="text-sm text-muted-foreground">
              {categoryCount} {categoryCount === 1 ? 'category' : 'categories'} in hierarchy
            </p>
            {canManage ? (
              <Button size="sm" variant="outline" onClick={openCreateRoot}>
                <Plus className="h-4 w-4" />
                Add Category
              </Button>
            ) : null}
          </div>

          <div className="space-y-1">
            {tree.map((node) => (
              <CategoryTreeNodeRow
                key={node.id}
                node={node}
                depth={0}
                canManage={canManage}
                onAddChild={(category) => {
                  setDialogState({ mode: 'create-child', parent: category })
                  onCreateDialogOpenChange?.(true)
                }}
                onEdit={(category) => {
                  setDialogState({ mode: 'edit', category })
                  onCreateDialogOpenChange?.(true)
                }}
                onDelete={setDeleteTarget}
              />
            ))}
          </div>
        </Card>
      ) : null}

      <RepairCategoryFormDialog
        open={isFormOpen}
        mode={dialogMode}
        editingCategory={editingCategory}
        parentCategory={parentCategory}
        tree={tree}
        onOpenChange={(open) => {
          if (!open) closeCategoryDialog()
        }}
      />

      <AlertDialog open={Boolean(deleteTarget)} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete repair category?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget
                ? `This will permanently remove "${deleteTarget.name}". Deletion is blocked if subcategories exist or repair jobs reference this category.`
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
