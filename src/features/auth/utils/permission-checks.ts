import type { PermissionTreeGroup } from '@/features/application-users/types/permission'
import type { PermissionCheck, RoutePermissionRequirement } from '@/config/nav-registry'
import { HOME_ROUTE_PRIORITY, NAV_REGISTRY } from '@/config/nav-registry'
import { buildPermissionKey } from '@/features/permissions/utils/permission-normalize'

function resolvePermissionCheck(
  permissionSet: Set<string>,
  check: PermissionCheck,
  isAdmin: boolean,
): boolean {
  return hasPermission(
    permissionSet,
    check.module,
    check.submodule ?? '',
    check.action ?? 'view',
    isAdmin,
  )
}

export function hasAnyPermission(
  permissionSet: Set<string>,
  checks: PermissionCheck[],
  isAdmin = false,
): boolean {
  if (isAdmin) {
    return true
  }

  return checks.some((check) => resolvePermissionCheck(permissionSet, check, false))
}

export function hasPermission(
  permissionSet: Set<string>,
  module: string,
  submodule: string,
  action: string,
  isAdmin = false,
): boolean {
  if (isAdmin) {
    return true
  }

  return permissionSet.has(buildPermissionKey(module, submodule, action))
}

export function canAccessRoute(
  permissionSet: Set<string>,
  requirement: RoutePermissionRequirement | undefined,
  isAdmin = false,
): boolean {
  if (isAdmin) {
    return true
  }

  if (!requirement || requirement.authOnly) {
    return true
  }

  if (requirement.anyOf && requirement.anyOf.length > 0) {
    return hasAnyPermission(permissionSet, requirement.anyOf, false)
  }

  const { module, submodule = '', action = 'view' } = requirement
  if (!module) {
    return true
  }

  return hasPermission(permissionSet, module, submodule, action, false)
}

export function hasAnyViewInModule(tree: PermissionTreeGroup[], module: string): boolean {
  const group = tree.find((item) => item.module === module)
  if (!group) {
    return false
  }

  return group.submodules.some((submodule) =>
    submodule.permissions.some((permission) => permission.action === 'view'),
  )
}

export function getFirstAllowedRoute(
  permissionSet: Set<string>,
  isAuthenticated: boolean,
  isAdmin = false,
): string {
  if (!isAuthenticated) {
    return '/login'
  }

  for (const route of HOME_ROUTE_PRIORITY) {
    const entry = NAV_REGISTRY.find((item) => item.to === route && !item.hidden)
    if (entry && canAccessRoute(permissionSet, entry.permission, isAdmin)) {
      return route
    }
  }

  const visibleEntry = NAV_REGISTRY.filter((item) => !item.hidden && !item.external)
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .find((entry) => canAccessRoute(permissionSet, entry.permission, isAdmin))

  return visibleEntry?.to ?? '/tickets'
}

export function canPerformAction(
  permissionSet: Set<string>,
  module: string,
  submodule: string,
  action: string,
  isAdmin = false,
): boolean {
  return hasPermission(permissionSet, module, submodule, action, isAdmin)
}

export function canManageSubmodule(
  permissionSet: Set<string>,
  module: string,
  submodule: string,
  isAdmin = false,
): boolean {
  return (
    canPerformAction(permissionSet, module, submodule, 'create', isAdmin) ||
    canPerformAction(permissionSet, module, submodule, 'edit', isAdmin) ||
    canPerformAction(permissionSet, module, submodule, 'delete', isAdmin)
  )
}
