import { Navigate, Outlet, useLocation } from 'react-router-dom'

import { useAuthStore } from '@/store/auth-store'
import { useCurrentUser } from '@/hooks/use-current-user'

type ProtectedRouteProps = {
  allowedRoles?: string[]
}

export function ProtectedRoute({ allowedRoles }: ProtectedRouteProps) {
  const location = useLocation()
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const currentUser = useCurrentUser()

  if (!isAuthenticated) {
    const requestedPath = `${location.pathname}${location.search}${location.hash}`
    const loginPath = `/login?redirect=${encodeURIComponent(requestedPath)}`
    return <Navigate to={loginPath} replace state={{ from: requestedPath }} />
  }

  if (allowedRoles && (!currentUser || !allowedRoles.includes(currentUser.role))) {
    return <Navigate to="/" replace />
  }

  return <Outlet />
}
