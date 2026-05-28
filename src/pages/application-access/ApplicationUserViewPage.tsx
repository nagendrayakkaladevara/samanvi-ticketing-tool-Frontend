import { ArrowLeft, KeyRound, Pencil, Shield } from 'lucide-react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'

import { MasterDetailGrid } from '@/components/master-detail-grid'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { PermissionSummaryReadonly } from '@/features/application-users/components/permission-summary-readonly'
import { useApplicationUserQuery } from '@/features/application-users/hooks/use-application-user-query'
import { usePermissionsQuery } from '@/features/application-users/hooks/use-permissions-query'
import { applicationUserTypeLabels } from '@/features/application-users/types/application-user'
import { applicationAccessRoutes } from '@/features/application-users/utils/application-access-routes'
import { usePermissions } from '@/hooks/use-permissions'
import { cn } from '@/lib/utils'

function DetailItem({
  label,
  value,
  className,
}: {
  label: string
  value: string
  className?: string
}) {
  return (
    <div className={cn('space-y-1 rounded-lg border bg-muted/20 px-3 py-2.5', className)}>
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="text-sm font-medium text-foreground">{value}</p>
    </div>
  )
}

export function ApplicationUserViewPage() {
  const navigate = useNavigate()
  const { userId } = useParams()
  const { has, can } = usePermissions()
  const canView = has('users', '', 'view')
  const canEdit = can('users', '', 'edit')

  const {
    data: user,
    isLoading: isUserLoading,
    isError: isUserError,
    error: userError,
  } = useApplicationUserQuery(userId)

  const {
    data: permissionsCatalog,
    isLoading: isPermissionsLoading,
    isError: isPermissionsError,
    error: permissionsError,
  } = usePermissionsQuery()

  const permissionTree = permissionsCatalog?.tree ?? []

  const isLoading = isUserLoading || isPermissionsLoading

  if (!canView) {
    return <Navigate to={applicationAccessRoutes.list} replace />
  }

  if (!userId) {
    return <Navigate to={applicationAccessRoutes.list} replace />
  }

  return (
    <section className="mx-auto w-full min-w-0 max-w-4xl space-y-5">
      <header className="space-y-3">
        <Button
          variant="ghost"
          className="-ml-2 h-9 w-fit px-2 sm:-ml-3 sm:px-4"
          onClick={() => navigate(applicationAccessRoutes.list)}
        >
          <ArrowLeft className="h-4 w-4 shrink-0" />
          <span className="sm:hidden">Back</span>
          <span className="hidden sm:inline">Back to application access</span>
        </Button>

        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 flex-1 items-start gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary shadow-sm sm:size-11">
              <KeyRound className="size-5" />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
                {user?.displayName ?? 'Application User'}
              </h1>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                {user
                  ? `Login account for ${applicationUserTypeLabels[user.userType] ?? user.userType}.`
                  : 'Full account details and permission overrides.'}
              </p>
            </div>
          </div>

          {user && canEdit ? (
            <Button
              variant="outline"
              size="icon"
              className="shrink-0"
              onClick={() => navigate(applicationAccessRoutes.edit(user.id))}
              aria-label="Edit application user"
            >
              <Pencil className="h-4 w-4" />
            </Button>
          ) : null}
        </div>
      </header>

      {isLoading ? (
        <Card className="space-y-4 p-5">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-10 w-full" />
          ))}
        </Card>
      ) : null}

      {isUserError ? (
        <Card className="p-5">
          <p className="font-medium text-destructive">Failed to load application user</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {(userError as Error)?.message ?? 'Unexpected error occurred.'}
          </p>
        </Card>
      ) : null}

      {isPermissionsError ? (
        <Card className="p-5">
          <p className="font-medium text-destructive">Failed to load permissions catalog</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {(permissionsError as Error)?.message ?? 'Unexpected error occurred.'}
          </p>
        </Card>
      ) : null}

      {!isLoading && !isUserError && !isPermissionsError && user ? (
        <div className="space-y-4 pb-6">
          <Card className="space-y-5 p-4 sm:p-5">
            <div>
              <h2 className="text-base font-semibold">Account details</h2>
              <p className="text-sm text-muted-foreground">Login credentials and role assignment.</p>
            </div>

            <MasterDetailGrid columns="threeColLg">
              <DetailItem label="Full Name" value={user.displayName} />
              <DetailItem label="Username" value={user.username || '—'} />
              <DetailItem label="Mobile Number" value={user.mobileNumber || '—'} />
              <DetailItem label="Email" value={user.email ?? '—'} />
              <DetailItem
                label="User Type"
                value={applicationUserTypeLabels[user.userType] ?? user.userType}
              />
              <DetailItem label="Status" value={user.isActive ? 'Active' : 'Inactive'} />
            </MasterDetailGrid>
          </Card>

          <Card className="space-y-5 p-4 sm:p-5">
            <div className="flex items-start gap-3">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Shield className="size-4" />
              </div>
              <div>
                <h2 className="text-base font-semibold">Permission overrides</h2>
                <p className="text-sm text-muted-foreground">
                  Direct permissions assigned on top of the {applicationUserTypeLabels[user.userType] ?? user.userType}{' '}
                  role template.
                </p>
              </div>
            </div>

            {user.userType === 'admin' ? (
              <div className="rounded-lg border border-dashed px-4 py-6 text-center text-sm text-muted-foreground">
                Admin accounts receive all permissions automatically.
              </div>
            ) : (
              <PermissionSummaryReadonly tree={permissionTree} selectedIds={user.permissionIds} />
            )}
          </Card>

          <div className="flex justify-end sm:hidden">
            <Button className="w-full" onClick={() => navigate(applicationAccessRoutes.edit(user.id))}>
              <Pencil className="h-4 w-4" />
              Edit User
            </Button>
          </div>
        </div>
      ) : null}
    </section>
  )
}
