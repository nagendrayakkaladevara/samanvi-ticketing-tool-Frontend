import { ChevronRight } from 'lucide-react'

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import type { PermissionTreeGroup } from '@/features/application-users/types/permission'
import { filterVisiblePermissionTree } from '@/features/application-users/utils/permission-tree'
import {
  formatPermissionAction,
  formatPermissionModuleLabel,
  formatPermissionToken,
} from '@/features/application-users/utils/permission-labels'
import { cn } from '@/lib/utils'

type PermissionPickerProps = {
  tree: PermissionTreeGroup[]
  selectedIds: string[]
  onChange: (permissionIds: string[]) => void
  disabled?: boolean
}

function togglePermission(selectedIds: string[], permissionId: string): string[] {
  return selectedIds.includes(permissionId)
    ? selectedIds.filter((id) => id !== permissionId)
    : [...selectedIds, permissionId]
}

function toggleGroup(selectedIds: string[], permissionIds: string[]): string[] {
  const allSelected = permissionIds.every((id) => selectedIds.includes(id))
  if (allSelected) {
    return selectedIds.filter((id) => !permissionIds.includes(id))
  }

  return Array.from(new Set([...selectedIds, ...permissionIds]))
}

export function PermissionPicker({ tree, selectedIds, onChange, disabled = false }: PermissionPickerProps) {
  const visibleTree = filterVisiblePermissionTree(tree)

  if (visibleTree.length === 0) {
    return (
      <p className="rounded-md border border-dashed px-4 py-6 text-center text-sm text-muted-foreground">
        No permissions available in the catalog.
      </p>
    )
  }

  return (
    <div className="space-y-3">
      {visibleTree.map((group) => {
        const groupPermissionIds = group.submodules.flatMap((submodule) =>
          submodule.permissions.map((permission) => permission.id),
        )
        const selectedCount = groupPermissionIds.filter((id) => selectedIds.includes(id)).length

        const groupLabel = formatPermissionModuleLabel(group.module, group.label)

        return (
          <Collapsible key={group.module} defaultOpen={selectedCount > 0} className="group/collapsible rounded-lg border">
            <div className="flex items-center gap-3 px-4 py-3">
              <input
                type="checkbox"
                className="h-4 w-4 shrink-0 rounded border-input"
                checked={selectedCount > 0 && selectedCount === groupPermissionIds.length}
                ref={(element) => {
                  if (element) {
                    element.indeterminate = selectedCount > 0 && selectedCount < groupPermissionIds.length
                  }
                }}
                onChange={() => onChange(toggleGroup(selectedIds, groupPermissionIds))}
                disabled={disabled}
                aria-label={`Toggle all permissions for ${groupLabel}`}
              />
              <CollapsibleTrigger className="flex min-w-0 flex-1 items-center justify-between text-left">
                <div className="min-w-0">
                  <p className="font-medium">{groupLabel}</p>
                  <p className="text-xs text-muted-foreground">
                    {selectedCount}/{groupPermissionIds.length} selected
                  </p>
                </div>
                <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-data-[state=open]/collapsible:rotate-90" />
              </CollapsibleTrigger>
            </div>

            <CollapsibleContent className="border-t px-4 py-3">
              <div className="space-y-4">
                {group.submodules.map((submodule) => {
                  const submodulePermissionIds = submodule.permissions.map((permission) => permission.id)
                  const submoduleSelectedCount = submodulePermissionIds.filter((id) =>
                    selectedIds.includes(id),
                  ).length

                  return (
                    <div key={`${group.module}-${submodule.submodule}`} className="space-y-2">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          className="h-4 w-4 shrink-0 rounded border-input"
                          checked={
                            submoduleSelectedCount > 0 &&
                            submoduleSelectedCount === submodulePermissionIds.length
                          }
                          ref={(element) => {
                            if (element) {
                              element.indeterminate =
                                submoduleSelectedCount > 0 &&
                                submoduleSelectedCount < submodulePermissionIds.length
                            }
                          }}
                          onChange={() => onChange(toggleGroup(selectedIds, submodulePermissionIds))}
                          disabled={disabled}
                          aria-label={`Toggle all permissions for ${submodule.label}`}
                        />
                        <p className="text-sm font-medium">{submodule.label}</p>
                      </div>

                      <div className="grid gap-2 pl-6 sm:grid-cols-2">
                        {submodule.permissions.map((permission) => (
                          <label
                            key={permission.id}
                            className={cn(
                              'flex cursor-pointer items-start gap-2 rounded-md border px-3 py-2 text-sm transition-colors',
                              selectedIds.includes(permission.id)
                                ? 'border-primary/40 bg-primary/5'
                                : 'hover:bg-muted/40',
                              disabled && 'cursor-not-allowed opacity-60',
                            )}
                          >
                            <input
                              type="checkbox"
                              className="mt-0.5 h-4 w-4 shrink-0 rounded border-input"
                              checked={selectedIds.includes(permission.id)}
                              onChange={() => onChange(togglePermission(selectedIds, permission.id))}
                              disabled={disabled}
                            />
                            <span className="min-w-0">
                              <span className="font-medium">
                                {permission.label ?? formatPermissionAction(permission.action)}
                              </span>
                              <span className="mt-0.5 block text-xs text-muted-foreground">
                                {permission.key ??
                                  `${formatPermissionModuleLabel(permission.module)}${
                                    permission.submodule ? ` / ${formatPermissionToken(permission.submodule)}` : ''
                                  } / ${formatPermissionAction(permission.action)}`}
                              </span>
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            </CollapsibleContent>
          </Collapsible>
        )
      })}
    </div>
  )
}
