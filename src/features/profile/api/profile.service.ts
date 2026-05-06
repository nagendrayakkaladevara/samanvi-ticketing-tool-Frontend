import { apiClient } from '@/lib/api/client'
import type { ProfileRoleCode, UserProfile } from '@/features/profile/types/profile'

function normalizeRoleCode(value: unknown): ProfileRoleCode {
  if (typeof value !== 'string') {
    return 'WORKER'
  }

  const normalized = value.trim().toUpperCase()
  if (normalized === 'ADMIN' || normalized === 'SUPERVISOR' || normalized === 'WORKER') {
    return normalized
  }

  return 'WORKER'
}

function normalizeString(value: unknown, fallback = ''): string {
  if (typeof value !== 'string') {
    return fallback
  }

  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : fallback
}

function toRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : {}
}

function normalizeProfile(raw: unknown): UserProfile {
  const record = toRecord(raw)
  const roleRecord = toRecord(record.role)
  const roleCode = normalizeRoleCode(roleRecord.code ?? roleRecord.label ?? record.roleCode ?? record.role)

  return {
    id: normalizeString(record.id ?? record.userId, ''),
    username: normalizeString(record.username, '-'),
    displayName: normalizeString(record.displayName ?? record.name, 'User'),
    email: typeof record.email === 'string' ? record.email : null,
    isActive: typeof record.isActive === 'boolean' ? record.isActive : true,
    role: {
      code: roleCode,
      label: normalizeString(roleRecord.label, roleCode),
    },
    createdAt: normalizeString(record.createdAt, ''),
    updatedAt: normalizeString(record.updatedAt, ''),
  }
}

export const profileService = {
  async getCurrentProfile(): Promise<UserProfile> {
    const { data } = await apiClient.get<unknown>('/profile')
    const payload = toRecord(data)
    const source = payload.data ? payload.data : payload
    return normalizeProfile(source)
  },
}
