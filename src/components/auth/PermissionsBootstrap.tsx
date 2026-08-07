import { useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'

import { fetchMyPermissions } from '@/features/auth/api/permissions-me.service'
import { useAuthStore } from '@/store/auth-store'

export function PermissionsBootstrap() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const userId = useAuthStore((state) => state.user?.id)
  const permissions = useAuthStore((state) => state.permissions)
  const updatePermissions = useAuthStore((state) => state.updatePermissions)

  const needsRefresh = isAuthenticated && Boolean(userId) && !permissions?.items?.length

  const { data } = useQuery({
    queryKey: ['permissions', 'me', userId],
    queryFn: () => fetchMyPermissions(),
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
