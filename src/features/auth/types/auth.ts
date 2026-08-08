import type { PermissionTreeGroup } from '@/features/application-users/types/permission'
import type { ApplicationUserType } from '@/features/application-users/types/application-user'
import type { Permission } from '@/features/application-users/types/permission'

export type UserPermissions = {
  items: Permission[]
  tree: PermissionTreeGroup[]
}

export type AuthUser = {
  id: string
  name: string
  email?: string
  role: 'SUPERVISOR' | 'WORKER' | 'ADMIN' | string
  userType?: ApplicationUserType
}

export type AuthSession = {
  accessToken: string
  refreshToken?: string
  user: AuthUser
  permissions?: UserPermissions
}

export type LoginInput = {
  username: string
  password: string
}

/** Matches Application Access create/edit and the application-users API (min 6). */
export const AUTH_PASSWORD_MIN_LENGTH = 6
export const AUTH_PASSWORD_MAX_LENGTH = 128
