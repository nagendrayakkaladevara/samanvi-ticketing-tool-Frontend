import type { AuthSession } from '@/features/auth/types/auth'

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
