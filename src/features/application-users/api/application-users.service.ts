import { apiClient } from '@/lib/api/client'
import type {
  ApplicationUser,
  ApplicationUserType,
  CreateApplicationUserInput,
  UpdateApplicationUserInput,
} from '@/features/application-users/types/application-user'

const endpoint = '/application-users'

const applicationUserTypes = new Set<ApplicationUserType>([
  'admin',
  'supervisor',
  'chairman',
  'accountant',
  'collection_agent',
  'worker',
])

function normalizeString(value: unknown): string | undefined {
  if (typeof value !== 'string') {
    return undefined
  }

  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : undefined
}

function normalizeUserType(value: unknown): ApplicationUserType {
  if (typeof value !== 'string') {
    return 'worker'
  }

  const normalized = value.trim().toLowerCase() as ApplicationUserType
  return applicationUserTypes.has(normalized) ? normalized : 'worker'
}

function normalizePermissionIds(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .map((entry) => {
        if (typeof entry === 'string') {
          return entry
        }
        if (entry && typeof entry === 'object') {
          const record = entry as Record<string, unknown>
          const id = record.id ?? record.permissionId
          return typeof id === 'string' ? id : typeof id === 'number' ? String(id) : null
        }
        return null
      })
      .filter((id): id is string => Boolean(id))
  }

  return []
}

function normalizeUser(raw: unknown): ApplicationUser | null {
  if (!raw || typeof raw !== 'object') {
    return null
  }

  const value = raw as Record<string, unknown>
  const idCandidate = value.id ?? value.userId ?? value._id
  const id =
    typeof idCandidate === 'string' ? idCandidate : typeof idCandidate === 'number' ? String(idCandidate) : undefined

  if (!id) {
    return null
  }

  const mobileNumber =
    normalizeString(value.mobileNumber) ?? normalizeString(value.username) ?? normalizeString(value.mobile) ?? id

  const displayName =
    normalizeString(value.displayName) ??
    normalizeString(value.fullName) ??
    normalizeString(value.name) ??
    mobileNumber

  return {
    id,
    displayName,
    mobileNumber,
    username: normalizeString(value.username) ?? mobileNumber,
    email: normalizeString(value.email),
    userType: normalizeUserType(value.userType ?? value.roleCode ?? value.role),
    isActive: typeof value.isActive === 'boolean' ? value.isActive : true,
    permissionIds:
      normalizePermissionIds(value.permissionIds).length > 0
        ? normalizePermissionIds(value.permissionIds)
        : normalizePermissionIds(value.permissions),
  }
}

function extractArrayPayload(raw: unknown): unknown[] {
  if (Array.isArray(raw)) {
    return raw
  }

  if (!raw || typeof raw !== 'object') {
    return []
  }

  const record = raw as Record<string, unknown>
  if (Array.isArray(record.data)) {
    return record.data
  }

  if (record.data && typeof record.data === 'object') {
    const nested = record.data as Record<string, unknown>
    if (Array.isArray(nested.items)) {
      return nested.items
    }
    if (Array.isArray(nested.users)) {
      return nested.users
    }
  }

  if (Array.isArray(record.items)) {
    return record.items
  }

  if (Array.isArray(record.users)) {
    return record.users
  }

  return []
}

function extractEntityPayload(raw: unknown): unknown {
  if (!raw || typeof raw !== 'object') {
    return raw
  }

  const record = raw as Record<string, unknown>
  if (record.data && typeof record.data === 'object') {
    const nested = record.data as Record<string, unknown>
    return nested.user ?? nested
  }

  return record.user ?? raw
}

export const applicationUsersService = {
  async list(): Promise<ApplicationUser[]> {
    const { data } = await apiClient.get<unknown>(endpoint)
    return extractArrayPayload(data).map(normalizeUser).filter((user): user is ApplicationUser => Boolean(user))
  },

  async getById(userId: string): Promise<ApplicationUser> {
    const { data } = await apiClient.get<unknown>(`${endpoint}/${userId}`)
    const user = normalizeUser(extractEntityPayload(data))
    if (!user) {
      throw new Error('Application user not found.')
    }
    return user
  },

  async create(input: CreateApplicationUserInput): Promise<ApplicationUser> {
    const { data } = await apiClient.post<unknown>(endpoint, input)
    return normalizeUser(extractEntityPayload(data)) ?? (extractEntityPayload(data) as ApplicationUser)
  },

  async update({ userId, ...payload }: UpdateApplicationUserInput): Promise<ApplicationUser> {
    const { data } = await apiClient.patch<unknown>(`${endpoint}/${userId}`, payload)
    return normalizeUser(extractEntityPayload(data)) ?? (extractEntityPayload(data) as ApplicationUser)
  },

  async remove(userId: string): Promise<void> {
    await apiClient.delete(`${endpoint}/${userId}`)
  },

  async assignPermissions(userId: string, permissionIds: string[]): Promise<void> {
    await apiClient.put(`${endpoint}/${userId}/permissions`, { permissionIds })
  },
}
