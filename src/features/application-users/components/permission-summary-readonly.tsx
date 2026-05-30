import { Shield } from 'lucide-react'

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import type { PermissionTreeGroup } from '@/features/application-users/types/permission'
import { filterVisiblePermissionTree } from '@/features/application-users/utils/permission-tree'
import { formatPermissionAction, formatPermissionModuleLabel } from '@/features/application-users/utils/permission-labels'
import { cn } from '@/lib/utils'

type PermissionSummaryReadonlyProps = {
  tree: PermissionTreeGroup[]
  selectedIds: string[]
  className?: string
}

export function PermissionSummaryReadonly({ tree, selectedIds, className }: PermissionSummaryReadonlyProps) {
  const selectedSet = new Set(selectedIds)
  const visibleTree = filterVisiblePermissionTree(tree)

  const groupsWithSelections = visibleTree
    .map((group) => {
      const submodules = group.submodules
        .map((submodule) => ({
          ...submodule,
          permissions: submodule.permissions.filter((permission) => selectedSet.has(permission.id)),
        }))
        .filter((submodule) => submodule.permissions.length > 0)

      return { ...group, submodules }
    })
    .filter((group) => group.submodules.length > 0)

  if (groupsWithSelections.length === 0) {
    return (
      <div
        className={cn(
          'flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed px-4 py-8 text-center',
          className,
        )}
      >
        <Shield className="h-5 w-5 text-muted-foreground/70" />
        <p className="text-sm text-muted-foreground">No direct permission overrides assigned.</p>
        <p className="text-xs text-muted-foreground">Role template permissions still apply.</p>
      </div>
    )
  }

  return (
    <div className={cn('space-y-3', className)}>
      {groupsWithSelections.map((group) => {
        const groupCount = group.submodules.reduce(
          (total, submodule) => total + submodule.permissions.length,
          0,
        )

        return (
          <Collapsible key={group.module} defaultOpen className="group/collapsible rounded-lg border">
            <CollapsibleTrigger className="flex w-full items-center justify-between px-4 py-3 text-left">
              <div className="min-w-0">
                <p className="font-medium">{formatPermissionModuleLabel(group.module, group.label)}</p>
                <p className="text-xs text-muted-foreground">
                  {groupCount} override{groupCount === 1 ? '' : 's'}
                </p>
              </div>
              <span className="text-xs font-medium text-primary">{groupCount}</span>
            </CollapsibleTrigger>

            <CollapsibleContent className="border-t px-4 py-3">
              <div className="space-y-4">
                {group.submodules.map((submodule) => (
                  <div key={`${group.module}-${submodule.submodule}`} className="space-y-2">
                    <p className="text-sm font-medium">{submodule.label}</p>
                    <div className="flex flex-wrap gap-2 pl-0 sm:pl-1">
                      {submodule.permissions.map((permission) => (
                        <span
                          key={permission.id}
                          className="inline-flex items-center rounded-full border border-primary/30 bg-primary/5 px-2.5 py-1 text-xs font-medium text-foreground"
                        >
                          {permission.label ?? formatPermissionAction(permission.action)}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CollapsibleContent>
          </Collapsible>
        )
      })}
    </div>
  )
}
