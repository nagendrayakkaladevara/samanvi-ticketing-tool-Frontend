import { useQuery } from '@tanstack/react-query'

import { garageService } from '@/features/garage/api/garage.service'

export function useRepairPartsQuery() {
  return useQuery({
    queryKey: ['garage', 'repair-parts'],
    queryFn: () => garageService.listRepairParts(),
    staleTime: 2 * 60 * 1000,
  })
}
