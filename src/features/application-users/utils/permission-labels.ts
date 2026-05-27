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

export function formatPermissionAction(action: string): string {
  return formatPermissionToken(action)
}
