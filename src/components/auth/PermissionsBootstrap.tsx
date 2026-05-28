import { useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'

import { fetchMyPermissions } from '@/features/auth/api/permissions-me.service'
import { useAuthStore } from '@/store/auth-store'

export function PermissionsBootstrap() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const permissions = useAuthStore((state) => state.permissions)
  const updatePermissions = useAuthStore((state) => state.updatePermissions)

  const needsRefresh = isAuthenticated && !permissions?.items?.length

  const { data } = useQuery({
    queryKey: ['permissions', 'me'],
    queryFn: fetchMyPermissions,
    enabled: needsRefresh,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  })

  useEffect(() => {
    if (data?.items?.length) {
      updatePermissions(data)
    }
  }, [data, updatePermissions])

  return null
}
