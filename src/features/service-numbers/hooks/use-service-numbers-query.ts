import { useQuery } from '@tanstack/react-query'

import { serviceNumbersService } from '@/features/service-numbers/api/service-numbers.service'

export function useServiceNumbersQuery() {
  return useQuery({
    queryKey: ['service-numbers'],
    queryFn: () => serviceNumbersService.list(),
  })
}
