import { useQuery } from '@tanstack/react-query'

import { garageService } from '@/features/garage/api/garage.service'

export function useRepairPartsQuery() {
  return useQuery({
    queryKey: ['garage', 'repair-parts'],
    queryFn: () => garageService.listRepairParts({ page: 1, limit: 100 }),
    staleTime: 2 * 60 * 1000,
  })
}
