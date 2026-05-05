export function getTicketDetailsPath(ticketId: string): string {
  return `/tickets/${ticketId}`
}

export function getCreateTicketPath(): string {
  return '/tickets/create'
}
