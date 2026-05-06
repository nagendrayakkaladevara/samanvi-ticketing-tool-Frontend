import { useQuery } from '@tanstack/react-query'

import { profileService } from '@/features/profile/api/profile.service'

export function useProfileQuery() {
  return useQuery({
    queryKey: ['profile'],
    queryFn: profileService.getCurrentProfile,
  })
}
