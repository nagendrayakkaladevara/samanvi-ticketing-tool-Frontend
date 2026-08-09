import type { JobStatus, RepairJob, RepairJobActivityLog, RepairJobPart } from '@/features/garage/types/job'
import type { RepairCategoryTreeNode } from '@/features/garage/types/repair-category'
import type { RepairPart } from '@/features/garage/types/repair-part'

export function makeRepairJobPart(overrides?: Partial<RepairJobPart>): RepairJobPart {
  return {
    id: 'part-line-1',
    quantity: 2,
    unitPrice: '10.50',
    createdAt: '2024-06-01T10:00:00Z',
    repairPart: { id: 'rp-1', partName: 'Brake Pad' },
    addedBy: { id: 'u1', username: 'tech', displayName: 'Tech User' },
    ...overrides,
  }
}

export function makeRepairJob(overrides?: Partial<RepairJob>): RepairJob {
  return {
    id: 'job-1',
    jobIdNumber: 'RJ-001',
    odometerReading: 12000,
    priority: 'medium',
    description: 'Fix brakes',
    status: 'in_progress',
    isRepeatJob: false,
    repeatScheduledFor: null,
    repeatProcessedAt: null,
    previousJob: null,
    closedAt: null,
    createdAt: '2024-06-01T08:00:00Z',
    updatedAt: '2024-06-02T08:00:00Z',
    bus: { id: 'bus-1', busNumber: 'BUS-01' },
    repairCategory: { id: 'cat-1', name: 'Brakes', level: 1 },
    reportedDriver: null,
    assignedToOfficeStaff: {
      id: 'staff-1',
      staffIdNumber: 'S001',
      nickName: 'Alex',
      aadharName: 'Alex Staff',
      designation: 'Mechanic',
    },
    createdBy: { id: 'u1', username: 'admin', displayName: 'Admin User' },
    parts: [],
    activityLogs: [],
    ...overrides,
  }
}

export function makeActivityLog(overrides?: Partial<RepairJobActivityLog>): RepairJobActivityLog {
  return {
    id: 'log-1',
    actionType: 'commented',
    fromStatus: null,
    toStatus: null,
    note: 'Test comment',
    metadata: null,
    createdAt: '2024-06-01T09:00:00Z',
    actor: { id: 'u1', username: 'admin', displayName: 'Admin User' },
    ...overrides,
  }
}

export function makeRepairCategoryNode(
  overrides?: Partial<RepairCategoryTreeNode>,
): RepairCategoryTreeNode {
  return {
    id: 'cat-1',
    name: 'Root',
    level: 1,
    parentId: null,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    children: [],
    ...overrides,
  }
}

export function makeRepairPart(overrides?: Partial<RepairPart>): RepairPart {
  return {
    id: 'rp-1',
    partName: 'Oil Filter',
    price: '25.00',
    description: null,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    ...overrides,
  }
}

export const ALL_JOB_STATUSES: JobStatus[] = [
  'created',
  'assigned',
  'in_progress',
  'on_hold',
  'completed',
  'closed',
  'cancelled',
]
