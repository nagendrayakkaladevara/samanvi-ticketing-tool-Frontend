import { useMemo } from 'react'

import {
  getSubmoduleLabelFromTree,
  NAV_REGISTRY,
  type NavGroup,
  type NavRegistryEntry,
} from '@/config/nav-registry'
import { canAccessRoute, getFirstAllowedRoute } from '@/features/auth/utils/permission-checks'
import { useAuthStore } from '@/store/auth-store'

export type AppNavItem = {
  id: string
  to: string
  label: string
  icon?: NavRegistryEntry['icon']
  end?: boolean
  external?: boolean
}

export type AppNavGroup = {
  id: NavGroup
  label: string
  items: AppNavItem[]
}

function resolveIsAdmin(user: ReturnType<typeof useAuthStore.getState>['user']): boolean {
  if (!user) {
    return false
  }

  if (user.userType === 'admin') {
    return true
  }

  return user.role === 'ADMIN'
}

function permissionSubmoduleKey(permission: NavRegistryEntry['permission']): string | undefined {
  if (!permission?.module || permission.submodule === undefined) {
    return undefined
  }
  return `${permission.module}:${permission.submodule}`
}

function buildGroupItems(
  group: NavGroup,
  permissionSet: Set<string>,
  tree: ReturnType<typeof useAuthStore.getState>['permissions'],
  isAdmin: boolean,
): AppNavItem[] {
  const visibleEntries = NAV_REGISTRY.filter((entry) => entry.group === group && !entry.hidden)
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .filter((entry) => canAccessRoute(permissionSet, entry.permission, isAdmin))

  const submoduleUsage = new Map<string, number>()
  for (const entry of visibleEntries) {
    const key = permissionSubmoduleKey(entry.permission)
    if (key) {
      submoduleUsage.set(key, (submoduleUsage.get(key) ?? 0) + 1)
    }
  }

  return visibleEntries.map((entry) => {
    const submoduleKey = permissionSubmoduleKey(entry.permission)
    const usePermissionLabel = submoduleKey !== undefined && (submoduleUsage.get(submoduleKey) ?? 0) === 1
    const treeLabel =
      usePermissionLabel && entry.permission?.module && entry.permission.submodule !== undefined
        ? getSubmoduleLabelFromTree(tree?.tree ?? [], entry.permission.module, entry.permission.submodule)
        : undefined

    return {
      id: entry.id,
      to: entry.to,
      label: treeLabel ?? entry.label,
      icon: entry.icon,
      end: entry.end,
      external: entry.external,
    }
  })
}

export function useAppNavigation() {
  const permissionSet = useAuthStore((state) => state.permissionSet)
  const permissions = useAuthStore((state) => state.permissions)
  const user = useAuthStore((state) => state.user)
  const isAdmin = resolveIsAdmin(user)

  return useMemo(() => {
    const mainItems = buildGroupItems('main', permissionSet, permissions, isAdmin)
    const mastersItems = buildGroupItems('masters', permissionSet, permissions, isAdmin)
    const garageItems = buildGroupItems('garage', permissionSet, permissions, isAdmin)

    const groups: AppNavGroup[] = []

    if (mastersItems.length > 0) {
      groups.push({ id: 'masters', label: 'Masters', items: mastersItems })
    }

    if (garageItems.length > 0) {
      groups.push({ id: 'garage', label: 'Garage', items: garageItems })
    }

    return {
      mainItems,
      mastersItems,
      garageItems,
      groups,
    }
  }, [permissionSet, permissions, isAdmin])
}

export function useFirstAllowedRoute(): string {
  const permissionSet = useAuthStore((state) => state.permissionSet)
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const user = useAuthStore((state) => state.user)
  const isAdmin = resolveIsAdmin(user)

  return useMemo(
    () => getFirstAllowedRoute(permissionSet, isAuthenticated, isAdmin),
    [permissionSet, isAuthenticated, isAdmin],
  )
}
