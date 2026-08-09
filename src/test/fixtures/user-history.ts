import type {
  ActivityItem,
  UserMetrics,
  UserTicketItem,
} from '@/features/user-history/types/user-history'

export function makeUserTicketItem(overrides?: Partial<UserTicketItem>): UserTicketItem {
  return {
    id: 'ticket-1',
    ticketNumber: 'TKT-001',
    title: 'Brake inspection',
    status: 'in_progress',
    severity: 'high',
    priority: 'p2',
    slaDueAt: '2024-06-15T12:00:00Z',
    assignedAt: '2024-06-01T08:00:00Z',
    resolvedAt: null,
    closedAt: null,
    reopenedCount: 0,
    createdAt: '2024-06-01T08:00:00Z',
    updatedAt: '2024-06-02T08:00:00Z',
    bus: { id: 'bus-1', busNumber: 'BUS-01' },
    category: { id: 'cat-1', name: 'Mechanical' },
    createdBy: { id: 'u1', username: 'admin', displayName: 'Admin User' },
    assignedTo: { id: 'u2', username: 'tech', displayName: 'Tech User' },
    isOverdue: false,
    overdueDurationMs: 0,
    ...overrides,
  }
}

export function makeActivityItem(overrides?: Partial<ActivityItem>): ActivityItem {
  return {
    id: 'activity-1',
    actionType: 'status_changed',
    fromStatus: 'assigned',
    toStatus: 'in_progress',
    note: 'Started work',
    createdAt: '2024-06-02T08:00:00Z',
    ticket: {
      id: 'ticket-1',
      ticketNumber: 'TKT-001',
      title: 'Brake inspection',
      status: 'in_progress',
      bus: { busNumber: 'BUS-01' },
    },
    ...overrides,
  }
}

export function makeUserMetrics(overrides?: Partial<UserMetrics>): UserMetrics {
  return {
    window: { days: 30, fromInclusive: '2024-05-01', toInclusive: '2024-05-31' },
    assigned: {
      totalCount: 12,
      openCount: 3,
      overdueOpenCount: 1,
      resolvedAllTimeCount: 9,
      resolvedInWindowCount: 4,
      resolvedPerDay: [{ date: '2024-05-15', count: 2 }],
      averageResolutionTimeMs: 86_400_000,
      slaCompliancePercent: 85,
    },
    created: { totalCount: 5 },
    actedOn: { distinctTicketCount: 8, activityCount: 20 },
    ...overrides,
  }
}
