export type ProfileRoleCode = 'ADMIN' | 'SUPERVISOR' | 'WORKER'

export type UserProfile = {
  id: string
  username: string
  displayName: string
  email: string | null
  isActive: boolean
  role: {
    code: ProfileRoleCode
    label: string
  }
  createdAt: string
  updatedAt: string
}
