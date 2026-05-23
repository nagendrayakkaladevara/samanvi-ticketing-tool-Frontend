export type TicketStatusApi =
  | 'created'
  | 'assigned'
  | 'in_progress'
  | 'blocked'
  | 'resolved'
  | 'closed'
  | 'reopened'

export type TicketSeverityApi = 'critical' | 'high' | 'medium' | 'low'
export type TicketPriorityApi = 'p1' | 'p2' | 'p3'
export type TicketRelation = 'assigned' | 'created' | 'acted_on'
export type TicketActivityType =
  | 'created'
  | 'assigned'
  | 'status_changed'
  | 'commented'
  | 'reopened'
  | 'closed'

export type RoleCodeApi = 'admin' | 'supervisor' | 'worker'

export type UserSummary = {
  id: string
  username: string
  displayName: string
  role: {
    code: RoleCodeApi
    label: string
  }
}

export type MetricsWindow = {
  days: number
  fromInclusive: string
  toInclusive: string
}

export type ResolvedPerDay = {
  date: string
  count: number
}

export type UserAssignedMetrics = {
  totalCount: number
  openCount: number
  overdueOpenCount: number
  resolvedAllTimeCount: number
  resolvedInWindowCount: number
  resolvedPerDay: ResolvedPerDay[]
  averageResolutionTimeMs: number | null
  slaCompliancePercent: number | null
}

export type UserMetrics = {
  window: MetricsWindow
  assigned: UserAssignedMetrics
  created: { totalCount: number }
  actedOn: { distinctTicketCount: number; activityCount: number }
}

export type UserTicketItem = {
  id: string
  ticketNumber: string
  title: string
  status: TicketStatusApi
  severity: TicketSeverityApi
  priority: TicketPriorityApi
  slaDueAt: string
  assignedAt: string | null
  resolvedAt: string | null
  closedAt: string | null
  reopenedCount: number
  createdAt: string
  updatedAt: string
  bus: { id: string; busNumber: string }
  category: { id: string; name: string }
  createdBy: { id: string; username: string; displayName: string }
  assignedTo: { id: string; username: string; displayName: string } | null
  isOverdue: boolean
  overdueDurationMs: number
}

export type ActivityItem = {
  id: string
  actionType: TicketActivityType
  fromStatus: TicketStatusApi | null
  toStatus: TicketStatusApi | null
  note: string | null
  createdAt: string
  ticket: {
    id: string
    ticketNumber: string
    title: string
    status: TicketStatusApi
    bus: { busNumber: string }
  }
}

export type PaginationMeta = {
  page: number
  limit: number
  total: number
  totalPages: number
}

export type UserHistorySnapshot = {
  user: UserSummary
  generatedAt: string
  ticketCounts: {
    assigned: number
    created: number
    actedOn: number
  }
  ticketsByStatus: {
    assigned: Partial<Record<TicketStatusApi, number>>
    created: Partial<Record<TicketStatusApi, number>>
  }
  metrics: UserMetrics
  recent: {
    assignedTickets: UserTicketItem[]
    createdTickets: UserTicketItem[]
    activity: ActivityItem[]
  }
}

export type UserTicketsQuery = {
  relation?: TicketRelation
  status?: TicketStatusApi
  severity?: TicketSeverityApi
  priority?: TicketPriorityApi
  categoryId?: string
  busId?: string
  page?: number
  limit?: number
}

export type UserTicketsResult = {
  userId: string
  relation: TicketRelation
  items: UserTicketItem[]
  meta: PaginationMeta
}

export type UserActivityResult = {
  userId: string
  items: ActivityItem[]
  meta: PaginationMeta
}
