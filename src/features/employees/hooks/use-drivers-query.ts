import { useQuery } from '@tanstack/react-query'

import { driversService } from '@/features/employees/api/drivers.service'

export function useDriversQuery() {
  return useQuery({
    queryKey: ['drivers'],
    queryFn: () => driversService.list({ page: 1, limit: 100 }),
  })
}

export function useDriverDetailQuery(driverId: string | null, enabled: boolean) {
  return useQuery({
    queryKey: ['drivers', driverId],
    queryFn: () => driversService.getById(driverId!),
    enabled: enabled && Boolean(driverId),
  })
}
