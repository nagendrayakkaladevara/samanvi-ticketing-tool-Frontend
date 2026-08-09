import { useQuery } from '@tanstack/react-query'

import { dashboardService } from '@/features/dashboard/api/dashboard.service'

export function useDashboardMasterCountsQuery(enabled = true) {
  return useQuery({
    queryKey: ['dashboard', 'master-counts'],
    queryFn: () => dashboardService.getMasterCounts(),
    enabled,
    staleTime: 30_000,
    refetchInterval: 60_000,
    refetchOnWindowFocus: true,
  })
}
