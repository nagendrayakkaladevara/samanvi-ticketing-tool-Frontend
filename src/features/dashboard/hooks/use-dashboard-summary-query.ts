import { useQuery } from '@tanstack/react-query'

import { dashboardService } from '@/features/dashboard/api/dashboard.service'

export function useDashboardSummaryQuery() {
  return useQuery({
    queryKey: ['dashboard', 'admin-summary'],
    queryFn: dashboardService.getAdminSummary,
    staleTime: 30_000,
    refetchInterval: 60_000,
    refetchOnWindowFocus: true,
  })
}
