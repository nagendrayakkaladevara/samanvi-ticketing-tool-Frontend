import { useQuery } from '@tanstack/react-query'

import { serviceNumbersService } from '@/features/service-numbers/api/service-numbers.service'

export function useServiceNumbersQuery() {
  return useQuery({
    queryKey: ['service-numbers'],
    queryFn: () => serviceNumbersService.list({ page: 1, limit: 50 }),
  })
}
