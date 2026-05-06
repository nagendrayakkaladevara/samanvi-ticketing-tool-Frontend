export type TicketStatus =
  | 'CREATED'
  | 'ASSIGNED'
  | 'IN_PROGRESS'
  | 'RESOLVED'
  | 'CLOSED'
  | 'REOPENED'

export type TicketSeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'
export type TicketPriority = 'P1' | 'P2' | 'P3'
export type AssignableRole = 'WORKER' | 'SUPERVISOR' | 'ADMIN' | 'VIEWER'

export interface Ticket {
  id: string
  ticketNumber?: string
  busNumber: string
  title: string
  description: string
  status: TicketStatus
  severity: TicketSeverity
  priority: TicketPriority
  category: string
  slaDueAt: string
  createdAt?: string
  updatedAt?: string
  createdByName?: string
  assignedToName?: string
  assignedToUserId?: string
}

export interface TicketTimelineEntry {
  id: string
  action: string
  actionType?: string
  fromStatus?: string
  toStatus?: string
  note?: string
  actorName?: string
  actorUsername?: string
  createdAt?: string
}

export interface AssignableUser {
  id: string
  displayName: string
  role: AssignableRole
}

export interface TicketCategory {
  id: string
  name: string
  isActive: boolean
}
