import { apiClient } from '@/lib/api/client'
import type { CreateRepairJobInput, RepairJob } from '@/features/garage/types/job'
import type {
  LeafRepairCategoryOption,
  RepairCategory,
  RepairCategoryListResponse,
  RepairCategoryTreeNode,
} from '@/features/garage/types/repair-category'

const jobsEndpoint = '/garage/jobs'
const categoriesEndpoint = '/garage/masters/repair-categories'

function normalizeString(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : undefined
}

function extractDataPayload(raw: unknown): unknown {
  if (!raw || typeof raw !== 'object') return raw
  const record = raw as Record<string, unknown>
  return record.data ?? raw
}

function extractArrayPayload(raw: unknown): unknown[] {
  const payload = extractDataPayload(raw)
  if (Array.isArray(payload)) return payload
  if (!payload || typeof payload !== 'object') return []

  const record = payload as Record<string, unknown>
  if (Array.isArray(record.items)) return record.items
  return []
}

function normalizeRepairCategory(raw: unknown): RepairCategory | null {
  if (!raw || typeof raw !== 'object') return null
  const value = raw as Record<string, unknown>
  const id = normalizeString(value.id)
  const name = normalizeString(value.name)
  const level = typeof value.level === 'number' ? value.level : Number(value.level)
  if (!id || !name || Number.isNaN(level)) return null

  return {
    id,
    name,
    level,
    parentId: normalizeString(value.parentId) ?? null,
    createdAt: normalizeString(value.createdAt) ?? '',
    updatedAt: normalizeString(value.updatedAt) ?? '',
  }
}

function normalizeRepairCategoryTreeNode(raw: unknown): RepairCategoryTreeNode | null {
  const category = normalizeRepairCategory(raw)
  if (!category) return null

  const value = raw as Record<string, unknown>
  const childrenRaw = Array.isArray(value.children) ? value.children : []
  const children = childrenRaw
    .map(normalizeRepairCategoryTreeNode)
    .filter((node): node is RepairCategoryTreeNode => Boolean(node))

  return { ...category, children }
}

export function collectLeafRepairCategories(
  nodes: RepairCategoryTreeNode[],
  path: string[] = [],
): LeafRepairCategoryOption[] {
  const result: LeafRepairCategoryOption[] = []

  for (const node of nodes) {
    const currentPath = [...path, node.name]
    if (node.children.length === 0) {
      result.push({
        id: node.id,
        label: currentPath.join(' › '),
        level: node.level,
      })
    } else {
      result.push(...collectLeafRepairCategories(node.children, currentPath))
    }
  }

  return result
}

function normalizeRepairJob(raw: unknown): RepairJob | null {
  if (!raw || typeof raw !== 'object') return null
  const value = raw as Record<string, unknown>
  const id = normalizeString(value.id)
  const jobIdNumber = normalizeString(value.jobIdNumber)
  const description = normalizeString(value.description)
  const priority = normalizeString(value.priority) as RepairJob['priority'] | undefined
  const status = normalizeString(value.status) as RepairJob['status'] | undefined
  const odometerReading =
    typeof value.odometerReading === 'number' ? value.odometerReading : Number(value.odometerReading)

  if (!id || !jobIdNumber || !description || !priority || !status || Number.isNaN(odometerReading)) {
    return null
  }

  const busRaw = value.bus
  const categoryRaw = value.repairCategory
  const createdByRaw = value.createdBy

  if (!busRaw || typeof busRaw !== 'object' || !categoryRaw || typeof categoryRaw !== 'object') {
    return null
  }

  const bus = busRaw as Record<string, unknown>
  const category = categoryRaw as Record<string, unknown>
  const busId = normalizeString(bus.id)
  const busNumber = normalizeString(bus.busNumber)
  const categoryId = normalizeString(category.id)
  const categoryName = normalizeString(category.name)
  const categoryLevel = typeof category.level === 'number' ? category.level : Number(category.level)

  if (!busId || !busNumber || !categoryId || !categoryName || Number.isNaN(categoryLevel)) {
    return null
  }

  const reportedDriver =
    value.reportedDriver && typeof value.reportedDriver === 'object'
      ? {
          id: normalizeString((value.reportedDriver as Record<string, unknown>).id) ?? '',
          driverIdNumber:
            normalizeString((value.reportedDriver as Record<string, unknown>).driverIdNumber) ?? '',
          dlName: normalizeString((value.reportedDriver as Record<string, unknown>).dlName) ?? '',
        }
      : null

  const assignedToOfficeStaff =
    value.assignedToOfficeStaff && typeof value.assignedToOfficeStaff === 'object'
      ? {
          id: normalizeString((value.assignedToOfficeStaff as Record<string, unknown>).id) ?? '',
          staffIdNumber:
            normalizeString((value.assignedToOfficeStaff as Record<string, unknown>).staffIdNumber) ?? '',
          nickName: normalizeString((value.assignedToOfficeStaff as Record<string, unknown>).nickName) ?? '',
          aadharName:
            normalizeString((value.assignedToOfficeStaff as Record<string, unknown>).aadharName) ?? '',
          designation:
            normalizeString((value.assignedToOfficeStaff as Record<string, unknown>).designation) ?? '',
        }
      : null

  const createdBy =
    createdByRaw && typeof createdByRaw === 'object'
      ? {
          id: normalizeString((createdByRaw as Record<string, unknown>).id) ?? '',
          username: normalizeString((createdByRaw as Record<string, unknown>).username) ?? '',
          displayName: normalizeString((createdByRaw as Record<string, unknown>).displayName) ?? '',
        }
      : { id: '', username: '', displayName: '' }

  return {
    id,
    jobIdNumber,
    odometerReading,
    priority,
    description,
    status,
    isRepeatJob: Boolean(value.isRepeatJob),
    createdAt: normalizeString(value.createdAt) ?? '',
    updatedAt: normalizeString(value.updatedAt) ?? '',
    bus: { id: busId, busNumber },
    repairCategory: { id: categoryId, name: categoryName, level: categoryLevel },
    reportedDriver: reportedDriver?.id ? reportedDriver : null,
    assignedToOfficeStaff: assignedToOfficeStaff?.id ? assignedToOfficeStaff : null,
    createdBy,
  }
}

export const garageService = {
  async listRepairCategories(): Promise<RepairCategoryListResponse> {
    const { data } = await apiClient.get<unknown>(categoriesEndpoint)
    const payload = extractDataPayload(data)
    const record = payload && typeof payload === 'object' ? (payload as Record<string, unknown>) : {}

    const items = extractArrayPayload(data)
      .map(normalizeRepairCategory)
      .filter((item): item is RepairCategory => Boolean(item))

    const treeRaw = Array.isArray(record.tree) ? record.tree : []
    const tree = treeRaw
      .map(normalizeRepairCategoryTreeNode)
      .filter((node): node is RepairCategoryTreeNode => Boolean(node))

    return { items, tree }
  },

  async createJob(input: CreateRepairJobInput): Promise<RepairJob> {
    const payload: Record<string, unknown> = {
      busNumber: input.busNumber.trim(),
      odometerReading: input.odometerReading,
      repairCategoryId: input.repairCategoryId,
      priority: input.priority,
      description: input.description.trim(),
    }

    if (input.reportedDriverId?.trim()) {
      payload.reportedDriverId = input.reportedDriverId.trim()
    }
    if (input.assignedToOfficeStaffId?.trim()) {
      payload.assignedToOfficeStaffId = input.assignedToOfficeStaffId.trim()
    }

    const { data } = await apiClient.post<unknown>(jobsEndpoint, payload)
    const job = normalizeRepairJob(extractDataPayload(data))
    if (!job) {
      throw new Error('Unexpected response when creating repair job.')
    }
    return job
  },
}
