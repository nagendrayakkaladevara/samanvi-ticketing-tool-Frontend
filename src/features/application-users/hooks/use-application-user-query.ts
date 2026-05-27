import { useQuery } from '@tanstack/react-query'

import { applicationUsersService } from '@/features/application-users/api/application-users.service'

export function useApplicationUserQuery(userId: string | undefined) {
  return useQuery({
    queryKey: ['application-users', userId],
    queryFn: () => applicationUsersService.getById(userId!),
    enabled: Boolean(userId),
  })
}
