import { useQuery } from '@tanstack/react-query'

import { helpersService } from '@/features/employees/api/helpers.service'

export function useHelpersQuery() {
  return useQuery({
    queryKey: ['helpers'],
    queryFn: () => helpersService.list(),
  })
}

export function useHelperDetailQuery(helperId: string | null, enabled: boolean) {
  return useQuery({
    queryKey: ['helpers', helperId],
    queryFn: () => helpersService.getById(helperId!),
    enabled: enabled && Boolean(helperId),
  })
}
