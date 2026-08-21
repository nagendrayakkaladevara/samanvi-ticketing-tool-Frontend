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

export function extractPaginationMeta(
  raw: unknown,
  fallback: { page: number; limit: number },
): { page: number; limit: number; total: number; totalPages: number; hasExplicitTotalPages: boolean } {
  const record = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {}
  const metaCandidate =
    (record.meta && typeof record.meta === 'object' ? (record.meta as Record<string, unknown>) : null) ??
    (record.data && typeof record.data === 'object'
      ? ((record.data as Record<string, unknown>).meta as Record<string, unknown> | undefined)
      : undefined) ??
    {}

  const page = typeof metaCandidate.page === 'number' ? metaCandidate.page : fallback.page
  const limit = typeof metaCandidate.limit === 'number' ? metaCandidate.limit : fallback.limit
  const total = typeof metaCandidate.total === 'number' ? metaCandidate.total : extractArrayPayload(raw).length
  const hasExplicitTotalPages = typeof metaCandidate.totalPages === 'number'
  const totalPages = hasExplicitTotalPages
    ? (metaCandidate.totalPages as number)
    : Math.max(1, Math.ceil(total / Math.max(limit, 1)))

  return { page, limit, total, totalPages, hasExplicitTotalPages }
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
