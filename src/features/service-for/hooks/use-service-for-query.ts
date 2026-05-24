import { useQuery } from '@tanstack/react-query'

import { serviceForService } from '@/features/service-for/api/service-for.service'

export function useServiceForQuery() {
  return useQuery({
    queryKey: ['service-for'],
    queryFn: serviceForService.list,
  })
}
