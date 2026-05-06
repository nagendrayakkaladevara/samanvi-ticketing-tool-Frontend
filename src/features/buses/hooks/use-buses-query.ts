import { useQuery } from '@tanstack/react-query'

import { busesService } from '@/features/buses/api/buses.service'

export function useBusesQuery() {
  return useQuery({
    queryKey: ['buses'],
    queryFn: busesService.list,
  })
}
