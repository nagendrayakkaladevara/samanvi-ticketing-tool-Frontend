import { useQuery } from '@tanstack/react-query'

import { permissionsService } from '@/features/application-users/api/permissions.service'

export function usePermissionsQuery() {
  return useQuery({
    queryKey: ['permissions'],
    queryFn: permissionsService.list,
  })
}
