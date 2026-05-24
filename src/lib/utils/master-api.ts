export function normalizeString(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : undefined
}

export function extractArrayPayload(raw: unknown): unknown[] {
  if (Array.isArray(raw)) return raw

  if (!raw || typeof raw !== 'object') return []

  const record = raw as Record<string, unknown>
  if (Array.isArray(record.data)) return record.data

  if (record.data && typeof record.data === 'object') {
    const nested = record.data as Record<string, unknown>
    if (Array.isArray(nested.items)) return nested.items
  }

  if (Array.isArray(record.items)) return record.items

  return []
}

export function extractEntityPayload(raw: unknown): unknown {
  if (!raw || typeof raw !== 'object') return raw

  const record = raw as Record<string, unknown>
  if (record.data && typeof record.data === 'object') {
    return record.data
  }

  return raw
}

export function resolveEntityId(value: Record<string, unknown>): string | undefined {
  const idCandidate = value.id ?? value.driverId ?? value.helperId ?? value.staffId ?? value._id
  if (typeof idCandidate === 'string') return idCandidate
  if (typeof idCandidate === 'number') return String(idCandidate)
  return undefined
}
