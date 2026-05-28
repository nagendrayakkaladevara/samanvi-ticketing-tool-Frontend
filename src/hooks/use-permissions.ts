import { useCallback, useMemo } from 'react'

import {
  canAccessRoute,
  canManageSubmodule,
  canPerformAction,
  hasPermission,
} from '@/features/auth/utils/permission-checks'
import { useAuthStore } from '@/store/auth-store'

function resolveIsAdmin(user: ReturnType<typeof useAuthStore.getState>['user']): boolean {
  if (!user) {
    return false
  }

  if (user.userType === 'admin') {
    return true
  }

  return user.role === 'ADMIN'
}

export function usePermissions() {
  const permissionSet = useAuthStore((state) => state.permissionSet)
  const permissions = useAuthStore((state) => state.permissions)
  const user = useAuthStore((state) => state.user)
  const isAdmin = useMemo(() => resolveIsAdmin(user), [user])

  const has = useCallback(
    (module: string, submodule: string, action: string) =>
      hasPermission(permissionSet, module, submodule, action, isAdmin),
    [permissionSet, isAdmin],
  )

  const can = useCallback(
    (module: string, submodule: string, action: string) =>
      canPerformAction(permissionSet, module, submodule, action, isAdmin),
    [permissionSet, isAdmin],
  )

  const canManage = useCallback(
    (module: string, submodule: string) => canManageSubmodule(permissionSet, module, submodule, isAdmin),
    [permissionSet, isAdmin],
  )

  const canAccess = useCallback(
    (requirement: Parameters<typeof canAccessRoute>[1]) => canAccessRoute(permissionSet, requirement, isAdmin),
    [permissionSet, isAdmin],
  )

  return {
    permissionSet,
    permissions,
    isAdmin,
    has,
    can,
    canManage,
    canAccess,
  }
}

export function useSubmoduleActions(module: string, submodule: string) {
  const { can } = usePermissions()

  return useMemo(
    () => ({
      canCreate: can(module, submodule, 'create'),
      canEdit: can(module, submodule, 'edit'),
      canDelete: can(module, submodule, 'delete'),
      canManage:
        can(module, submodule, 'create') ||
        can(module, submodule, 'edit') ||
        can(module, submodule, 'delete'),
    }),
    [can, module, submodule],
  )
}
