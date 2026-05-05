import { Navigate, Outlet, useLocation } from 'react-router-dom'

import { useAuthStore } from '@/store/auth-store'
import { useCurrentUser } from '@/hooks/use-current-user'

type ProtectedRouteProps = {
  allowedRoles?: Array<'ADMIN' | 'SUPERVISOR' | 'WORKER' | 'VIEWER'>
}

export function ProtectedRoute({ allowedRoles }: ProtectedRouteProps) {
  const location = useLocation()
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const currentUser = useCurrentUser()

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  if (allowedRoles && (!currentUser || !allowedRoles.includes(currentUser.role))) {
    return <Navigate to="/" replace />
  }

  return <Outlet />
}
