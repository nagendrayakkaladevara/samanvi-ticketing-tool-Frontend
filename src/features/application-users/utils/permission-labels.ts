const PERMISSION_MODULE_LABELS: Record<string, string> = {
  users: 'Application Access',
}

export function formatPermissionToken(value: string): string {
  if (!value.trim()) {
    return 'General'
  }

  return value
    .split(/[_-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ')
}

export function formatPermissionModuleLabel(module: string, fallback?: string): string {
  const override = PERMISSION_MODULE_LABELS[module]
  if (override) {
    return override
  }

  const trimmedFallback = fallback?.trim()
  return trimmedFallback ? trimmedFallback : formatPermissionToken(module)
}

export function formatPermissionAction(action: string): string {
  return formatPermissionToken(action)
}
