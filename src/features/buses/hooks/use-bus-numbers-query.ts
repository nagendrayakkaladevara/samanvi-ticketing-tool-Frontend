import { useQuery } from '@tanstack/react-query'

import { busesService } from '@/features/buses/api/buses.service'

export function useBusNumbersQuery() {
  return useQuery({
    queryKey: ['buses', 'bus-numbers'],
    queryFn: busesService.listBusNumbers,
    staleTime: 5 * 60 * 1000,
  })
}
