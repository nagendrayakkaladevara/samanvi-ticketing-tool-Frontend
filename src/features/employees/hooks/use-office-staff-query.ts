import { useQuery } from '@tanstack/react-query'

import { officeStaffService } from '@/features/employees/api/office-staff.service'

export function useOfficeStaffQuery() {
  return useQuery({
    queryKey: ['office-staff'],
    queryFn: () => officeStaffService.list({ page: 1, limit: 100 }),
  })
}

export function useOfficeStaffDetailQuery(staffId: string | null, enabled: boolean) {
  return useQuery({
    queryKey: ['office-staff', staffId],
    queryFn: () => officeStaffService.getById(staffId!),
    enabled: enabled && Boolean(staffId),
  })
}
