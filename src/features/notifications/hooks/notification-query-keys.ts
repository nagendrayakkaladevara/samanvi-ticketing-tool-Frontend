export const notificationQueryKeys = {
  all: ['notifications'] as const,
  unreadCount: () => [...notificationQueryKeys.all, 'unread-count'] as const,
  list: (page: number, limit: number, unreadOnly: boolean) =>
    [...notificationQueryKeys.all, 'list', page, limit, unreadOnly] as const,
}
