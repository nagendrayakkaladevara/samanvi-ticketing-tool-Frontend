import { apiClient } from '@/lib/api/client'
import type { PermissionsCatalog } from '@/features/application-users/types/permission'
import { normalizePermissionsCatalog } from '@/features/permissions/utils/permission-normalize'

const endpoint = '/permissions'

export const permissionsService = {
  async list(): Promise<PermissionsCatalog> {
    const { data } = await apiClient.get<unknown>(endpoint)
    return normalizePermissionsCatalog(data)
  },
}
