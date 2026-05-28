import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'

import type { RoutePermissionRequirement } from '@/config/nav-registry'
import { getFirstAllowedRoute } from '@/features/auth/utils/permission-checks'
import { usePermissions } from '@/hooks/use-permissions'
import { useAuthStore } from '@/store/auth-store'

type PermissionGuardProps = {
  module?: string
  submodule?: string
  action?: string
  authOnly?: boolean
  requirement?: RoutePermissionRequirement
  fallback?: ReactNode
  children: ReactNode
}

export function PermissionGuard({
  module,
  submodule = '',
  action = 'view',
  authOnly = false,
  requirement,
  fallback,
  children,
}: PermissionGuardProps) {
  const { canAccess, isAdmin } = usePermissions()
  const permissionSet = useAuthStore((state) => state.permissionSet)
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)

  const resolvedRequirement: RoutePermissionRequirement = requirement ?? {
    authOnly,
    module,
    submodule,
    action,
  }

  if (canAccess(resolvedRequirement)) {
    return <>{children}</>
  }

  if (fallback) {
    return <>{fallback}</>
  }

  const redirectTo = getFirstAllowedRoute(permissionSet, isAuthenticated, isAdmin)
  return <Navigate to={redirectTo} replace />
}

type PermissionGateProps = {
  module: string
  submodule?: string
  action?: string
  fallback?: ReactNode
  children: ReactNode
}

export function PermissionGate({
  module,
  submodule = '',
  action = 'view',
  fallback = null,
  children,
}: PermissionGateProps) {
  const { has } = usePermissions()

  if (!has(module, submodule, action)) {
    return <>{fallback}</>
  }

  return <>{children}</>
}
