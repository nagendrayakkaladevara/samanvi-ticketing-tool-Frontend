export type AppUserRole = 'ADMIN' | 'SUPERVISOR' | 'WORKER'

export type AppUser = {
  id: string
  username: string
  displayName: string
  email?: string
  role: AppUserRole
  isActive: boolean
}

export type CreateUserInput = {
  username: string
  password: string
  displayName: string
  email?: string
  roleCode: Lowercase<AppUserRole>
  isActive?: boolean
}

export type UpdateUserInput = {
  userId: string
  username?: string
  password?: string
  displayName?: string
  email?: string | null
  roleCode?: Lowercase<AppUserRole>
  isActive?: boolean
}
