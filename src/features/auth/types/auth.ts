export type AuthUser = {
  id: string
  name: string
  email?: string
  role: 'SUPERVISOR' | 'WORKER' | 'ADMIN' | string
}

export type AuthSession = {
  accessToken: string
  refreshToken?: string
  user: AuthUser
}

export type LoginInput = {
  username: string
  password: string
}
