import { useQuery } from '@tanstack/react-query'

import { applicationUsersService } from '@/features/application-users/api/application-users.service'

export function useLinkableEmployeesQuery(excludeUserId?: string, enabled = true) {
  return useQuery({
    queryKey: ['application-users', 'linkable-employees', excludeUserId ?? null],
    queryFn: () => applicationUsersService.listLinkableEmployees(excludeUserId),
    enabled,
  })
}
