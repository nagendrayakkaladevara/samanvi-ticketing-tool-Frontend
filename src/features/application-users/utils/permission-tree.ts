import type { Permission, PermissionTreeGroup } from '@/features/application-users/types/permission'

const HIDDEN_PERMISSION_MODULES = new Set(['tickets', 'issue_category', 'issue_categories'])
const HIDDEN_PERMISSION_SUBMODULES = new Set(['issue_category', 'issue_categories'])

function normalizePermissionKey(value: string): string {
  return value.trim().toLowerCase()
}

export function isHiddenPermissionModule(module: string): boolean {
  return HIDDEN_PERMISSION_MODULES.has(normalizePermissionKey(module))
}

export function isHiddenPermissionSubmodule(submodule: string): boolean {
  return HIDDEN_PERMISSION_SUBMODULES.has(normalizePermissionKey(submodule))
}

export function filterVisiblePermissionTree(tree: PermissionTreeGroup[]): PermissionTreeGroup[] {
  return tree
    .filter((group) => !isHiddenPermissionModule(group.module))
    .map((group) => ({
      ...group,
      submodules: group.submodules.filter(
        (submodule) => !isHiddenPermissionSubmodule(submodule.submodule),
      ),
    }))
    .filter((group) => group.submodules.length > 0)
}

export function partitionPermissionIds(
  items: Permission[],
  permissionIds: string[],
): { visibleIds: string[]; hiddenIds: string[] } {
  const itemMap = new Map(items.map((item) => [item.id, item]))
  const visibleIds: string[] = []
  const hiddenIds: string[] = []

  for (const id of permissionIds) {
    const item = itemMap.get(id)
    if (
      item &&
      (isHiddenPermissionModule(item.module) || isHiddenPermissionSubmodule(item.submodule))
    ) {
      hiddenIds.push(id)
      continue
    }

    visibleIds.push(id)
  }

  return { visibleIds, hiddenIds }
}

export function mergePermissionIdsForSave(visibleIds: string[], hiddenIds: string[]): string[] {
  return Array.from(new Set([...hiddenIds, ...visibleIds]))
}
