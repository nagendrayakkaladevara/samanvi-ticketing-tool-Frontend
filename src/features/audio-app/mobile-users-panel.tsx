import { useMemo, useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import {
  KeyRound,
  LoaderCircle,
  LockKeyhole,
  Pencil,
  Plus,
  Power,
  RefreshCcw,
  Search,
  ShieldCheck,
  Smartphone,
  Trash2,
  UserRound,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { usePermissions } from '@/hooks/use-permissions'
import { ApiError } from '@/lib/api/api-error'
import { queryClient } from '@/lib/query/query-client'
import { toast } from '@/lib/toast'
import { cn } from '@/lib/utils'

import {
  createMobileUser,
  deleteMobileUser,
  listMobileUsers,
  mobileUserKeys,
  resetMobileUserDevice,
  setMobileUserStatus,
  updateMobileUser,
  type MobileDriverUser,
} from './mobile-users.service'

function message(error: unknown) {
  return error instanceof ApiError || error instanceof Error ? error.message : 'Something went wrong'
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))
}

function askReason(promptText: string): string | null {
  const reason = window.prompt(promptText)?.trim()
  if (reason === undefined) return null
  if (!reason || reason.length < 3) {
    toast.error('Please enter a reason with at least 3 characters')
    return null
  }
  return reason
}

function AccountDialog({
  user,
  open,
  onOpenChange,
}: {
  user?: MobileDriverUser
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const [displayName, setDisplayName] = useState(user?.displayName ?? '')
  const [username, setUsername] = useState(user?.username ?? '')
  const [password, setPassword] = useState('')
  const mutation = useMutation({
    mutationFn: () => user
      ? updateMobileUser(user.id, {
          displayName: displayName.trim(),
          username: username.trim(),
          ...(password ? { password } : {}),
        })
      : createMobileUser({ displayName: displayName.trim(), username: username.trim(), password }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: mobileUserKeys.all })
      toast.success(user ? 'Mobile account updated' : 'Mobile account created')
      onOpenChange(false)
    },
    onError: (error) => toast.error(message(error)),
  })
  const valid = displayName.trim().length > 0 && username.trim().length >= 3 && (user ? !password || password.length >= 10 : password.length >= 10)

  return (
    <Dialog open={open} onOpenChange={(next) => !mutation.isPending && onOpenChange(next)}>
      <DialogContent className="overflow-hidden p-0 sm:max-w-lg">
        <div className="border-b bg-slate-950 px-6 py-6 text-white">
          <div className="mb-4 flex size-11 items-center justify-center rounded-xl bg-amber-400 text-slate-950">
            <KeyRound className="size-5" />
          </div>
          <DialogHeader>
            <DialogTitle className="text-xl text-white">{user ? 'Edit mobile account' : 'Create driver login'}</DialogTitle>
            <DialogDescription className="text-slate-300">
              {user ? 'Changing the password signs the driver out immediately.' : 'The device is linked automatically on the first successful login.'}
            </DialogDescription>
          </DialogHeader>
        </div>
        <div className="space-y-5 px-6 py-6">
          <label className="block space-y-2 text-sm font-medium">Driver name
            <Input autoFocus value={displayName} maxLength={100} onChange={(event) => setDisplayName(event.target.value)} placeholder="e.g. Ravi Kumar" />
          </label>
          <label className="block space-y-2 text-sm font-medium">Username
            <Input autoCapitalize="none" value={username} maxLength={50} onChange={(event) => setUsername(event.target.value)} placeholder="e.g. driver.ravi" />
          </label>
          <label className="block space-y-2 text-sm font-medium">{user ? 'New password (optional)' : 'Temporary password'}
            <Input type="password" value={password} maxLength={128} onChange={(event) => setPassword(event.target.value)} placeholder="At least 10 characters" />
          </label>
          <div className="flex gap-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-900 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-200">
            <ShieldCheck className="mt-0.5 size-4 shrink-0" />
            Passwords are hashed by the backend and are never shown again.
          </div>
        </div>
        <DialogFooter className="border-t px-6 py-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button className="bg-slate-950 text-white hover:bg-slate-800" disabled={!valid || mutation.isPending} onClick={() => mutation.mutate()}>
            {mutation.isPending ? <LoaderCircle className="animate-spin" /> : <LockKeyhole />}
            {user ? 'Save changes' : 'Create login'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function MobileUsersPanel() {
  const { can } = usePermissions()
  const [search, setSearch] = useState('')
  const [creating, setCreating] = useState(false)
  const [editing, setEditing] = useState<MobileDriverUser | null>(null)
  const query = useQuery({ queryKey: mobileUserKeys.all, queryFn: () => listMobileUsers() })
  const items = useMemo(() => {
    const term = search.trim().toLowerCase()
    return (query.data ?? []).filter((user) => !term || [user.displayName, user.username, user.driver?.driverIdNumber ?? ''].some((value) => value.toLowerCase().includes(term)))
  }, [query.data, search])

  const action = useMutation({
    mutationFn: async (input: { kind: 'status' | 'device' | 'delete'; user: MobileDriverUser; reason: string }) => {
      if (input.kind === 'status') return setMobileUserStatus(input.user.id, !input.user.isActive, input.reason)
      if (input.kind === 'device') return resetMobileUserDevice(input.user.id, input.reason)
      return deleteMobileUser(input.user.id, input.reason)
    },
    onSuccess: async (_data, input) => {
      await queryClient.invalidateQueries({ queryKey: mobileUserKeys.all })
      toast.success(input.kind === 'device' ? 'Device unlinked and sessions revoked' : input.kind === 'delete' ? 'Mobile account deleted' : 'Account status updated')
    },
    onError: (error) => toast.error(message(error)),
  })

  function run(kind: 'status' | 'device' | 'delete', user: MobileDriverUser) {
    const reason = askReason(kind === 'device'
      ? `Why are you unlinking ${user.displayName}'s device?`
      : kind === 'delete'
        ? `Why are you deleting ${user.displayName}'s account?`
        : `Why are you ${user.isActive ? 'deactivating' : 'activating'} ${user.displayName}'s account?`)
    if (reason) action.mutate({ kind, user, reason })
  }

  return (
    <Card className="audio-surface overflow-hidden rounded-2xl">
      <CardHeader className="border-b bg-gradient-to-r from-slate-950 to-slate-900 px-5 py-6 text-white sm:px-7">
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
          <div>
            <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-amber-300"><Smartphone className="size-4" /> Controlled access</div>
            <CardTitle className="text-xl text-white">Driver mobile accounts</CardTitle>
            <p className="mt-1.5 max-w-xl text-sm leading-6 text-slate-300">One account, one authorized phone. Deactivation, password changes, and device resets revoke active sessions.</p>
          </div>
          {can('announcements', 'mobile_users', 'create') ? <Button className="h-11 bg-amber-400 text-slate-950 hover:bg-amber-300" onClick={() => setCreating(true)}><Plus /> Create login</Button> : null}
        </div>
      </CardHeader>
      <CardContent className="p-5 sm:p-7">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1"><Search className="absolute left-3.5 top-3.5 size-4 text-muted-foreground" /><Input className="h-11 pl-10" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search driver name or username" /></div>
          <Button className="h-11" variant="outline" onClick={() => query.refetch()} disabled={query.isFetching}><RefreshCcw className={cn(query.isFetching && 'animate-spin')} /> Refresh</Button>
        </div>

        {query.isLoading ? <div className="flex min-h-64 items-center justify-center"><LoaderCircle className="size-6 animate-spin text-amber-500" /></div> : null}
        {query.isError ? <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">{message(query.error)}</div> : null}
        {!query.isLoading && !items.length ? <div className="flex min-h-64 flex-col items-center justify-center rounded-2xl border border-dashed text-center"><UserRound className="mb-4 size-8 text-muted-foreground" /><p className="font-semibold">No mobile accounts found</p><p className="mt-1 text-sm text-muted-foreground">Create the first driver login or change your search.</p></div> : null}

        <div className="grid gap-4 xl:grid-cols-2">
          {items.map((user) => (
            <article key={user.id} className="rounded-2xl border bg-card p-5 shadow-sm transition-shadow hover:shadow-md">
              <div className="flex items-start gap-4">
                <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200"><UserRound className="size-5" /></div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2"><h3 className="truncate font-semibold">{user.displayName}</h3><span className={cn('rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide', user.isActive ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300')}>{user.isActive ? 'Active' : 'Inactive'}</span></div>
                  <p className="mt-1 text-sm text-muted-foreground">@{user.username}{user.driver ? ` · ${user.driver.driverIdNumber}` : ''}</p>
                </div>
              </div>
              <div className="mt-5 rounded-xl bg-muted/40 p-4">
                {user.device ? <div className="flex gap-3"><Smartphone className="mt-0.5 size-4 shrink-0 text-emerald-600" /><div><p className="text-sm font-medium">{user.device.deviceName || user.device.platform || 'Registered device'}</p><p className="mt-1 text-xs leading-5 text-muted-foreground">{[user.device.platform, user.device.osVersion, user.device.appVersion && `App ${user.device.appVersion}`].filter(Boolean).join(' · ')}<br />Last seen {formatDate(user.device.lastSeenAt)}</p></div></div> : <div className="flex gap-3 text-muted-foreground"><Smartphone className="size-4" /><p className="text-sm">No device registered yet</p></div>}
              </div>
              <div className="mt-4 flex flex-wrap justify-end gap-1 border-t pt-3">
                {can('announcements', 'mobile_users', 'edit') ? <Button variant="ghost" className="h-9" onClick={() => setEditing(user)}><Pencil /> Edit</Button> : null}
                {user.device && can('announcements', 'mobile_users', 'reset_device') ? <Button variant="ghost" className="h-9" disabled={action.isPending} onClick={() => run('device', user)}><RefreshCcw /> Reset device</Button> : null}
                {can('announcements', 'mobile_users', 'change_status') ? <Button variant="ghost" className="h-9" disabled={action.isPending} onClick={() => run('status', user)}><Power /> {user.isActive ? 'Deactivate' : 'Activate'}</Button> : null}
                {can('announcements', 'mobile_users', 'delete') ? <Button variant="ghost" className="h-9 text-destructive" disabled={action.isPending} onClick={() => run('delete', user)}><Trash2 /> Delete</Button> : null}
              </div>
            </article>
          ))}
        </div>
      </CardContent>
      {creating ? <AccountDialog open onOpenChange={setCreating} /> : null}
      {editing ? <AccountDialog key={editing.id} user={editing} open onOpenChange={(open) => !open && setEditing(null)} /> : null}
    </Card>
  )
}
