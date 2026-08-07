import { apiClient } from '@/lib/api/client'
import type { UserPermissions } from '@/features/auth/types/auth'
import { normalizePermissionsCatalog } from '@/features/permissions/utils/permission-normalize'

const endpoint = '/permissions/me'

export async function fetchMyPermissions(accessToken?: string): Promise<UserPermissions> {
  const { data } = await apiClient.get<unknown>(
    endpoint,
    accessToken
      ? {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      : undefined,
  )
  return normalizePermissionsCatalog(data)
}
