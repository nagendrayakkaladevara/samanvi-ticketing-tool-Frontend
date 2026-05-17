import { keepPreviousData, useQuery } from '@tanstack/react-query'

import { dashboardService } from '@/features/dashboard/api/dashboard.service'

export function useDashboardSummaryQuery(days = 14) {
  return useQuery({
    queryKey: ['dashboard', 'admin-summary', days],
    queryFn: () => dashboardService.getAdminSummary(days),
    staleTime: 30_000,
    refetchInterval: 60_000,
    refetchOnWindowFocus: true,
    placeholderData: keepPreviousData,
  })
}
