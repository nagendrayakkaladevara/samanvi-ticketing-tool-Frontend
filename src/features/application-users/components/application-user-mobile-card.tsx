import { AtSign, Eye, KeyRound, Mail, Pencil, Phone, Shield, Trash2 } from 'lucide-react'

import '@/features/tickets/styles/tickets-grid.css'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  applicationUserTypeLabels,
  type ApplicationUser,
} from '@/features/application-users/types/application-user'
import { cn } from '@/lib/utils'

function StatusBadge({ isActive }: { isActive: boolean }) {
  return (
    <span
      className={cn(
        'inline-flex shrink-0 rounded-full px-2 py-1 text-xs font-medium',
        isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-700',
      )}
    >
      {isActive ? 'Active' : 'Inactive'}
    </span>
  )
}

function UserTypeBadge({ userType }: { userType: ApplicationUser['userType'] }) {
  const normalized = userType.toLowerCase()

  return (
    <span
      className={cn(
        'inline-flex rounded-md px-2 py-0.5 text-xs font-semibold uppercase tracking-wide',
        normalized === 'admin' && 'bg-violet-100 text-violet-800',
        normalized === 'supervisor' && 'bg-sky-100 text-sky-800',
        normalized === 'chairman' && 'bg-indigo-100 text-indigo-800',
        normalized === 'accountant' && 'bg-teal-100 text-teal-800',
        normalized === 'collection_agent' && 'bg-orange-100 text-orange-900',
        normalized === 'worker' && 'bg-amber-100 text-amber-900',
      )}
    >
      {applicationUserTypeLabels[userType] ?? userType}
    </span>
  )
}

export type ApplicationUserMobileCardProps = {
  user: ApplicationUser
  canEdit?: boolean
  canDelete?: boolean
  onView: () => void
  onEdit: () => void
  onDelete: () => void
}

export function ApplicationUserMobileCard({
  user,
  canEdit = false,
  canDelete = false,
  onView,
  onEdit,
  onDelete,
}: ApplicationUserMobileCardProps) {
  const email = user.email?.trim()
  const overrideCount = user.permissionIds.length

  return (
    <Card
      className={cn(
        'ticket-mobile-card user-mobile-card',
        !user.isActive && 'user-mobile-card--inactive opacity-95',
      )}
      role="article"
      aria-label={`Application user ${user.displayName}`}
    >
      <button type="button" className="ticket-mobile-card__body" onClick={onView}>
        <div className="ticket-mobile-card__header">
          <div className="min-w-0 flex-1 space-y-1">
            <h3 className="ticket-mobile-card__title">{user.displayName}</h3>
            <p className="inline-flex items-center gap-1 text-xs text-muted-foreground">
              <AtSign className="h-3 w-3 shrink-0" aria-hidden />
              {user.username || '—'}
            </p>
          </div>
          <StatusBadge isActive={user.isActive} />
        </div>

        <dl className="ticket-mobile-card__meta">
          <div className="ticket-mobile-card__meta-item">
            <dt>User Type</dt>
            <dd>
              <Shield className="ticket-mobile-card__meta-icon" aria-hidden />
              <UserTypeBadge userType={user.userType} />
            </dd>
          </div>
          <div className="ticket-mobile-card__meta-item">
            <dt>Mobile</dt>
            <dd>
              <Phone className="ticket-mobile-card__meta-icon" aria-hidden />
              {user.mobileNumber || '—'}
            </dd>
          </div>
          <div className="ticket-mobile-card__meta-item">
            <dt>Overrides</dt>
            <dd className={cn(overrideCount === 0 && 'ticket-mobile-card__meta-value--muted')}>
              <KeyRound className="ticket-mobile-card__meta-icon" aria-hidden />
              {overrideCount > 0 ? overrideCount : 'None'}
            </dd>
          </div>
          <div className="ticket-mobile-card__meta-item ticket-mobile-card__meta-item--full">
            <dt>Email</dt>
            <dd className={cn(!email && 'ticket-mobile-card__meta-value--muted')}>
              <Mail className="ticket-mobile-card__meta-icon" aria-hidden />
              {email || 'Not set'}
            </dd>
          </div>
        </dl>
      </button>

      <div className="ticket-mobile-card__actions flex-col gap-2 min-[420px]:flex-row">
        <Button
          size="sm"
          className="ticket-mobile-card__action-primary w-full min-[420px]:flex-1"
          onClick={onView}
        >
          <Eye className="h-4 w-4" aria-hidden />
          View
        </Button>
        {canEdit || canDelete ? (
          <div className="flex w-full gap-2 min-[420px]:contents">
            {canEdit ? (
              <Button
                size="sm"
                variant="outline"
                className="ticket-mobile-card__action-secondary min-w-0 flex-1"
                onClick={onEdit}
              >
                <Pencil className="h-4 w-4" aria-hidden />
                Edit
              </Button>
            ) : null}
            {canDelete ? (
              <Button
                size="sm"
                variant="destructive"
                className="ticket-mobile-card__action-delete shrink-0 border-red-600 bg-red-600 text-white hover:bg-red-700"
                onClick={onDelete}
                aria-label={`Delete application user ${user.displayName}`}
              >
                <Trash2 className="h-4 w-4" aria-hidden />
              </Button>
            ) : null}
          </div>
        ) : null}
      </div>
    </Card>
  )
}

export function ApplicationUserMobileCardSkeleton() {
  return (
    <Card className="ticket-mobile-card user-mobile-card ticket-mobile-card--skeleton" aria-hidden>
      <div className="ticket-mobile-card__header">
        <div className="min-w-0 flex-1 space-y-2">
          <div className="h-5 w-36 rounded-md bg-muted" />
          <div className="h-3 w-24 rounded-md bg-muted/80" />
        </div>
        <div className="h-6 w-14 rounded-full bg-muted" />
      </div>
      <dl className="ticket-mobile-card__meta">
        <div className="h-10 rounded-md bg-muted/70" />
        <div className="h-10 rounded-md bg-muted/70" />
        <div className="h-10 rounded-md bg-muted/70" />
        <div className="ticket-mobile-card__meta-item--full h-10 rounded-md bg-muted/70" />
      </dl>
      <div className="ticket-mobile-card__actions">
        <div className="h-9 flex-1 rounded-md bg-muted" />
        <div className="h-9 flex-1 rounded-md bg-muted" />
        <div className="h-9 w-10 rounded-md bg-muted" />
      </div>
    </Card>
  )
}
