import type { Permission } from '@/features/application-users/types/permission'
import type { AuthSession, AuthUser } from '@/features/auth/types/auth'
import { buildPermissionKey } from '@/features/permissions/utils/permission-normalize'

export function makePermission(overrides: Partial<Permission> = {}): Permission {
  return {
    id: 'perm-1',
    module: 'tickets',
    submodule: '',
    action: 'view',
    ...overrides,
  }
}

export function makePermissionSet(entries: Array<[string, string, string]>): Set<string> {
  return new Set(entries.map(([module, submodule, action]) => buildPermissionKey(module, submodule, action)))
}

export function makeAuthUser(overrides: Partial<AuthUser> = {}): AuthUser {
  return {
    id: 'user-1',
    name: 'Test User',
    email: 'test@example.com',
    role: 'WORKER',
    ...overrides,
  }
}

export function makeAuthSession(overrides: Partial<AuthSession> = {}): AuthSession {
  return {
    accessToken: 'test-access-token',
    user: {
      id: 'user-1',
      name: 'Test User',
      email: 'test@example.com',
      role: 'WORKER',
    },
    permissions: {
      items: [
        {
          id: 'perm-1',
          module: 'tickets',
          submodule: '',
          action: 'view',
          key: 'tickets::view',
        },
      ],
      tree: [],
    },
    ...overrides,
  }
}
