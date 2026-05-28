import type { ApplicationUserType } from '@/features/application-users/types/application-user'
import { useAuthStore } from '@/store/auth-store'

export type CurrentUser = {
  id: string
  role: string
  userType?: ApplicationUserType
  name: string
  isAdmin: boolean
}

function resolveIsAdmin(user: NonNullable<ReturnType<typeof useAuthStore.getState>['user']>): boolean {
  if (user.userType === 'admin') {
    return true
  }

  return user.role === 'ADMIN'
}

export function useCurrentUser(): CurrentUser | null {
  const user = useAuthStore((state) => state.user)

  if (!user) {
    return null
  }

  return {
    id: user.id,
    role: user.role,
    userType: user.userType,
    name: user.name,
    isAdmin: resolveIsAdmin(user),
  }
}
