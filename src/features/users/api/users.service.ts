import { apiClient } from '@/lib/api/client'
import type { AppUser, AppUserRole, CreateUserInput, UpdateUserInput } from '@/features/users/types/user'

const endpoint = '/users'

function normalizeRole(rawRole: unknown): AppUserRole {
  const normalizeRoleValue = (value: unknown): AppUserRole | null => {
    if (typeof value !== 'string') {
      return null
    }

    const normalized = value.trim().toUpperCase()
    if (normalized === 'ADMIN' || normalized === 'SUPERVISOR' || normalized === 'WORKER') {
      return normalized
    }

    return null
  }

  const direct = normalizeRoleValue(rawRole)
  if (direct) {
    return direct
  }

  if (rawRole && typeof rawRole === 'object') {
    const record = rawRole as Record<string, unknown>
    const nested = normalizeRoleValue(record.code) ?? normalizeRoleValue(record.label) ?? normalizeRoleValue(record.name)
    if (nested) {
      return nested
    }
  }

  return 'WORKER'
}

function normalizeString(value: unknown): string | undefined {
  if (typeof value !== 'string') {
    return undefined
  }

  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : undefined
}

function normalizeUser(raw: unknown): AppUser | null {
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

  const username = normalizeString(value.username) ?? id
  const displayName =
    normalizeString(value.displayName) ??
    normalizeString(value.name) ??
    normalizeString(value.fullName) ??
    normalizeString(value.username) ??
    id

  return {
    id,
    username,
    displayName,
    email: normalizeString(value.email),
    role: normalizeRole(value.role ?? value.roleCode),
    isActive: typeof value.isActive === 'boolean' ? value.isActive : true,
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
    if (Array.isArray(nested.users)) {
      return nested.users
    }
    if (Array.isArray(nested.items)) {
      return nested.items
    }
  }

  if (Array.isArray(record.users)) {
    return record.users
  }

  if (Array.isArray(record.items)) {
    return record.items
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

export const usersService = {
  async list(): Promise<AppUser[]> {
    const { data } = await apiClient.get<unknown>(endpoint)
    return extractArrayPayload(data).map(normalizeUser).filter((user): user is AppUser => Boolean(user))
  },

  async create(input: CreateUserInput): Promise<AppUser> {
    const { data } = await apiClient.post<unknown>(endpoint, input)
    return normalizeUser(extractEntityPayload(data)) ?? (extractEntityPayload(data) as AppUser)
  },

  async update({ userId, ...payload }: UpdateUserInput): Promise<AppUser> {
    const { data } = await apiClient.patch<unknown>(`${endpoint}/${userId}`, payload)
    return normalizeUser(extractEntityPayload(data)) ?? (extractEntityPayload(data) as AppUser)
  },

  async remove(userId: string): Promise<void> {
    await apiClient.delete(`${endpoint}/${userId}`)
  },
}
