import { Navigate, Outlet, useLocation } from 'react-router-dom'

import { getPostLoginRedirect } from '@/lib/auth/get-post-login-redirect'
import { useAuthStore } from '@/store/auth-store'

export function PublicOnlyRoute() {
  const location = useLocation()
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)

  if (isAuthenticated) {
    return <Navigate to={getPostLoginRedirect(location)} replace />
  }

  return <Outlet />
}
