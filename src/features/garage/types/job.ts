export type JobPriority = 'low' | 'medium' | 'high' | 'urgent'

export type JobStatus =
  | 'created'
  | 'assigned'
  | 'in_progress'
  | 'on_hold'
  | 'completed'
  | 'closed'
  | 'cancelled'

export type RepairJobActivityType =
  | 'created'
  | 'status_changed'
  | 'commented'
  | 'closed'
  | 'cancelled'
  | 'part_added'
  | 'part_removed'
  | 'repeat_scheduled'
  | 'repeat_created'

export type PartActivityMetadata = {
  repairJobPartId: string
  repairPartId: string
  partName: string
  quantity: number
  unitPrice: string
}

export type RepeatScheduledMetadata = {
  scheduledFor: string
}

export type RepeatCreatedMetadata = {
  relatedJobId: string
  relatedJobIdNumber: string
}

export type RepeatSourceMetadata = {
  previousJobId: string
  previousJobIdNumber: string
  isRepeatJob: true
}

export type RepairJobActivityMetadata =
  | PartActivityMetadata
  | RepeatScheduledMetadata
  | RepeatCreatedMetadata
  | RepeatSourceMetadata

export type RepairJobActivityLog = {
  id: string
  actionType: RepairJobActivityType
  fromStatus: JobStatus | null
  toStatus: JobStatus | null
  note: string | null
  metadata: RepairJobActivityMetadata | null
  createdAt: string
  actor: {
    id: string
    username: string
    displayName: string
  }
}

export type RepairJobPart = {
  id: string
  quantity: number
  unitPrice: string
  createdAt: string
  repairPart: {
    id: string
    partName: string
  }
  addedBy: {
    id: string
    username: string
    displayName: string
  }
}

export type RepairJob = {
  id: string
  jobIdNumber: string
  odometerReading: number
  priority: JobPriority
  description: string
  status: JobStatus
  isRepeatJob: boolean
  repeatScheduledFor: string | null
  repeatProcessedAt: string | null
  previousJob: {
    id: string
    jobIdNumber: string
  } | null
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
    aadharName: string
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
  parts: RepairJobPart[]
  activityLogs: RepairJobActivityLog[]
}

export type RepairJobTimeline = {
  jobId: string
  items: RepairJobActivityLog[]
}

export type AddJobCommentInput = {
  jobId: string
  note: string
}

export type AddJobPartInput = {
  jobId: string
  repairPartId: string
  quantity?: number
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

export type UpdateRepairJobInput = {
  jobId: string
  odometerReading?: number
  repairCategoryId?: string
  priority?: JobPriority
  description?: string
  reportedDriverId?: string | null
  assignedToOfficeStaffId?: string | null
  status?: JobStatus
  scheduleRepeatFor?: string
}
