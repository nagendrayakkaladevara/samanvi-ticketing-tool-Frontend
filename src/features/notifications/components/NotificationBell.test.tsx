import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { renderWithProviders } from '@/test/render-with-providers'

const useNotificationsUnreadCountQuery = vi.fn()
const useNotificationsQuery = vi.fn()
const useNotificationSound = vi.fn()
const useMarkNotificationReadMutation = vi.fn()
const useMarkAllNotificationsReadMutation = vi.fn()

vi.mock('@/features/notifications/hooks/use-notifications-unread-count-query', () => ({
  useNotificationsUnreadCountQuery: () => useNotificationsUnreadCountQuery(),
}))
vi.mock('@/features/notifications/hooks/use-notifications-query', () => ({
  useNotificationsQuery: (args: unknown) => useNotificationsQuery(args),
}))
vi.mock('@/features/notifications/hooks/use-notification-sound', () => ({
  useNotificationSound: () => useNotificationSound(),
}))
vi.mock('@/features/notifications/hooks/use-mark-notification-read-mutation', () => ({
  useMarkNotificationReadMutation: () => useMarkNotificationReadMutation(),
}))
vi.mock('@/features/notifications/hooks/use-mark-all-notifications-read-mutation', () => ({
  useMarkAllNotificationsReadMutation: () => useMarkAllNotificationsReadMutation(),
}))

import { NotificationBell } from './NotificationBell'

describe('NotificationBell', () => {
  it('renders bell with unread badge and opens panel', async () => {
    const user = userEvent.setup()
    useNotificationsUnreadCountQuery.mockReturnValue({ data: 2 })
    useNotificationSound.mockReturnValue(undefined)
    useNotificationsQuery.mockReturnValue({
      data: { items: [{ id: 'n1', title: 'Ticket assigned', message: 'Check ticket', type: 'ticket_assigned', readAt: null, createdAt: new Date().toISOString(), ticketId: 't1' }] },
      isLoading: false,
      isError: false,
    })
    useMarkNotificationReadMutation.mockReturnValue({ mutateAsync: vi.fn() })
    useMarkAllNotificationsReadMutation.mockReturnValue({ isPending: false, mutateAsync: vi.fn() })

    renderWithProviders(<NotificationBell />)

    expect(screen.getByRole('button', { name: '2 unread notifications' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: '2 unread notifications' }))
    expect(screen.getByText('Notifications')).toBeInTheDocument()
    expect(screen.getByText('Ticket assigned')).toBeInTheDocument()
  })
})
