import { useAuthStore } from '@/store/auth-store'

export type CurrentUser = {
  id: string
  role: 'SUPERVISOR' | 'WORKER' | 'ADMIN' | 'VIEWER'
  name: string
}

export function useCurrentUser(): CurrentUser | null {
  const user = useAuthStore((state) => state.user)

  if (!user) {
    return null
  }

  return {
    id: user.id,
    role:
      user.role === 'ADMIN' || user.role === 'SUPERVISOR' || user.role === 'WORKER'
        ? user.role
        : 'VIEWER',
    name: user.name,
  }
}
