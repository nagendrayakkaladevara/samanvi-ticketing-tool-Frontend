import { useQuery } from '@tanstack/react-query'

import { masterBusesService } from '@/features/master-buses/api/master-buses.service'

export function useMasterBusesQuery() {
  return useQuery({
    queryKey: ['master-buses'],
    queryFn: () => masterBusesService.list(),
  })
}

export function useMasterBusNumbersQuery(enabled = true) {
  return useQuery({
    queryKey: ['master-bus-numbers'],
    queryFn: masterBusesService.listBusNumbers,
    enabled,
  })
}
