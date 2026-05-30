import type { PermissionTreeGroup } from '@/features/application-users/types/permission'

const HIDDEN_PERMISSION_MODULES = new Set(['tickets'])
const HIDDEN_PERMISSION_SUBMODULES = new Set(['issue_category'])

export function filterVisiblePermissionTree(tree: PermissionTreeGroup[]): PermissionTreeGroup[] {
  return tree
    .filter((group) => !HIDDEN_PERMISSION_MODULES.has(group.module))
    .map((group) => ({
      ...group,
      submodules: group.submodules.filter(
        (submodule) => !HIDDEN_PERMISSION_SUBMODULES.has(submodule.submodule),
      ),
    }))
    .filter((group) => group.submodules.length > 0)
}
