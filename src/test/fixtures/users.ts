import type { AppUser } from '@/features/users/types/user'

export function makeAppUser(overrides?: Partial<AppUser>): AppUser {
  return {
    id: 'user-1',
    username: 'jdoe',
    displayName: 'Jane Doe',
    email: 'jane@example.com',
    role: 'WORKER',
    isActive: true,
    ...overrides,
  }
}
