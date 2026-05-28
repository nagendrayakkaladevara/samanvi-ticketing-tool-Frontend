import { create } from 'zustand'

import type { AuthSession, AuthUser, UserPermissions } from '@/features/auth/types/auth'
import { buildPermissionKeySet } from '@/features/permissions/utils/permission-normalize'

const STORAGE_KEY = 'samanvi.auth.session'

function readStoredSession(): AuthSession | null {
  if (typeof window === 'undefined') {
    return null
  }

  const raw = window.localStorage.getItem(STORAGE_KEY) ?? window.sessionStorage.getItem(STORAGE_KEY)
  if (!raw) {
    return null
  }

  try {
    return JSON.parse(raw) as AuthSession
  } catch {
    window.localStorage.removeItem(STORAGE_KEY)
    window.sessionStorage.removeItem(STORAGE_KEY)
    return null
  }
}

function writeStoredSession(session: AuthSession | null, persist: boolean) {
  if (typeof window === 'undefined') {
    return
  }

  if (!session) {
    window.localStorage.removeItem(STORAGE_KEY)
    window.sessionStorage.removeItem(STORAGE_KEY)
    return
  }

  if (persist) {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session))
    window.sessionStorage.removeItem(STORAGE_KEY)
    return
  }

  window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(session))
  window.localStorage.removeItem(STORAGE_KEY)
}

function resolvePermissionSet(permissions: UserPermissions | null | undefined): Set<string> {
  if (!permissions?.items?.length) {
    return new Set()
  }
  return buildPermissionKeySet(permissions.items)
}

type AuthStore = {
  session: AuthSession | null
  isAuthenticated: boolean
  user: AuthUser | null
  accessToken: string | null
  permissions: UserPermissions | null
  permissionSet: Set<string>
  setSession: (session: AuthSession, persist?: boolean) => void
  updatePermissions: (permissions: UserPermissions) => void
  logout: () => void
}

const initialSession = readStoredSession()
const initialPermissions = initialSession?.permissions ?? null

export const useAuthStore = create<AuthStore>((set, get) => ({
  session: initialSession,
  isAuthenticated: Boolean(initialSession?.accessToken),
  user: initialSession?.user ?? null,
  accessToken: initialSession?.accessToken ?? null,
  permissions: initialPermissions,
  permissionSet: resolvePermissionSet(initialPermissions),
  setSession: (session, persist = true) => {
    writeStoredSession(session, persist)
    set({
      session,
      isAuthenticated: true,
      user: session.user,
      accessToken: session.accessToken,
      permissions: session.permissions ?? null,
      permissionSet: resolvePermissionSet(session.permissions),
    })
  },
  updatePermissions: (permissions) => {
    const { session } = get()
    if (!session) {
      return
    }

    const nextSession: AuthSession = { ...session, permissions }
    writeStoredSession(nextSession, true)
    set({
      session: nextSession,
      permissions,
      permissionSet: resolvePermissionSet(permissions),
    })
  },
  logout: () => {
    writeStoredSession(null, true)
    set({
      session: null,
      isAuthenticated: false,
      user: null,
      accessToken: null,
      permissions: null,
      permissionSet: new Set(),
    })
  },
}))

export function getAccessToken(): string | null {
  return useAuthStore.getState().accessToken ?? readStoredSession()?.accessToken ?? null
}
