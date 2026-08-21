import { useQuery } from '@tanstack/react-query'

import { spareTanksService } from '@/features/spare-tanks/api/spare-tanks.service'

export function useSpareTanksQuery() {
  return useQuery({
    queryKey: ['spare-tanks'],
    queryFn: () => spareTanksService.list(),
  })
}
