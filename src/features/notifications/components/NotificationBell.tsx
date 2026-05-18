import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Bell,
  CheckCircle2,
  MessageSquare,
  PlusCircle,
  RefreshCw,
  RotateCcw,
  UserPlus,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Skeleton } from '@/components/ui/skeleton'
import { useMarkAllNotificationsReadMutation } from '@/features/notifications/hooks/use-mark-all-notifications-read-mutation'
import { useMarkNotificationReadMutation } from '@/features/notifications/hooks/use-mark-notification-read-mutation'
import { useNotificationsQuery } from '@/features/notifications/hooks/use-notifications-query'
import { useNotificationSound } from '@/features/notifications/hooks/use-notification-sound'
import { useNotificationsUnreadCountQuery } from '@/features/notifications/hooks/use-notifications-unread-count-query'
import type { AppNotification, NotificationType } from '@/features/notifications/types/notification'
import { getTicketDetailsPath } from '@/features/tickets/utils/ticket-routes'
import { cn } from '@/lib/utils'

function formatRelativeTime(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) {
    return 'Recently'
  }

  const diffMs = Date.now() - date.getTime()
  const diffMinutes = Math.floor(diffMs / 60_000)

  if (diffMinutes < 1) {
    return 'Just now'
  }

  if (diffMinutes < 60) {
    return `${diffMinutes}m ago`
  }

  const diffHours = Math.floor(diffMinutes / 60)
  if (diffHours < 24) {
    return `${diffHours}h ago`
  }

  const diffDays = Math.floor(diffHours / 24)
  if (diffDays < 7) {
    return `${diffDays}d ago`
  }

  return date.toLocaleDateString()
}

function getNotificationIcon(type: NotificationType) {
  switch (type) {
    case 'ticket_commented':
      return MessageSquare
    case 'ticket_assigned':
      return UserPlus
    case 'ticket_created':
      return PlusCircle
    case 'ticket_reopened':
      return RotateCcw
    case 'ticket_status_changed':
    case 'ticket_closed':
      return CheckCircle2
    default:
      return Bell
  }
}

function NotificationListSkeleton() {
  return (
    <div className="space-y-2 px-2 py-1">
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className="space-y-2 rounded-md p-2">
          <Skeleton className="h-3 w-3/4" />
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-2 w-1/4" />
        </div>
      ))}
    </div>
  )
}

function NotificationItem({
  notification,
  onSelect,
}: {
  notification: AppNotification
  onSelect: (notification: AppNotification) => void
}) {
  const isUnread = notification.readAt === null
  const Icon = getNotificationIcon(notification.type)

  return (
    <DropdownMenuItem
      className={cn(
        'flex cursor-pointer items-start gap-3 rounded-md px-3 py-2.5 focus:bg-accent',
        isUnread && 'border-l-2 border-l-primary bg-accent/40 pl-[10px]',
      )}
      onSelect={() => onSelect(notification)}
    >
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
      <div className="min-w-0 flex-1 space-y-1">
        <p className={cn('truncate text-sm leading-tight', isUnread ? 'font-semibold text-foreground' : 'text-foreground/80')}>
          {notification.title}
        </p>
        {notification.message ? (
          <p className="line-clamp-2 text-xs leading-snug text-muted-foreground">{notification.message}</p>
        ) : null}
        <p className="text-[11px] text-muted-foreground">{formatRelativeTime(notification.createdAt)}</p>
      </div>
      {isUnread ? <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" aria-hidden /> : null}
    </DropdownMenuItem>
  )
}

export function NotificationBell() {
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [unreadOnly, setUnreadOnly] = useState(false)

  const { data: unreadCount = 0 } = useNotificationsUnreadCountQuery()
  useNotificationSound(unreadCount)
  const {
    data: notificationsResult,
    isLoading,
    isError,
  } = useNotificationsQuery({
    enabled: open,
    page: 1,
    limit: 20,
    unreadOnly,
  })

  const markReadMutation = useMarkNotificationReadMutation()
  const markAllReadMutation = useMarkAllNotificationsReadMutation()

  const notifications = notificationsResult?.items ?? []
  const badgeLabel = unreadCount > 9 ? '9+' : String(unreadCount)

  const handleNotificationSelect = async (notification: AppNotification) => {
    if (notification.readAt === null) {
      try {
        await markReadMutation.mutateAsync(notification.id)
      } catch {
        // Navigation still proceeds; badge refreshes on next poll.
      }
    }

    if (notification.ticketId) {
      navigate(getTicketDetailsPath(notification.ticketId))
    }

    setOpen(false)
  }

  const handleMarkAllRead = async () => {
    if (unreadCount === 0 || markAllReadMutation.isPending) {
      return
    }

    try {
      await markAllReadMutation.mutateAsync()
    } catch {
      // Silent failure; user can retry.
    }
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          aria-label={unreadCount > 0 ? `${unreadCount} unread notifications` : 'Notifications'}
        >
          <Bell className="h-4 w-4" />
          {unreadCount > 0 ? (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold leading-none text-destructive-foreground">
              {badgeLabel}
            </span>
          ) : null}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        sideOffset={8}
        collisionPadding={16}
        className="w-[calc(100vw-2rem)] max-w-[360px] p-0"
      >
        <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1 px-3 py-2.5">
          <DropdownMenuLabel className="p-0 text-sm font-semibold">Notifications</DropdownMenuLabel>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 shrink-0 px-2 text-xs sm:h-7"
            disabled={unreadCount === 0 || markAllReadMutation.isPending}
            onClick={(event) => {
              event.preventDefault()
              void handleMarkAllRead()
            }}
          >
            {markAllReadMutation.isPending ? (
              <RefreshCw className="mr-1 h-3 w-3 animate-spin" />
            ) : null}
            <span className="sm:hidden">Mark all</span>
            <span className="hidden sm:inline">Mark all read</span>
          </Button>
        </div>

        <div className="flex items-center gap-1 border-y px-3 py-2">
          <Button
            type="button"
            variant={unreadOnly ? 'ghost' : 'secondary'}
            size="sm"
            className="h-8 flex-1 px-2.5 text-xs sm:h-7 sm:flex-none"
            onClick={() => setUnreadOnly(false)}
          >
            All
          </Button>
          <Button
            type="button"
            variant={unreadOnly ? 'secondary' : 'ghost'}
            size="sm"
            className="h-8 flex-1 px-2.5 text-xs sm:h-7 sm:flex-none"
            onClick={() => setUnreadOnly(true)}
          >
            Unread only
          </Button>
        </div>

        <div className="max-h-[min(20rem,70dvh)] overflow-y-auto py-1 sm:max-h-80">
          {isLoading ? <NotificationListSkeleton /> : null}

          {!isLoading && isError ? (
            <p className="px-4 py-6 text-center text-sm text-muted-foreground">Could not load notifications.</p>
          ) : null}

          {!isLoading && !isError && notifications.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-muted-foreground">
              {unreadOnly ? 'No unread notifications.' : 'No notifications yet.'}
            </p>
          ) : null}

          {!isLoading && !isError
            ? notifications.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onSelect={handleNotificationSelect}
                />
              ))
            : null}
        </div>

        {!isLoading && !isError && notifications.length > 0 ? (
          <>
            <DropdownMenuSeparator />
            <p className="px-3 py-2 text-center text-[11px] text-muted-foreground">
              Showing latest {notifications.length} notification{notifications.length === 1 ? '' : 's'}
            </p>
          </>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
