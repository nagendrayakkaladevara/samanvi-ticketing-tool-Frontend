export function getUserHistoryPath(userId: string): string {
  return `/users/${encodeURIComponent(userId)}/history`
}
