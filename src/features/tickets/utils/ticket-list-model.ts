import type { Ticket } from '@/features/tickets/types/ticket'

export type TicketGridRow = {
  id: string
  ticketNumber: string
  title: string
  busNumber: string
  createdBy: string
  assignedTo: string
  severity: string
  slaDueAt: string
  createdAt: string
  isOverdue: boolean
}

export function compareTicketsNewestFirst(a: Ticket, b: Ticket): number {
  const dateA = a.createdAt ? new Date(a.createdAt).getTime() || 0 : 0
  const dateB = b.createdAt ? new Date(b.createdAt).getTime() || 0 : 0
  if (dateB !== dateA) {
    return dateB - dateA
  }
  return b.id.localeCompare(a.id)
}

export function formatSlaDueAt(rawSlaDueAt: string): string {
  if (!rawSlaDueAt) {
    return 'No SLA'
  }

  const parsed = new Date(rawSlaDueAt)
  if (Number.isNaN(parsed.getTime())) {
    return 'No SLA'
  }

  return new Intl.DateTimeFormat(undefined, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(parsed)
}

export function isSlaOverdue(rawSlaDueAt: string): boolean {
  if (!rawSlaDueAt) {
    return false
  }

  const parsed = new Date(rawSlaDueAt)
  if (Number.isNaN(parsed.getTime())) {
    return false
  }

  return parsed.getTime() < Date.now()
}

export function toTicketGridRow(ticket: Ticket): TicketGridRow {
  return {
    id: ticket.id,
    ticketNumber: ticket.ticketNumber ?? '—',
    title: ticket.title,
    busNumber: ticket.busNumber || 'N/A',
    createdBy: ticket.createdByName || 'Unknown',
    assignedTo: ticket.assignedToName || ticket.assignedToUserId || 'Unassigned',
    severity: ticket.severity,
    slaDueAt: ticket.slaDueAt,
    createdAt: ticket.createdAt ?? '',
    isOverdue: isSlaOverdue(ticket.slaDueAt),
  }
}
