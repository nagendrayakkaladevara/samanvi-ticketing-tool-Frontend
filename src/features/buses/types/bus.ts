export type Bus = {
  id: string
  busNumber: string
  lastMaintenanceDate?: string
}

export type CreateBusInput = {
  busNumber: string
  lastMaintenanceDate?: string
}

export type BusHistoryTicket = {
  id: string
  title: string
  status: 'CREATED' | 'ASSIGNED' | 'IN_PROGRESS' | 'BLOCKED' | 'RESOLVED' | 'CLOSED' | 'REOPENED'
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'
  priority: 'P1' | 'P2' | 'P3'
  assignedToName?: string
  createdAt?: string
}
