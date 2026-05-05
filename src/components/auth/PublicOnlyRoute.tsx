import { Navigate, Outlet } from 'react-router-dom'

import { useAuthStore } from '@/store/auth-store'

export function PublicOnlyRoute() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)

  if (isAuthenticated) {
    return <Navigate to="/" replace />
  }

  return <Outlet />
}
