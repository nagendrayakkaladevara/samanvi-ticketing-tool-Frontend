import { useMemo, useState } from 'react'
import { KeyRound, ShieldCheck, UserPlus, Users } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { CreateApplicationUserSheet } from '@/features/application-users/components/create-application-user-sheet'
import { useApplicationUsersQuery } from '@/features/application-users/hooks/use-application-users-query'
import { applicationUserTypeLabels } from '@/features/application-users/types/application-user'
import { useCurrentUser } from '@/hooks/use-current-user'
import { cn } from '@/lib/utils'

export function ApplicationAccessPage() {
  const currentUser = useCurrentUser()
  const { data: users = [], isLoading, isError, isFetching, error } = useApplicationUsersQuery()
  const [isCreateOpen, setIsCreateOpen] = useState(false)

  const sortedUsers = useMemo(
    () =>
      [...users].sort(
        (a, b) => Number(b.isActive) - Number(a.isActive) || a.displayName.localeCompare(b.displayName),
      ),
    [users],
  )

  if (currentUser?.role !== 'ADMIN') {
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
                Provision login accounts for supervisors, staff, and field roles. Mobile number serves as the username.
              </p>
            </div>
          </div>
          <div className="flex w-full items-stretch gap-2 sm:w-auto sm:items-center">
            {isFetching && !isLoading ? <span className="text-xs text-muted-foreground">Refreshing...</span> : null}
            <Button onClick={() => setIsCreateOpen(true)} className="w-full sm:w-auto">
              <UserPlus className="h-4 w-4" />
              Create User
            </Button>
          </div>
        </div>
      </header>

      {isLoading ? (
        <Card className="space-y-3 p-4">
          {Array.from({ length: 5 }).map((_, index) => (
            <Skeleton key={index} className="h-10 w-full" />
          ))}
        </Card>
      ) : null}

      {isError ? (
        <Card className="p-5">
          <p className="font-medium text-destructive">Failed to load application users</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {(error as Error)?.message ?? 'Unexpected error occurred.'}
          </p>
        </Card>
      ) : null}

      {!isLoading && !isError && sortedUsers.length === 0 ? (
        <Card className="flex flex-col items-center justify-center gap-3 p-10 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
            <KeyRound className="h-7 w-7 text-primary" />
          </div>
          <div className="space-y-1">
            <h2 className="text-lg font-semibold">No application users yet</h2>
            <p className="max-w-md text-sm text-muted-foreground">
              Create the first application user to grant secure access to modules based on role permissions.
            </p>
          </div>
          <Button onClick={() => setIsCreateOpen(true)}>
            <UserPlus className="h-4 w-4" />
            Create First User
          </Button>
        </Card>
      ) : null}

      {!isLoading && !isError && sortedUsers.length > 0 ? (
        <>
          <div className="grid gap-3 md:hidden">
            {sortedUsers.map((user) => (
              <Card key={user.id} className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 space-y-1">
                    <p className="truncate font-medium">{user.displayName}</p>
                    <p className="text-sm text-muted-foreground">{user.mobileNumber}</p>
                  </div>
                  <span
                    className={cn(
                      'inline-flex shrink-0 rounded-full px-2 py-1 text-xs font-medium',
                      user.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-700',
                    )}
                  >
                    {user.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                  <span>{applicationUserTypeLabels[user.userType] ?? user.userType}</span>
                  {user.email ? <span>{user.email}</span> : null}
                </div>
              </Card>
            ))}
          </div>

          <Card className="hidden overflow-x-auto md:block">
            <table className="w-full min-w-[760px] border-collapse text-sm">
              <thead>
                <tr className="border-b bg-muted/30 text-left">
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Mobile</th>
                  <th className="px-4 py-3 font-medium">Email</th>
                  <th className="px-4 py-3 font-medium">User Type</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {sortedUsers.map((user) => (
                  <tr key={user.id} className="border-b transition-colors last:border-b-0 hover:bg-muted/40">
                    <td className="px-4 py-3 font-medium">{user.displayName}</td>
                    <td className="px-4 py-3">{user.mobileNumber}</td>
                    <td className="px-4 py-3 text-muted-foreground">{user.email ?? '—'}</td>
                    <td className="px-4 py-3">{applicationUserTypeLabels[user.userType] ?? user.userType}</td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          'inline-flex rounded-full px-2 py-1 text-xs font-medium',
                          user.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-700',
                        )}
                      >
                        {user.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>

          <p className="flex items-center gap-2 text-xs text-muted-foreground">
            <Users className="h-3.5 w-3.5" />
            {sortedUsers.length} application user{sortedUsers.length === 1 ? '' : 's'} registered
          </p>
        </>
      ) : null}

      <CreateApplicationUserSheet open={isCreateOpen} onOpenChange={setIsCreateOpen} />
    </section>
  )
}
