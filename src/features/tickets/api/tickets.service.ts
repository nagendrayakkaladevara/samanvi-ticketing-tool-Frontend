import { apiClient } from '@/lib/api/client'
import type { AssignableUser, Ticket, TicketCategory, TicketPriority, TicketTimelineEntry } from '@/features/tickets/types/ticket'

const endpoint = '/tickets'

type UpdateTicketStatusInput = {
  ticketId: string
  status: 'ASSIGNED' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED'
  note?: string
}

type AssignTicketInput = {
  ticketId: string
  assignedToId: string
  note?: string
}

type AddTicketCommentInput = {
  ticketId: string
  note: string
}

type EnhanceTicketDescriptionResponse = {
  success?: boolean
  data?: {
    enhancedText?: string
  }
}

export type CreateTicketInput = {
  title: string
  description: string
  severity: 'critical' | 'high' | 'medium' | 'low'
  priority: 'p1' | 'p2' | 'p3'
  categoryId: string
  busNumber: string
  slaDueAt: string
}

type TicketStatusApi = 'assigned' | 'in_progress' | 'resolved' | 'closed'

function toApiStatus(status: UpdateTicketStatusInput['status']): TicketStatusApi {
  switch (status) {
    case 'ASSIGNED':
      return 'assigned'
    case 'IN_PROGRESS':
      return 'in_progress'
    case 'RESOLVED':
      return 'resolved'
    case 'CLOSED':
      return 'closed'
  }
}

function normalizeTicketStatus(rawStatus: unknown): Ticket['status'] {
  if (typeof rawStatus !== 'string') {
    return 'CREATED'
  }

  const normalized = rawStatus.trim().toUpperCase()
  if (
    normalized === 'CREATED' ||
    normalized === 'ASSIGNED' ||
    normalized === 'IN_PROGRESS' ||
    normalized === 'RESOLVED' ||
    normalized === 'CLOSED' ||
    normalized === 'REOPENED'
  ) {
    return normalized
  }

  return 'CREATED'
}

function getPersonDisplayName(candidate: unknown): string | undefined {
  if (!candidate) {
    return undefined
  }

  if (typeof candidate === 'string') {
    const trimmed = candidate.trim()
    return trimmed.length > 0 ? trimmed : undefined
  }

  if (typeof candidate !== 'object') {
    return undefined
  }

  const person = candidate as Record<string, unknown>
  const directName =
    typeof person.displayName === 'string'
      ? person.displayName
      : typeof person.name === 'string'
        ? person.name
        : typeof person.username === 'string'
          ? person.username
          : undefined

  if (directName && directName.trim().length > 0) {
    return directName.trim()
  }

  const firstName = typeof person.firstName === 'string' ? person.firstName.trim() : ''
  const lastName = typeof person.lastName === 'string' ? person.lastName.trim() : ''
  const fullName = `${firstName} ${lastName}`.trim()
  return fullName.length > 0 ? fullName : undefined
}

function normalizeTicket(raw: unknown): Ticket | null {
  if (!raw || typeof raw !== 'object') {
    return null
  }

  const value = raw as Record<string, unknown>
  const bus = value.bus && typeof value.bus === 'object' ? (value.bus as Record<string, unknown>) : null
  const createdBy =
    value.createdBy && typeof value.createdBy === 'object' ? (value.createdBy as Record<string, unknown>) : null
  const assignedTo =
    value.assignedTo && typeof value.assignedTo === 'object' ? (value.assignedTo as Record<string, unknown>) : null
  const id = typeof value.id === 'string' ? value.id : typeof value.ticketId === 'string' ? value.ticketId : null
  const title = typeof value.title === 'string' ? value.title : null

  if (!id || !title) {
    return null
  }

  return {
    id,
    ticketNumber:
      typeof value.ticketNumber === 'string'
        ? value.ticketNumber
        : typeof value.ticketNumber === 'number'
          ? String(value.ticketNumber)
          : typeof value.ticket_no === 'string'
            ? value.ticket_no
            : undefined,
    busNumber:
      typeof value.busNumber === 'string'
        ? value.busNumber
        : bus && typeof bus.busNumber === 'string'
          ? bus.busNumber
        : typeof value.bus_number === 'string'
          ? value.bus_number
          : typeof value.busNo === 'string'
            ? value.busNo
            : typeof value.bus_number_plate === 'string'
              ? value.bus_number_plate
              : '',
    title,
    description: typeof value.description === 'string' ? value.description : '',
    status: normalizeTicketStatus(value.status),
    severity:
      typeof value.severity === 'string' &&
      ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].includes(value.severity.toUpperCase())
        ? (value.severity.toUpperCase() as Ticket['severity'])
        : 'LOW',
    priority:
      typeof value.priority === 'string' && ['P1', 'P2', 'P3'].includes(value.priority.toUpperCase())
        ? (value.priority.toUpperCase() as TicketPriority)
        : 'P3',
    category: typeof value.category === 'string' ? value.category : 'General',
    slaDueAt: typeof value.slaDueAt === 'string' ? value.slaDueAt : '',
    createdAt:
      typeof value.createdAt === 'string'
        ? value.createdAt
        : typeof value.created_at === 'string'
          ? value.created_at
          : undefined,
    updatedAt:
      typeof value.updatedAt === 'string'
        ? value.updatedAt
        : typeof value.updated_at === 'string'
          ? value.updated_at
          : undefined,
    createdByName: getPersonDisplayName(
      value.createdByName ??
        value.createdByDisplayName ??
        value.createdByUsername ??
        value.createdByUserName ??
        value.createdByUser ??
        createdBy ??
        value.createdBy,
    ),
    assignedToName: getPersonDisplayName(
      value.assignedToName ??
        value.assignedToDisplayName ??
        value.assignedToUsername ??
        value.assigneeName ??
        value.assignee ??
        value.assignedToUser ??
        assignedTo ??
        value.assignedTo,
    ),
    assignedToUserId:
      typeof value.assignedToUserId === 'string'
        ? value.assignedToUserId
        : typeof value.assignedToId === 'string'
          ? value.assignedToId
          : assignedTo && typeof assignedTo.id === 'string'
            ? assignedTo.id
            : assignedTo && typeof assignedTo.userId === 'string'
              ? assignedTo.userId
              : assignedTo && typeof assignedTo._id === 'string'
                ? assignedTo._id
                : undefined,
  }
}

function normalizeTimelineEntry(raw: unknown): TicketTimelineEntry | null {
  if (!raw || typeof raw !== 'object') {
    return null
  }
  const value = raw as Record<string, unknown>
  const id =
    typeof value.id === 'string'
      ? value.id
      : typeof value.eventId === 'string'
        ? value.eventId
        : typeof value.activityId === 'string'
          ? value.activityId
          : `timeline-${Math.random().toString(36).slice(2, 9)}`
  const action =
    typeof value.action === 'string'
      ? value.action
      : typeof value.actionType === 'string'
        ? value.actionType
      : typeof value.type === 'string'
        ? value.type
        : typeof value.event === 'string'
          ? value.event
          : 'updated'
  const actor = value.actor && typeof value.actor === 'object' ? (value.actor as Record<string, unknown>) : null

  return {
    id,
    action,
    note: typeof value.note === 'string' ? value.note : typeof value.comment === 'string' ? value.comment : undefined,
    actionType: typeof value.actionType === 'string' ? value.actionType : undefined,
    fromStatus: typeof value.fromStatus === 'string' ? value.fromStatus : undefined,
    toStatus: typeof value.toStatus === 'string' ? value.toStatus : undefined,
    actorName: getPersonDisplayName(value.actor ?? value.user ?? value.createdBy ?? value.performedBy),
    actorUsername:
      typeof value.actorUsername === 'string'
        ? value.actorUsername
        : actor && typeof actor.username === 'string'
          ? actor.username
          : undefined,
    createdAt:
      typeof value.createdAt === 'string'
        ? value.createdAt
        : typeof value.timestamp === 'string'
          ? value.timestamp
          : undefined,
  }
}

function normalizeAssignableUser(raw: unknown): AssignableUser | null {
  if (!raw || typeof raw !== 'object') {
    return null
  }
  const value = raw as Record<string, unknown>
  const id =
    typeof value.id === 'string'
      ? value.id
      : typeof value.userId === 'string'
        ? value.userId
        : typeof value._id === 'string'
          ? value._id
          : null
  if (!id) {
    return null
  }

  const roleRaw = typeof value.role === 'string' ? value.role : typeof value.roleCode === 'string' ? value.roleCode : ''
  const roleNormalized = roleRaw.trim().toUpperCase()
  const role: AssignableUser['role'] =
    roleNormalized === 'ADMIN' || roleNormalized === 'SUPERVISOR' || roleNormalized === 'WORKER'
      ? roleNormalized
      : 'VIEWER'

  return {
    id,
    displayName: getPersonDisplayName(value.displayName ?? value.name ?? value.username ?? value) ?? id,
    role,
  }
}

function normalizeTicketCategory(raw: unknown): TicketCategory | null {
  if (!raw || typeof raw !== 'object') {
    return null
  }

  const value = raw as Record<string, unknown>
  const idCandidate = value.id ?? value.categoryId ?? value.issueCategoryId ?? value._id
  const id =
    typeof idCandidate === 'string'
      ? idCandidate
      : typeof idCandidate === 'number'
        ? String(idCandidate)
        : null
  const nameCandidate = value.name ?? value.categoryName ?? value.title ?? value.label
  const name = typeof nameCandidate === 'string' ? nameCandidate.trim() : ''

  if (!id || !name) {
    return null
  }

  return {
    id,
    name,
    isActive: typeof value.isActive === 'boolean' ? value.isActive : true,
  }
}

function extractTicketArrayPayload(raw: unknown): unknown[] {
  if (Array.isArray(raw)) {
    return raw
  }

  if (!raw || typeof raw !== 'object') {
    return []
  }

  const record = raw as Record<string, unknown>
  if (Array.isArray(record.data)) {
    return record.data
  }

  if (record.data && typeof record.data === 'object') {
    const nested = record.data as Record<string, unknown>
    if (Array.isArray(nested.tickets)) {
      return nested.tickets
    }
    if (Array.isArray(nested.issueCategories)) {
      return nested.issueCategories
    }
    if (Array.isArray(nested.categories)) {
      return nested.categories
    }
    if (Array.isArray(nested.items)) {
      return nested.items
    }
    if (Array.isArray(nested.activityLogs)) {
      return nested.activityLogs
    }
  }

  if (Array.isArray(record.tickets)) {
    return record.tickets
  }
  if (Array.isArray(record.issueCategories)) {
    return record.issueCategories
  }
  if (Array.isArray(record.categories)) {
    return record.categories
  }

  if (Array.isArray(record.items)) {
    return record.items
  }
  if (Array.isArray(record.activityLogs)) {
    return record.activityLogs
  }

  return []
}

export const ticketsService = {
  async list(): Promise<Ticket[]> {
    const { data } = await apiClient.get<unknown>(endpoint)
    return extractTicketArrayPayload(data).map(normalizeTicket).filter((ticket): ticket is Ticket => Boolean(ticket))
  },

  async getById(ticketId: string): Promise<Ticket> {
    const { data } = await apiClient.get<unknown>(`${endpoint}/${ticketId}`)
    const payload =
      data && typeof data === 'object' && 'data' in (data as Record<string, unknown>)
        ? (data as Record<string, unknown>).data
        : data
    return normalizeTicket(payload) ?? (payload as Ticket)
  },

  async searchByTicketNumber(ticketNumber: string): Promise<Ticket> {
    const { data } = await apiClient.get<unknown>(`${endpoint}/search`, {
      params: { ticketNumber },
    })
    const payload =
      data && typeof data === 'object' && 'data' in (data as Record<string, unknown>)
        ? (data as Record<string, unknown>).data
        : data
    return normalizeTicket(payload) ?? (payload as Ticket)
  },

  async updateStatus({ ticketId, status, note }: UpdateTicketStatusInput): Promise<Ticket> {
    const { data } = await apiClient.patch<unknown>(`${endpoint}/${ticketId}/status`, {
      status: toApiStatus(status),
      ...(note && note.trim().length > 0 ? { note: note.trim() } : {}),
    })
    const payload =
      data && typeof data === 'object' && 'data' in (data as Record<string, unknown>)
        ? (data as Record<string, unknown>).data
        : data
    return normalizeTicket(payload) ?? (payload as Ticket)
  },

  async getTimeline(ticketId: string): Promise<TicketTimelineEntry[]> {
    const { data } = await apiClient.get<unknown>(`${endpoint}/${ticketId}/timeline`)
    return extractTicketArrayPayload(data)
      .map(normalizeTimelineEntry)
      .filter((entry): entry is TicketTimelineEntry => Boolean(entry))
  },

  async assign({ ticketId, assignedToId, note }: AssignTicketInput): Promise<Ticket> {
    const { data } = await apiClient.post<unknown>(`${endpoint}/${ticketId}/assign`, {
      assignedToId,
      ...(note && note.trim().length > 0 ? { note: note.trim() } : {}),
    })
    const payload =
      data && typeof data === 'object' && 'data' in (data as Record<string, unknown>)
        ? (data as Record<string, unknown>).data
        : data
    return normalizeTicket(payload) ?? (payload as Ticket)
  },

  async addComment({ ticketId, note }: AddTicketCommentInput): Promise<void> {
    await apiClient.post(`${endpoint}/${ticketId}/comments`, { note: note.trim() })
  },

  async listAssignableUsers(): Promise<AssignableUser[]> {
    const { data } = await apiClient.get<unknown>('/workers')
    return extractTicketArrayPayload(data)
      .map(normalizeAssignableUser)
      .filter((user): user is AssignableUser => Boolean(user))
  },

  async listIssueCategories(): Promise<TicketCategory[]> {
    const { data } = await apiClient.get<unknown>('/issue-categories')
    return extractTicketArrayPayload(data)
      .map(normalizeTicketCategory)
      .filter((category): category is TicketCategory => Boolean(category))
  },

  async create(input: CreateTicketInput): Promise<Ticket> {
    const { data } = await apiClient.post<unknown>(endpoint, input)
    const payload =
      data && typeof data === 'object' && 'data' in (data as Record<string, unknown>)
        ? (data as Record<string, unknown>).data
        : data
    return normalizeTicket(payload) ?? (payload as Ticket)
  },

  async enhanceDescription(description: string): Promise<string> {
    const { data } = await apiClient.post<EnhanceTicketDescriptionResponse>('/ai/enhance-ticket-description', {
      description: description.trim(),
    })

    const enhancedText = data?.data?.enhancedText
    if (!enhancedText || !enhancedText.trim()) {
      throw new Error('AI enhancement returned empty text.')
    }

    return enhancedText
  },

  async remove(ticketId: string): Promise<void> {
    await apiClient.delete(`${endpoint}/${ticketId}`)
  },
}
