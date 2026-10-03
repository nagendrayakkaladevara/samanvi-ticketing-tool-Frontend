export type ApplicationUserType =
  | 'admin'
  | 'supervisor'
  | 'chairman'
  | 'accountant'
  | 'collection_agent'
  | 'worker'

export type EmployeeType = 'driver' | 'helper' | 'office_staff'

export type CreatableApplicationUserType = Exclude<ApplicationUserType, 'admin'>

export type LinkedEmployee = {
  id: string
  name: string
  employeeId: string
  employeeType: EmployeeType
}

export type LinkableEmployeeItem = LinkedEmployee

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
  linkedEmployee?: LinkedEmployee | null
}

export type CreateApplicationUserInput = {
  username: string
  fullName: string
  password: string
  mobileNumber: string
  userType: CreatableApplicationUserType
  employeeId: string
  employeeType: EmployeeType
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
  employeeId?: string
  employeeType?: EmployeeType
  email?: string | null
  isActive?: boolean
  permissionIds?: string[]
}

export const employeeTypeLabels: Record<EmployeeType, string> = {
  driver: 'Driver',
  helper: 'Helper',
  office_staff: 'Office Staff',
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

const creatableUserTypeSet = new Set<CreatableApplicationUserType>(
  creatableUserTypeOptions.map((option) => option.value),
)

export function toCreatableUserType(userType: ApplicationUserType): CreatableApplicationUserType {
  if (userType === 'admin') {
    return 'supervisor'
  }

  return creatableUserTypeSet.has(userType) ? userType : 'supervisor'
}
