export function formatDateTime(rawDate?: string | null): string {
  if (!rawDate) return '—'
  const parsed = new Date(rawDate)
  if (Number.isNaN(parsed.getTime())) return '—'

  return new Intl.DateTimeFormat(undefined, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(parsed)
}

export function formatShortDate(rawDate?: string): string {
  if (!rawDate) return '—'
  const parsed = new Date(rawDate.includes('T') ? rawDate : `${rawDate}T00:00:00`)
  if (Number.isNaN(parsed.getTime())) return rawDate

  return new Intl.DateTimeFormat(undefined, {
    day: 'numeric',
    month: 'short',
  }).format(parsed)
}

export function formatDurationMs(ms: number | null | undefined): string {
  if (ms == null || !Number.isFinite(ms) || ms < 0) return '—'

  const hours = Math.floor(ms / 3_600_000)
  const minutes = Math.floor((ms % 3_600_000) / 60_000)

  if (hours >= 48) {
    const days = Math.floor(hours / 24)
    const remHours = hours % 24
    return remHours > 0 ? `${days}d ${remHours}h` : `${days}d`
  }

  if (hours > 0) {
    return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`
  }

  return `${Math.max(1, minutes)}m`
}

export function formatPercent(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return '—'
  return `${value.toFixed(1)}%`
}

export function formatStatusLabel(status: string): string {
  return status.replaceAll('_', ' ')
}

export function formatSeverityLabel(severity: string): string {
  return severity.toUpperCase()
}

export function formatPriorityLabel(priority: string): string {
  return priority.toUpperCase()
}

/** CUIDs, UUIDs, and other opaque DB ids — not user-facing ticket numbers. */
export function isInternalRecordId(value: string | undefined | null): boolean {
  const trimmed = value?.trim()
  if (!trimmed) return true

  if (/^c[a-z0-9]{20,}$/i.test(trimmed)) return true
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(trimmed)) return true
  if (/^usr_/i.test(trimmed) || /^tkt_/i.test(trimmed) || /^act_/i.test(trimmed)) return true

  return false
}

export function getDisplayTicketNumber(ticketNumber: string, ticketId: string): string | null {
  const trimmed = ticketNumber.trim()
  if (!trimmed || trimmed === ticketId || isInternalRecordId(trimmed)) {
    return null
  }
  return trimmed
}

export function formatActivityTicketHeading(ticketNumber: string, ticketId: string, title: string): string {
  const displayNumber = getDisplayTicketNumber(ticketNumber, ticketId)
  return displayNumber ? `${displayNumber} · ${title}` : title
}

export function formatActivityNote(note: string | null, ticketId: string): string | null {
  if (!note?.trim()) return null
  const trimmed = note.trim()
  if (trimmed === ticketId || isInternalRecordId(trimmed)) return null
  return trimmed
}
