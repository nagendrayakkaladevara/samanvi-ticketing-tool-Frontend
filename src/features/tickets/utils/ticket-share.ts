import { getTicketDetailsPath } from '@/features/tickets/utils/ticket-routes'

export type TicketShareInput = {
  ticketId: string
  ticketNumber?: string
  title: string
}

export function getTicketShareDisplayId(ticketId: string, ticketNumber?: string): string {
  const trimmed = ticketNumber?.trim()
  if (trimmed) {
    return trimmed
  }
  return ticketId
}

export function getTicketShareUrl(ticketId: string, origin = window.location.origin): string {
  return `${origin}${getTicketDetailsPath(ticketId)}`
}

export function buildTicketShareMessage(input: TicketShareInput, origin?: string): string {
  const displayId = getTicketShareDisplayId(input.ticketId, input.ticketNumber)
  const url = getTicketShareUrl(input.ticketId, origin)

  return [
    'Please review the following ticket:',
    '',
    `Ticket ID: ${displayId}`,
    `Title: ${input.title}`,
    '',
    url,
  ].join('\n')
}

export function getWhatsAppShareUrl(message: string): string {
  return `https://wa.me/?text=${encodeURIComponent(message)}`
}

export function shareTicketViaWhatsApp(input: TicketShareInput): void {
  const message = buildTicketShareMessage(input)
  const url = getWhatsAppShareUrl(message)
  window.open(url, '_blank', 'noopener,noreferrer')
}
