import { useQuery } from '@tanstack/react-query'

import { usersService } from '@/features/users/api/users.service'

export function useUsersQuery() {
  return useQuery({
    queryKey: ['users'],
    queryFn: usersService.list,
  })
}
