/** Temporarily hidden from permission override UI; remove entries to restore. */
const hiddenPermissionOverrideModules = new Set([
  'tickets',
  'users',
  'issue_category',
  'issue_categories',
])

export function isHiddenPermissionOverrideModule(module: string): boolean {
  return hiddenPermissionOverrideModules.has(module.trim().toLowerCase())
}

export function filterPermissionTreeForOverrides<T extends { module: string }>(tree: T[]): T[] {
  return tree.filter((group) => !isHiddenPermissionOverrideModule(group.module))
}

export function partitionPermissionIds<T extends { id: string; module: string }>(
  items: T[],
  permissionIds: string[],
): { visibleIds: string[]; hiddenIds: string[] } {
  const itemMap = new Map(items.map((item) => [item.id, item]))
  const visibleIds: string[] = []
  const hiddenIds: string[] = []

  for (const id of permissionIds) {
    const item = itemMap.get(id)
    if (item && isHiddenPermissionOverrideModule(item.module)) {
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
