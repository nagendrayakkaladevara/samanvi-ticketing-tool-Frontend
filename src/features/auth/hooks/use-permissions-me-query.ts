import { useQuery } from '@tanstack/react-query'
import { useEffect } from 'react'

import { fetchMyPermissions } from '@/features/auth/api/permissions-me.service'
import { useAuthStore } from '@/store/auth-store'

export function usePermissionsMeQuery() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const userId = useAuthStore((state) => state.user?.id)
  const updatePermissions = useAuthStore((state) => state.updatePermissions)

  const query = useQuery({
    queryKey: ['permissions', 'me', userId],
    queryFn: () => fetchMyPermissions(),
    enabled: isAuthenticated && Boolean(userId),
    staleTime: 5 * 60 * 1000,
    retry: 1,
  })

  useEffect(() => {
    if (query.data?.items?.length) {
      updatePermissions(query.data)
    }
  }, [query.data, updatePermissions])

  return query
}
