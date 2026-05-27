import { useQuery } from '@tanstack/react-query'

import { collectLeafRepairCategories, garageService } from '@/features/garage/api/garage.service'

export function useRepairCategoriesQuery() {
  return useQuery({
    queryKey: ['garage', 'repair-categories'],
    queryFn: garageService.listRepairCategories,
    staleTime: 5 * 60 * 1000,
    select: (data) => ({
      ...data,
      leafOptions: collectLeafRepairCategories(data.tree),
    }),
  })
}
