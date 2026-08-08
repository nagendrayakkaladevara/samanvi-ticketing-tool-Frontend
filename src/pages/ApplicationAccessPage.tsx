import { useMemo, useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { KeyRound, Loader2, ShieldCheck, UserPlus, Users } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { applicationUsersService } from '@/features/application-users/api/application-users.service'
import {
  applicationUserDataColumnDefs,
  applicationUserMobileBadge,
  applicationUserMobileFields,
} from '@/features/application-users/components/application-users-grid-columns'
import {
  ApplicationUserMobileCard,
  ApplicationUserMobileCardSkeleton,
} from '@/features/application-users/components/application-user-mobile-card'
import { useApplicationUsersQuery } from '@/features/application-users/hooks/use-application-users-query'
import type { ApplicationUser } from '@/features/application-users/types/application-user'
import { applicationAccessRoutes } from '@/features/application-users/utils/application-access-routes'
import { EmployeesGrid } from '@/features/employees/components/employees-grid'
import { usePermissions } from '@/hooks/use-permissions'
import { queryClient } from '@/lib/query/query-client'
import { toast } from '@/lib/toast'

export function ApplicationAccessPage() {
  const navigate = useNavigate()
  const { has, can } = usePermissions()
  const canView = has('users', '', 'view')
  const canCreate = can('users', '', 'create')
  const canEdit = can('users', '', 'edit')
  const canDelete = can('users', '', 'delete')
  const { data: users = [], isLoading, isError, isFetching, error } = useApplicationUsersQuery()
  const [deleteTarget, setDeleteTarget] = useState<ApplicationUser | null>(null)

  const sortedUsers = useMemo(
    () =>
      [...users].sort(
        (a, b) => Number(b.isActive) - Number(a.isActive) || a.displayName.localeCompare(b.displayName),
      ),
    [users],
  )

  const deleteMutation = useMutation({
    mutationFn: (userId: string) => applicationUsersService.remove(userId),
    onSuccess: () => {
      toast.success('Application user deleted successfully.')
      queryClient.invalidateQueries({ queryKey: ['application-users'] })
      setDeleteTarget(null)
    },
    onError: (mutationError) => {
      toast.error(mutationError instanceof Error ? mutationError.message : 'Failed to delete application user.')
    },
  })

  const confirmDelete = () => {
    if (!deleteTarget) return
    deleteMutation.mutate(deleteTarget.id)
  }

  if (!canView) {
    return (
      <section className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Application Access</h1>
        <p className="text-sm text-muted-foreground">You do not have permission to manage application users.</p>
      </section>
    )
  }

  return (
    <section className="space-y-6">
      <header className="relative overflow-hidden rounded-xl border bg-gradient-to-br from-card via-card to-primary/5 p-5 sm:p-6">
        <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-primary/10 blur-2xl" />
        <div className="relative flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full border bg-background/80 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur">
              <ShieldCheck className="h-3.5 w-3.5 text-primary" />
              Admin only
            </div>
            <div className="space-y-1">
              <h1 className="text-2xl font-semibold tracking-tight">Application Access</h1>
              <p className="max-w-2xl text-sm text-muted-foreground">
                Provision login accounts for supervisors, staff, and field roles. Each user signs in with a unique username.
              </p>
            </div>
          </div>
          <div className="flex w-full items-stretch gap-2 sm:w-auto sm:items-center">
            {isFetching && !isLoading ? <span className="text-xs text-muted-foreground">Refreshing...</span> : null}
            {canCreate ? (
              <Button asChild className="w-full sm:w-auto">
                <Link to={applicationAccessRoutes.create}>
                  <UserPlus className="h-4 w-4" />
                  Create User
                </Link>
              </Button>
            ) : null}
          </div>
        </div>
      </header>

      <EmployeesGrid
        items={sortedUsers}
        dataColumnDefs={applicationUserDataColumnDefs}
        mobileBadge={applicationUserMobileBadge}
        mobileFields={applicationUserMobileFields}
        renderMobileCard={(user, index) => (
          <ApplicationUserMobileCard
            user={user}
            canEdit={canEdit}
            canDelete={canDelete}
            animationDelay={index * 0.05}
            onView={() => navigate(applicationAccessRoutes.view(user.id))}
            onEdit={() => navigate(applicationAccessRoutes.edit(user.id))}
            onDelete={() => setDeleteTarget(user)}
          />
        )}
        renderMobileSkeleton={() => <ApplicationUserMobileCardSkeleton />}
        isLoading={isLoading}
        isError={isError}
        error={error as Error | null}
        emptyIcon={<KeyRound className="ticket-grid-empty__icon" strokeWidth={1.2} />}
        emptyTitle="No application users yet"
        emptyDescription="Create the first application user to grant secure access to modules based on role permissions."
        canEdit={canEdit}
        canDelete={canDelete}
        onAdd={canCreate ? () => navigate(applicationAccessRoutes.create) : undefined}
        emptyAddLabel="Create First User"
        onView={(user) => navigate(applicationAccessRoutes.view(user.id))}
        onEdit={(user) => navigate(applicationAccessRoutes.edit(user.id))}
        onDelete={setDeleteTarget}
        skeletonColumnCount={9}
      />

      {!isLoading && !isError && sortedUsers.length > 0 ? (
        <p className="flex items-center gap-2 text-xs text-muted-foreground">
          <Users className="h-3.5 w-3.5" />
          {sortedUsers.length} application user{sortedUsers.length === 1 ? '' : 's'} registered
        </p>
      ) : null}

      <AlertDialog open={Boolean(deleteTarget)} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete application user?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget
                ? `This will permanently remove ${deleteTarget.displayName}. This action cannot be undone.`
                : 'This action cannot be undone.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="border-red-600 bg-red-600 text-white hover:bg-red-700"
              onClick={confirmDelete}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  )
}
