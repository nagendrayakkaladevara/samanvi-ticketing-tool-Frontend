export type JobPriority = 'low' | 'medium' | 'high' | 'urgent'

export type JobStatus =
  | 'created'
  | 'assigned'
  | 'in_progress'
  | 'on_hold'
  | 'completed'
  | 'cancelled'

export type RepairJob = {
  id: string
  jobIdNumber: string
  odometerReading: number
  priority: JobPriority
  description: string
  status: JobStatus
  isRepeatJob: boolean
  createdAt: string
  updatedAt: string
  bus: {
    id: string
    busNumber: string
  }
  repairCategory: {
    id: string
    name: string
    level: number
  }
  reportedDriver: {
    id: string
    driverIdNumber: string
    dlName: string
  } | null
  assignedToOfficeStaff: {
    id: string
    staffIdNumber: string
    nickName: string
    aadharName: string
    designation: string
  } | null
  createdBy: {
    id: string
    username: string
    displayName: string
  }
}

export type CreateRepairJobInput = {
  busNumber: string
  odometerReading: number
  repairCategoryId: string
  priority: JobPriority
  description: string
  reportedDriverId?: string
  assignedToOfficeStaffId?: string
}
