export type ApplicationUserType =
  | 'admin'
  | 'supervisor'
  | 'chairman'
  | 'accountant'
  | 'collection_agent'
  | 'worker'

export type CreatableApplicationUserType = Exclude<ApplicationUserType, 'admin'>

export type UsernameExistsResult = {
  username: string
  exists: boolean
}

export type ApplicationUser = {
  id: string
  displayName: string
  mobileNumber: string
  username: string
  email?: string
  userType: ApplicationUserType
  isActive: boolean
  permissionIds: string[]
}

export type CreateApplicationUserInput = {
  username: string
  fullName: string
  password: string
  mobileNumber: string
  userType: CreatableApplicationUserType
  email?: string
  isActive?: boolean
  permissionIds?: string[]
}

export type UpdateApplicationUserInput = {
  userId: string
  username?: string
  fullName?: string
  password?: string
  mobileNumber?: string
  userType?: CreatableApplicationUserType
  email?: string | null
  isActive?: boolean
  permissionIds?: string[]
}

export const applicationUserTypeLabels: Record<ApplicationUserType, string> = {
  admin: 'Admin',
  supervisor: 'Supervisor',
  chairman: 'Chairman',
  accountant: 'Accountant',
  collection_agent: 'Collection Agent',
  worker: 'Worker',
}

export const creatableUserTypeOptions: Array<{ label: string; value: CreatableApplicationUserType }> = [
  { label: 'Supervisor', value: 'supervisor' },
  { label: 'Chairman', value: 'chairman' },
  { label: 'Accountant', value: 'accountant' },
  { label: 'Collection Agent', value: 'collection_agent' },
  { label: 'Worker', value: 'worker' },
]
