import { apiClient } from '@/lib/api/client'
import type {
  ApplicationUser,
  ApplicationUserType,
  CreateApplicationUserInput,
  UpdateApplicationUserInput,
  UsernameExistsResult,
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

function normalizeUserTypeValue(value: unknown): ApplicationUserType | null {
  if (typeof value !== 'string') {
    return null
  }

  const normalized = value.trim().toLowerCase().replace(/[\s-]+/g, '_') as ApplicationUserType
  return applicationUserTypes.has(normalized) ? normalized : null
}

function normalizeUserType(value: unknown): ApplicationUserType {
  const direct = normalizeUserTypeValue(value)
  if (direct) {
    return direct
  }

  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>
    const nested =
      normalizeUserTypeValue(record.code) ??
      normalizeUserTypeValue(record.label) ??
      normalizeUserTypeValue(record.name)
    if (nested) {
      return nested
    }
  }

  return 'worker'
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

  const mobileNumber = normalizeString(value.mobileNumber) ?? normalizeString(value.mobile) ?? ''
  const username = normalizeString(value.username) ?? ''

  const displayName =
    normalizeString(value.displayName) ??
    normalizeString(value.fullName) ??
    normalizeString(value.name) ??
    (username || mobileNumber || id)

  return {
    id,
    displayName,
    mobileNumber,
    username,
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

function normalizeUsernameExists(raw: unknown): UsernameExistsResult | null {
  const entity = extractEntityPayload(raw)
  if (!entity || typeof entity !== 'object') {
    return null
  }

  const record = entity as Record<string, unknown>
  const username = normalizeString(record.username)
  if (!username || typeof record.exists !== 'boolean') {
    return null
  }

  return { username, exists: record.exists }
}

export const applicationUsersService = {
  async list(): Promise<ApplicationUser[]> {
    const { data } = await apiClient.get<unknown>(endpoint)
    return extractArrayPayload(data).map(normalizeUser).filter((user): user is ApplicationUser => Boolean(user))
  },

  async checkUsernameExists(username: string): Promise<UsernameExistsResult> {
    const { data } = await apiClient.get<unknown>(`${endpoint}/username-exists`, {
      params: { username: username.trim() },
    })

    const result = normalizeUsernameExists(data)
    if (!result) {
      throw new Error('Unable to verify username availability.')
    }

    return result
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
