import { useQuery } from '@tanstack/react-query'

import { applicationUsersService } from '@/features/application-users/api/application-users.service'

export function useApplicationUsersQuery() {
  return useQuery({
    queryKey: ['application-users'],
    queryFn: applicationUsersService.list,
  })
}
