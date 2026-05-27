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
import { FieldError } from '@/components/ui/field-error'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { garageService } from '@/features/garage/api/garage.service'
import type { RepairCategoryTreeNode } from '@/features/garage/types/repair-category'
import {
  flattenRepairCategoryOptions,
  validateRepairCategoryName,
} from '@/features/garage/utils/repair-category-model'
import { queryClient } from '@/lib/query/query-client'
import { invalidFieldClass } from '@/lib/form/form-field-styles'
import { cn } from '@/lib/utils'

type FormMode = 'create-root' | 'create-child' | 'edit'

type RepairCategoryFormDialogProps = {
  open: boolean
  mode: FormMode
  editingCategory: RepairCategoryTreeNode | null
  parentCategory: RepairCategoryTreeNode | null
  tree: RepairCategoryTreeNode[]
  onOpenChange: (open: boolean) => void
}

export function RepairCategoryFormDialog({
  open,
  mode,
  editingCategory,
  parentCategory,
  tree,
  onOpenChange,
}: RepairCategoryFormDialogProps) {
  const [name, setName] = useState('')
  const [parentId, setParentId] = useState<string>('root')
  const [nameError, setNameError] = useState<string | undefined>()

  const parentOptions = useMemo(() => flattenRepairCategoryOptions(tree), [tree])

  useEffect(() => {
    if (!open) return

    if (mode === 'edit' && editingCategory) {
      setName(editingCategory.name)
      setParentId(editingCategory.parentId ?? 'root')
      setNameError(undefined)
      return
    }

    if (mode === 'create-child' && parentCategory) {
      setName('')
      setParentId(parentCategory.id)
      setNameError(undefined)
      return
    }

    setName('')
    setParentId('root')
    setNameError(undefined)
  }, [open, mode, editingCategory, parentCategory])

  const createMutation = useMutation({
    mutationFn: () => {
      const payload: { name: string; parentId?: string } = { name }
      if (parentId !== 'root') {
        payload.parentId = parentId
      }
      return garageService.createRepairCategory(payload)
    },
    onSuccess: () => {
      toast.success('Repair category created successfully.')
      queryClient.invalidateQueries({ queryKey: ['garage', 'repair-categories'] })
      onOpenChange(false)
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to create repair category.')
    },
  })

  const updateMutation = useMutation({
    mutationFn: () => {
      if (!editingCategory) {
        throw new Error('Unable to identify the selected category.')
      }
      return garageService.updateRepairCategory(editingCategory.id, name)
    },
    onSuccess: () => {
      toast.success('Repair category updated successfully.')
      queryClient.invalidateQueries({ queryKey: ['garage', 'repair-categories'] })
      onOpenChange(false)
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to update repair category.')
    },
  })

  const isSaving = createMutation.isPending || updateMutation.isPending
  const isEditMode = mode === 'edit'
  const showParentField = mode === 'create-root' || mode === 'create-child'

  const title =
    mode === 'edit'
      ? 'Edit Repair Category'
      : mode === 'create-child'
        ? 'Add Subcategory'
        : 'Add Repair Category'

  const description =
    mode === 'edit'
      ? 'Update the category name. Jobs linked to this category will show the new label.'
      : mode === 'create-child'
        ? `Create a subcategory under "${parentCategory?.name ?? 'selected category'}". Maximum depth is 5 levels.`
        : 'Create a root category or choose a parent to build the repair taxonomy hierarchy.'

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const validationError = validateRepairCategoryName(name)
    if (validationError) {
      setNameError(validationError)
      toast.error(validationError)
      return
    }

    if (isEditMode) {
      updateMutation.mutate()
      return
    }

    createMutation.mutate()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <form className="space-y-4" onSubmit={handleSubmit}>
          {showParentField && mode === 'create-root' ? (
            <div className="space-y-2">
              <Label htmlFor="parentCategory">Parent Category</Label>
              <Select value={parentId} onValueChange={setParentId} disabled={isSaving}>
                <SelectTrigger id="parentCategory">
                  <SelectValue placeholder="Select parent" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="root">Root level</SelectItem>
                  {parentOptions.map((option) => (
                    <SelectItem key={option.id} value={option.id}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : null}

          {mode === 'create-child' && parentCategory ? (
            <div className="rounded-lg border bg-muted/30 px-3 py-2 text-sm">
              <span className="text-muted-foreground">Parent: </span>
              <span className="font-medium">{parentCategory.name}</span>
              <span className="ml-2 text-xs text-muted-foreground">Level {parentCategory.level + 1}</span>
            </div>
          ) : null}

          <div className="space-y-2">
            <Label htmlFor="categoryName">Category Name</Label>
            <Input
              id="categoryName"
              value={name}
              onChange={(event) => {
                setName(event.target.value)
                setNameError(undefined)
              }}
              onBlur={() => setNameError(validateRepairCategoryName(name) ?? undefined)}
              placeholder="e.g., Engine, Brakes, Electrical"
              disabled={isSaving}
              maxLength={120}
              autoFocus
              aria-invalid={Boolean(nameError)}
              className={cn(nameError && invalidFieldClass)}
            />
            {nameError ? (
              <FieldError message={nameError} />
            ) : (
              <p className="text-xs text-muted-foreground">{name.trim().length}/120 characters</p>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {isEditMode ? 'Save Changes' : 'Add Category'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
