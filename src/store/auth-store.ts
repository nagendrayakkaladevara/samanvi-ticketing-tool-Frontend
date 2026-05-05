import { create } from 'zustand'

import type { AuthSession, AuthUser } from '@/features/auth/types/auth'

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

type AuthStore = {
  session: AuthSession | null
  isAuthenticated: boolean
  user: AuthUser | null
  accessToken: string | null
  setSession: (session: AuthSession, persist?: boolean) => void
  logout: () => void
}

const initialSession = readStoredSession()

export const useAuthStore = create<AuthStore>((set) => ({
  session: initialSession,
  isAuthenticated: Boolean(initialSession?.accessToken),
  user: initialSession?.user ?? null,
  accessToken: initialSession?.accessToken ?? null,
  setSession: (session, persist = true) => {
    writeStoredSession(session, persist)
    set({
      session,
      isAuthenticated: true,
      user: session.user,
      accessToken: session.accessToken,
    })
  },
  logout: () => {
    writeStoredSession(null, true)
    set({
      session: null,
      isAuthenticated: false,
      user: null,
      accessToken: null,
    })
  },
}))

export function getAccessToken(): string | null {
  return useAuthStore.getState().accessToken ?? readStoredSession()?.accessToken ?? null
}
