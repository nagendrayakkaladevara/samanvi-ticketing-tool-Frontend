import { useEffect, useMemo, useState } from 'react'
import { Check, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { FormLabel } from '@/components/ui/form-label'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { collectLeafRepairCategories } from '@/features/garage/api/garage.service'
import type { RepairCategoryTreeNode } from '@/features/garage/types/repair-category'
import { useIsMobile } from '@/hooks/use-mobile'
import { cn } from '@/lib/utils'

type RepairCategoryPickerProps = {
  id?: string
  tree: RepairCategoryTreeNode[]
  value: string
  onValueChange: (value: string) => void
  onBlur?: () => void
  disabled?: boolean
  invalid?: boolean
  placeholder?: string
  className?: string
  showLabel?: boolean
}

const selectTriggerClass =
  'h-10 min-w-0 [&>span]:line-clamp-1 [&>span]:block [&>span]:text-left [&>span]:leading-snug'

const selectItemClass = 'whitespace-normal py-2.5 pl-2 pr-8 text-sm leading-snug'

function findCategoryPath(
  nodes: RepairCategoryTreeNode[],
  targetId: string,
  path: RepairCategoryTreeNode[] = [],
): RepairCategoryTreeNode[] | null {
  for (const node of nodes) {
    const nextPath = [...path, node]
    if (node.id === targetId) return nextPath
    const nested = findCategoryPath(node.children, targetId, nextPath)
    if (nested) return nested
  }
  return null
}

function TreeViewToggle({
  enabled,
  onEnabledChange,
  disabled,
}: {
  enabled: boolean
  onEnabledChange: (enabled: boolean) => void
  disabled?: boolean
}) {
  return (
    <div className="flex shrink-0 items-center gap-2">
      <Label htmlFor="repair-category-tree-view" className="cursor-pointer text-xs text-muted-foreground">
        Tree view
      </Label>
      <Switch
        id="repair-category-tree-view"
        checked={enabled}
        onCheckedChange={onEnabledChange}
        disabled={disabled}
        aria-label="Toggle tree view"
      />
    </div>
  )
}

function DesktopCategoryMenuNodes({
  nodes,
  selectedId,
  onSelect,
}: {
  nodes: RepairCategoryTreeNode[]
  selectedId: string
  onSelect: (categoryId: string) => void
}) {
  return nodes.map((node) => {
    if (node.children.length > 0) {
      return (
        <DropdownMenuSub key={node.id}>
          <DropdownMenuSubTrigger className="whitespace-normal py-2">{node.name}</DropdownMenuSubTrigger>
          <DropdownMenuSubContent
            sideOffset={2}
            alignOffset={-4}
            collisionPadding={12}
            className="max-h-[min(20rem,60vh)] max-w-[min(18rem,calc(100vw-2rem))] overflow-y-auto"
          >
            <DesktopCategoryMenuNodes nodes={node.children} selectedId={selectedId} onSelect={onSelect} />
          </DropdownMenuSubContent>
        </DropdownMenuSub>
      )
    }

    return (
      <DropdownMenuItem
        key={node.id}
        className="whitespace-normal py-2"
        onSelect={() => onSelect(node.id)}
      >
        <span className="min-w-0 flex-1">{node.name}</span>
        {selectedId === node.id ? <Check className="ml-auto size-4 shrink-0" /> : null}
      </DropdownMenuItem>
    )
  })
}

function MobileCategoryMenu({
  nodes,
  selectedId,
  onSelect,
  navStack,
  onNavigateInto,
  onNavigateBack,
}: {
  nodes: RepairCategoryTreeNode[]
  selectedId: string
  onSelect: (categoryId: string) => void
  navStack: RepairCategoryTreeNode[]
  onNavigateInto: (node: RepairCategoryTreeNode) => void
  onNavigateBack: () => void
}) {
  const currentParent = navStack.at(-1)

  return (
    <>
      {currentParent ? (
        <DropdownMenuItem
          className="sticky top-0 z-10 border-b bg-popover py-2 font-medium"
          onSelect={(event) => {
            event.preventDefault()
            onNavigateBack()
          }}
        >
          <ChevronLeft className="size-4 shrink-0" />
          <span className="min-w-0 truncate">{currentParent.name}</span>
        </DropdownMenuItem>
      ) : null}

      {nodes.map((node) => {
        if (node.children.length > 0) {
          return (
            <DropdownMenuItem
              key={node.id}
              className="whitespace-normal py-2.5"
              onSelect={(event) => {
                event.preventDefault()
                onNavigateInto(node)
              }}
            >
              <span className="min-w-0 flex-1">{node.name}</span>
              <ChevronRight className="ml-auto size-4 shrink-0 text-muted-foreground" />
            </DropdownMenuItem>
          )
        }

        return (
          <DropdownMenuItem
            key={node.id}
            className="whitespace-normal py-2.5"
            onSelect={() => onSelect(node.id)}
          >
            <span className="min-w-0 flex-1">{node.name}</span>
            {selectedId === node.id ? <Check className="ml-auto size-4 shrink-0" /> : null}
          </DropdownMenuItem>
        )
      })}
    </>
  )
}

function MenuCategoryPicker({
  id,
  tree,
  value,
  onValueChange,
  onBlur,
  disabled,
  invalid,
  placeholder,
  className,
}: Omit<RepairCategoryPickerProps, 'showLabel'>) {
  const isMobile = useIsMobile()
  const [open, setOpen] = useState(false)
  const [navStack, setNavStack] = useState<RepairCategoryTreeNode[]>([])

  const labelById = useMemo(() => {
    const map = new Map<string, string>()
    for (const option of collectLeafRepairCategories(tree)) {
      map.set(option.id, option.label)
    }
    return map
  }, [tree])

  const selectedLabel = value ? labelById.get(value) : undefined
  const hasCategories = tree.length > 0
  const mobileNodes = navStack.length > 0 ? (navStack.at(-1)?.children ?? []) : tree

  useEffect(() => {
    if (!open) {
      setNavStack([])
    }
  }, [open])

  const handleSelect = (categoryId: string) => {
    onValueChange(categoryId)
    setOpen(false)
  }

  return (
    <DropdownMenu
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen)
        if (!nextOpen) {
          onBlur?.()
        }
      }}
    >
      <DropdownMenuTrigger asChild disabled={disabled}>
        <Button
          id={id}
          type="button"
          variant="outline"
          aria-invalid={invalid}
          onBlur={onBlur}
          className={cn(
            'h-10 w-full justify-between px-3 font-normal shadow-sm',
            'aria-invalid:border-red-500 aria-invalid:ring-1 aria-invalid:ring-red-500/30',
            !selectedLabel && 'text-muted-foreground',
            className,
          )}
        >
          <span className="min-w-0 flex-1 truncate text-left leading-snug">
            {selectedLabel ?? placeholder}
          </span>
          <ChevronDown className="ml-2 size-4 shrink-0 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        collisionPadding={12}
        className={cn(
          'max-h-[min(24rem,70vh)] overflow-y-auto',
          isMobile
            ? 'w-[min(calc(100vw-2rem),var(--radix-dropdown-menu-trigger-width))]'
            : 'w-[var(--radix-dropdown-menu-trigger-width)]',
        )}
      >
        {!hasCategories ? (
          <DropdownMenuItem disabled className="whitespace-normal py-2">
            No categories available
          </DropdownMenuItem>
        ) : isMobile ? (
          <MobileCategoryMenu
            nodes={mobileNodes}
            selectedId={value}
            onSelect={handleSelect}
            navStack={navStack}
            onNavigateInto={(node) => setNavStack((prev) => [...prev, node])}
            onNavigateBack={() => setNavStack((prev) => prev.slice(0, -1))}
          />
        ) : (
          <DesktopCategoryMenuNodes nodes={tree} selectedId={value} onSelect={handleSelect} />
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function CascadingCategorySelects({
  id,
  tree,
  value,
  onValueChange,
  onBlur,
  disabled,
  invalid,
  className,
}: Omit<RepairCategoryPickerProps, 'showLabel' | 'placeholder'>) {
  const [selectedPath, setSelectedPath] = useState<RepairCategoryTreeNode[]>(() => {
    if (!value) return []
    return findCategoryPath(tree, value) ?? []
  })

  useEffect(() => {
    if (value) {
      const path = findCategoryPath(tree, value)
      if (path) setSelectedPath(path)
      return
    }

    setSelectedPath((prev) => {
      const last = prev.at(-1)
      if (!last || last.children.length > 0) return prev
      return []
    })
  }, [tree, value])

  const dropdownLevels = useMemo(() => {
    const levels: Array<{
      level: number
      options: RepairCategoryTreeNode[]
      selectedId: string
      parentName?: string
    }> = []

    let options = tree
    for (let level = 0; level <= selectedPath.length; level += 1) {
      if (options.length === 0) break

      levels.push({
        level: level + 1,
        options,
        selectedId: selectedPath[level]?.id ?? '',
        parentName: level > 0 ? selectedPath[level - 1]?.name : undefined,
      })

      const selectedNode = selectedPath[level]
      if (!selectedNode || selectedNode.children.length === 0) break
      options = selectedNode.children
    }

    return levels
  }, [selectedPath, tree])

  const handleLevelChange = (levelIndex: number, categoryId: string) => {
    const levelOptions = dropdownLevels[levelIndex]?.options ?? []
    const selectedNode = levelOptions.find((node) => node.id === categoryId)
    if (!selectedNode) return

    const nextPath = [...selectedPath.slice(0, levelIndex), selectedNode]
    setSelectedPath(nextPath)

    if (selectedNode.children.length === 0) {
      onValueChange(selectedNode.id)
      return
    }

    onValueChange('')
  }

  if (tree.length === 0) {
    return (
      <Select disabled>
        <SelectTrigger id={id} className={cn(selectTriggerClass, className, invalid && 'border-red-500 ring-1 ring-red-500/30')}>
          <SelectValue placeholder="No categories available" />
        </SelectTrigger>
      </Select>
    )
  }

  return (
    <div className="space-y-3">
      {dropdownLevels.map((level, index) => (
        <div key={`level-${level.level}`} className="space-y-1.5">
          <Label
            htmlFor={index === 0 && id ? id : `${id ?? 'repairCategory'}-level-${level.level}`}
            className="text-xs text-muted-foreground"
          >
            Level {level.level}
            {level.parentName ? (
              <span className="font-normal"> · under {level.parentName}</span>
            ) : null}
          </Label>
          <Select
            value={level.selectedId || undefined}
            onValueChange={(nextValue) => handleLevelChange(index, nextValue)}
            disabled={disabled}
          >
            <SelectTrigger
              id={index === 0 ? id : `${id ?? 'repairCategory'}-level-${level.level}`}
              aria-invalid={invalid && index === dropdownLevels.length - 1}
              className={cn(
                selectTriggerClass,
                className,
                invalid && index === dropdownLevels.length - 1 && 'border-red-500 ring-1 ring-red-500/30',
              )}
              onBlur={index === dropdownLevels.length - 1 ? onBlur : undefined}
            >
              <SelectValue
                placeholder={
                  level.level === 1 ? 'Select category' : `Select subcategory (level ${level.level})`
                }
              />
            </SelectTrigger>
            <SelectContent position="popper" className="max-h-[min(20rem,60vh)] w-[var(--radix-select-trigger-width)]">
              {level.options.map((node) => (
                <SelectItem key={node.id} value={node.id} className={selectItemClass}>
                  {node.name}
                  {node.children.length > 0 ? (
                    <span className="ml-1 text-xs text-muted-foreground">(has subcategories)</span>
                  ) : null}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      ))}
    </div>
  )
}

export function RepairCategoryPicker({
  id = 'repairCategoryId',
  tree,
  value,
  onValueChange,
  onBlur,
  disabled = false,
  invalid = false,
  placeholder = 'Select repair category',
  className,
  showLabel = true,
}: RepairCategoryPickerProps) {
  const [treeViewEnabled, setTreeViewEnabled] = useState(false)

  return (
    <div className="space-y-2">
      {showLabel ? (
        <div className="flex items-start justify-between gap-3">
          <FormLabel htmlFor={id} required className="pt-0.5">
            Repair Category
          </FormLabel>
          <TreeViewToggle
            enabled={treeViewEnabled}
            onEnabledChange={setTreeViewEnabled}
            disabled={disabled}
          />
        </div>
      ) : null}

      {treeViewEnabled ? (
        <CascadingCategorySelects
          id={id}
          tree={tree}
          value={value}
          onValueChange={onValueChange}
          onBlur={onBlur}
          disabled={disabled}
          invalid={invalid}
          className={className}
        />
      ) : (
        <MenuCategoryPicker
          id={id}
          tree={tree}
          value={value}
          onValueChange={onValueChange}
          onBlur={onBlur}
          disabled={disabled}
          invalid={invalid}
          placeholder={placeholder}
          className={className}
        />
      )}
    </div>
  )
}
