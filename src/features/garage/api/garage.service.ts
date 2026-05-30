import { apiClient } from '@/lib/api/client'
import type {
  AddJobCommentInput,
  AddJobPartInput,
  CreateRepairJobInput,
  RepairJob,
  RepairJobActivityLog,
  RepairJobPart,
  RepairJobTimeline,
  UpdateRepairJobInput,
} from '@/features/garage/types/job'
import type {
  CreateRepairPartInput,
  RepairPart,
  UpdateRepairPartInput,
} from '@/features/garage/types/repair-part'
import type {
  LeafRepairCategoryOption,
  RepairCategory,
  RepairCategoryListResponse,
  RepairCategoryTreeNode,
} from '@/features/garage/types/repair-category'

const jobsEndpoint = '/garage/jobs'
const categoriesEndpoint = '/garage/masters/repair-categories'
const partsEndpoint = '/garage/masters/repair-parts'

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

function normalizeRepairPart(raw: unknown): RepairPart | null {
  if (!raw || typeof raw !== 'object') return null
  const value = raw as Record<string, unknown>
  const id = normalizeString(value.id)
  const partName = normalizeString(value.partName)
  const priceRaw = value.price
  const price =
    typeof priceRaw === 'string'
      ? priceRaw
      : typeof priceRaw === 'number'
        ? priceRaw.toFixed(2)
        : undefined

  if (!id || !partName || !price) return null

  const descriptionRaw = value.description
  const description =
    descriptionRaw === null
      ? null
      : typeof descriptionRaw === 'string'
        ? descriptionRaw
        : null

  return {
    id,
    partName,
    price,
    description,
    createdAt: normalizeString(value.createdAt) ?? '',
    updatedAt: normalizeString(value.updatedAt) ?? '',
  }
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

function normalizeRepairJobActivityLog(raw: unknown): RepairJobActivityLog | null {
  if (!raw || typeof raw !== 'object') return null
  const value = raw as Record<string, unknown>
  const id = normalizeString(value.id)
  const actionType = normalizeString(value.actionType) as RepairJobActivityLog['actionType'] | undefined
  const createdAt = normalizeString(value.createdAt)
  const actorRaw = value.actor

  if (!id || !actionType || !createdAt) return null

  const fromStatus = normalizeString(value.fromStatus) as RepairJobActivityLog['fromStatus'] | undefined
  const toStatus = normalizeString(value.toStatus) as RepairJobActivityLog['toStatus'] | undefined
  const noteRaw = value.note
  const note =
    noteRaw === null || noteRaw === undefined
      ? null
      : typeof noteRaw === 'string'
        ? noteRaw
        : null

  const actor =
    actorRaw && typeof actorRaw === 'object'
      ? {
          id: normalizeString((actorRaw as Record<string, unknown>).id) ?? '',
          username: normalizeString((actorRaw as Record<string, unknown>).username) ?? '',
          displayName: normalizeString((actorRaw as Record<string, unknown>).displayName) ?? '',
        }
      : { id: '', username: '', displayName: '' }

  return {
    id,
    actionType,
    fromStatus: fromStatus ?? null,
    toStatus: toStatus ?? null,
    note,
    createdAt,
    actor,
  }
}

function normalizeRepairJobPart(raw: unknown): RepairJobPart | null {
  if (!raw || typeof raw !== 'object') return null
  const value = raw as Record<string, unknown>
  const id = normalizeString(value.id)
  const quantity = typeof value.quantity === 'number' ? value.quantity : Number(value.quantity)
  const unitPriceRaw = value.unitPrice
  const unitPrice =
    typeof unitPriceRaw === 'string'
      ? unitPriceRaw
      : typeof unitPriceRaw === 'number'
        ? unitPriceRaw.toFixed(2)
        : undefined

  if (!id || Number.isNaN(quantity) || quantity < 1 || !unitPrice) return null

  const repairPartRaw = value.repairPart
  const addedByRaw = value.addedBy
  if (!repairPartRaw || typeof repairPartRaw !== 'object') return null

  const repairPart = repairPartRaw as Record<string, unknown>
  const repairPartId = normalizeString(repairPart.id)
  const partName = normalizeString(repairPart.partName)
  if (!repairPartId || !partName) return null

  const addedBy =
    addedByRaw && typeof addedByRaw === 'object'
      ? {
          id: normalizeString((addedByRaw as Record<string, unknown>).id) ?? '',
          username: normalizeString((addedByRaw as Record<string, unknown>).username) ?? '',
          displayName: normalizeString((addedByRaw as Record<string, unknown>).displayName) ?? '',
        }
      : { id: '', username: '', displayName: '' }

  return {
    id,
    quantity,
    unitPrice,
    createdAt: normalizeString(value.createdAt) ?? '',
    repairPart: { id: repairPartId, partName },
    addedBy,
  }
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
          aadharName:
            normalizeString((value.reportedDriver as Record<string, unknown>).aadharName) ?? '',
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

  const partsRaw = Array.isArray(value.parts) ? value.parts : []
  const parts = partsRaw
    .map(normalizeRepairJobPart)
    .filter((item): item is RepairJobPart => Boolean(item))

  const previousJobRaw = value.previousJob
  const previousJob =
    previousJobRaw && typeof previousJobRaw === 'object'
      ? {
          id: normalizeString((previousJobRaw as Record<string, unknown>).id) ?? '',
          jobIdNumber: normalizeString((previousJobRaw as Record<string, unknown>).jobIdNumber) ?? '',
        }
      : null

  const activityLogsRaw = Array.isArray(value.activityLogs) ? value.activityLogs : []
  const activityLogs = activityLogsRaw
    .map(normalizeRepairJobActivityLog)
    .filter((item): item is RepairJobActivityLog => Boolean(item))

  return {
    id,
    jobIdNumber,
    odometerReading,
    priority,
    description,
    status,
    isRepeatJob: Boolean(value.isRepeatJob),
    repeatScheduledFor: normalizeString(value.repeatScheduledFor) ?? null,
    repeatProcessedAt: normalizeString(value.repeatProcessedAt) ?? null,
    createdAt: normalizeString(value.createdAt) ?? '',
    updatedAt: normalizeString(value.updatedAt) ?? '',
    bus: { id: busId, busNumber },
    repairCategory: { id: categoryId, name: categoryName, level: categoryLevel },
    reportedDriver: reportedDriver?.id ? reportedDriver : null,
    assignedToOfficeStaff: assignedToOfficeStaff?.id ? assignedToOfficeStaff : null,
    createdBy,
    parts,
    previousJob: previousJob?.id ? previousJob : null,
    activityLogs,
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

  async createRepairCategory(input: { name: string; parentId?: string }): Promise<RepairCategory> {
    const payload: Record<string, string> = { name: input.name.trim() }
    if (input.parentId?.trim()) {
      payload.parentId = input.parentId.trim()
    }

    const { data } = await apiClient.post<unknown>(categoriesEndpoint, payload)
    const category = normalizeRepairCategory(extractDataPayload(data))
    if (!category) {
      throw new Error('Unexpected response when creating repair category.')
    }
    return category
  },

  async updateRepairCategory(categoryId: string, name: string): Promise<RepairCategory> {
    const { data } = await apiClient.patch<unknown>(`${categoriesEndpoint}/${categoryId}`, {
      name: name.trim(),
    })
    const category = normalizeRepairCategory(extractDataPayload(data))
    if (!category) {
      throw new Error('Unexpected response when updating repair category.')
    }
    return category
  },

  async deleteRepairCategory(categoryId: string): Promise<void> {
    await apiClient.delete(`${categoriesEndpoint}/${categoryId}`)
  },

  async listRepairParts(params?: { page?: number; limit?: number }): Promise<RepairPart[]> {
    const page = params?.page ?? 1
    const limit = params?.limit ?? 50
    const { data } = await apiClient.get<unknown>(partsEndpoint, { params: { page, limit } })
    return extractArrayPayload(data)
      .map(normalizeRepairPart)
      .filter((item): item is RepairPart => Boolean(item))
  },

  async createRepairPart(input: CreateRepairPartInput): Promise<RepairPart> {
    const payload: Record<string, unknown> = {
      partName: input.partName.trim(),
      price: input.price,
    }
    if (input.description?.trim()) {
      payload.description = input.description.trim()
    }

    const { data } = await apiClient.post<unknown>(partsEndpoint, payload)
    const part = normalizeRepairPart(extractDataPayload(data))
    if (!part) {
      throw new Error('Unexpected response when creating repair part.')
    }
    return part
  },

  async updateRepairPart({ partId, ...input }: UpdateRepairPartInput): Promise<RepairPart> {
    const payload: Record<string, unknown> = {}
    if (input.partName !== undefined) payload.partName = input.partName.trim()
    if (input.price !== undefined) payload.price = input.price
    if (input.description !== undefined) payload.description = input.description

    const { data } = await apiClient.patch<unknown>(`${partsEndpoint}/${partId}`, payload)
    const part = normalizeRepairPart(extractDataPayload(data))
    if (!part) {
      throw new Error('Unexpected response when updating repair part.')
    }
    return part
  },

  async deleteRepairPart(partId: string): Promise<void> {
    await apiClient.delete(`${partsEndpoint}/${partId}`)
  },

  async listJobs(params?: { page?: number; limit?: number }): Promise<RepairJob[]> {
    const page = params?.page ?? 1
    const limit = params?.limit ?? 50
    const { data } = await apiClient.get<unknown>(jobsEndpoint, { params: { page, limit } })
    return extractArrayPayload(data)
      .map(normalizeRepairJob)
      .filter((item): item is RepairJob => Boolean(item))
  },

  async getJob(jobId: string): Promise<RepairJob> {
    const { data } = await apiClient.get<unknown>(`${jobsEndpoint}/${jobId}`)
    const job = normalizeRepairJob(extractDataPayload(data))
    if (!job) {
      throw new Error('Repair job not found.')
    }
    return job
  },

  async getJobTimeline(jobId: string): Promise<RepairJobTimeline> {
    const { data } = await apiClient.get<unknown>(`${jobsEndpoint}/${jobId}/timeline`)
    const payload = extractDataPayload(data)
    const record = payload && typeof payload === 'object' ? (payload as Record<string, unknown>) : {}
    const items = extractArrayPayload(data)
      .map(normalizeRepairJobActivityLog)
      .filter((item): item is RepairJobActivityLog => Boolean(item))

    return {
      jobId: normalizeString(record.jobId) ?? jobId,
      items,
    }
  },

  async updateJob({ jobId, ...input }: UpdateRepairJobInput): Promise<RepairJob> {
    const payload: Record<string, unknown> = {}
    if (input.odometerReading !== undefined) payload.odometerReading = input.odometerReading
    if (input.repairCategoryId !== undefined) payload.repairCategoryId = input.repairCategoryId
    if (input.priority !== undefined) payload.priority = input.priority
    if (input.description !== undefined) payload.description = input.description.trim()
    if (input.reportedDriverId !== undefined) payload.reportedDriverId = input.reportedDriverId
    if (input.assignedToOfficeStaffId !== undefined) {
      payload.assignedToOfficeStaffId = input.assignedToOfficeStaffId
    }
    if (input.status !== undefined) payload.status = input.status
    if (input.scheduleRepeatFor !== undefined) payload.scheduleRepeatFor = input.scheduleRepeatFor

    const { data } = await apiClient.patch<unknown>(`${jobsEndpoint}/${jobId}`, payload)
    const job = normalizeRepairJob(extractDataPayload(data))
    if (!job) {
      throw new Error('Unexpected response when updating repair job.')
    }
    return job
  },

  async deleteJob(jobId: string): Promise<void> {
    await apiClient.delete(`${jobsEndpoint}/${jobId}`)
  },

  async addJobComment({ jobId, note }: AddJobCommentInput): Promise<RepairJobActivityLog> {
    const { data } = await apiClient.post<unknown>(`${jobsEndpoint}/${jobId}/comments`, {
      note: note.trim(),
    })
    const comment = normalizeRepairJobActivityLog(extractDataPayload(data))
    if (!comment) {
      throw new Error('Unexpected response when adding comment.')
    }
    return comment
  },

  async addJobPart({ jobId, repairPartId, quantity }: AddJobPartInput): Promise<RepairJob> {
    const payload: Record<string, unknown> = { repairPartId }
    if (quantity !== undefined) {
      payload.quantity = quantity
    }

    const { data } = await apiClient.post<unknown>(`${jobsEndpoint}/${jobId}/parts`, payload)
    const job = normalizeRepairJob(extractDataPayload(data))
    if (!job) {
      throw new Error('Unexpected response when adding spare part to repair job.')
    }
    return job
  },

  async removeJobPart(jobId: string, lineId: string): Promise<RepairJob> {
    const { data } = await apiClient.delete<unknown>(`${jobsEndpoint}/${jobId}/parts/${lineId}`)
    const job = normalizeRepairJob(extractDataPayload(data))
    if (!job) {
      throw new Error('Unexpected response when removing spare part from repair job.')
    }
    return job
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
