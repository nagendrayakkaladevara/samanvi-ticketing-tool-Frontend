import { useMemo, useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import {
  CalendarDays,
  CircleCheck,
  CircleSlash,
  Clock3,
  KeyRound,
  Eye,
  EyeOff,
  Fingerprint,
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
import { Textarea } from '@/components/ui/textarea'
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

function passwordStrength(password: string) {
  if (!password) return { score: 0, label: 'Not entered', tone: 'bg-muted' }
  let score = 0
  if (password.length >= 10) score += 1
  if (password.length >= 12) score += 1
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score += 1
  if (/\d/.test(password) && /[^A-Za-z0-9]/.test(password)) score += 1
  if (score <= 1) return { score: 1, label: 'Weak', tone: 'bg-destructive' }
  if (score === 2) return { score, label: 'Fair', tone: 'bg-amber-500' }
  if (score === 3) return { score, label: 'Good', tone: 'bg-sky-500' }
  return { score, label: 'Strong', tone: 'bg-emerald-500' }
}

type AccountAction = 'status' | 'device' | 'delete'

type ActionRequest = {
  kind: AccountAction
  user: MobileDriverUser
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'DU'
}

function actionCopy(request: ActionRequest) {
  if (request.kind === 'device') return {
    eyebrow: 'Device access',
    title: `Reset ${request.user.displayName}'s device?`,
    description: 'The linked phone will be removed and every active mobile session will be signed out.',
    label: 'Reset device',
    placeholder: 'For example: Driver received a replacement phone',
    destructive: false,
  }
  if (request.kind === 'delete') return {
    eyebrow: 'Delete account',
    title: `Delete ${request.user.displayName}'s login?`,
    description: 'This account will be soft-deleted and all active sessions will be revoked immediately.',
    label: 'Delete account',
    placeholder: 'For example: Driver no longer works on this route',
    destructive: true,
  }
  const deactivating = request.user.isActive
  return {
    eyebrow: deactivating ? 'Suspend access' : 'Restore access',
    title: `${deactivating ? 'Deactivate' : 'Activate'} ${request.user.displayName}?`,
    description: deactivating
      ? 'The driver will be signed out and unable to use the mobile app until the account is activated again.'
      : 'The driver will be allowed to sign in to the mobile app again.',
    label: deactivating ? 'Deactivate account' : 'Activate account',
    placeholder: deactivating ? 'For example: Driver is temporarily off duty' : 'For example: Driver has returned to duty',
    destructive: deactivating,
  }
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
  const [showPassword, setShowPassword] = useState(false)
  const strength = passwordStrength(password)
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
      <DialogContent className="grid max-h-[calc(100svh-1rem)] w-[calc(100%-1rem)] grid-rows-[auto_minmax(0,1fr)_auto] gap-0 overflow-hidden p-0 sm:max-h-[90svh] sm:max-w-lg">
        <div className="border-b bg-gradient-to-br from-primary/10 via-background to-background px-5 py-5 sm:px-6 sm:py-6">
          <div className="mb-4 flex size-11 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
            <KeyRound className="size-5" />
          </div>
          <DialogHeader>
            <DialogTitle className="text-xl">{user ? 'Edit mobile account' : 'Create driver login'}</DialogTitle>
            <DialogDescription>
              {user ? 'Changing the password signs the driver out immediately.' : 'The device is linked automatically on the first successful login.'}
            </DialogDescription>
          </DialogHeader>
        </div>
        <div className="min-h-0 space-y-5 overflow-y-auto overscroll-contain px-5 py-5 sm:px-6 sm:py-6">
          <label className="block space-y-2 text-sm font-medium">Driver name
            <Input autoFocus value={displayName} maxLength={100} onChange={(event) => setDisplayName(event.target.value)} placeholder="e.g. Ravi Kumar" />
          </label>
          <label className="block space-y-2 text-sm font-medium">Username
            <Input autoCapitalize="none" value={username} maxLength={50} onChange={(event) => setUsername(event.target.value)} placeholder="e.g. driver.ravi" />
          </label>
          <div className="space-y-2">
            <label className="block text-sm font-medium" htmlFor="mobile-user-password">{user ? 'New password (optional)' : 'Temporary password'}</label>
            <div className="relative">
              <Input id="mobile-user-password" className="pr-11" type={showPassword ? 'text' : 'password'} value={password} maxLength={128} onChange={(event) => setPassword(event.target.value)} placeholder="At least 10 characters" />
              <button type="button" className="absolute right-1 top-1 flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" aria-label={showPassword ? 'Hide password' : 'Show password'} onClick={() => setShowPassword((current) => !current)}>
                {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
            {(password || !user) ? (
              <div className="space-y-2" aria-live="polite">
                <div className="flex gap-1.5" aria-label={`Password strength: ${strength.label}`}>
                  {[1, 2, 3, 4].map((step) => <span key={step} className={cn('h-1.5 flex-1 rounded-full transition-colors', step <= strength.score ? strength.tone : 'bg-muted')} />)}
                </div>
                <div className="flex items-start justify-between gap-3 text-xs">
                  <span className="text-muted-foreground">Use 10+ characters; uppercase, number and symbol improve strength.</span>
                  <span className="shrink-0 font-semibold text-foreground">{strength.label}</span>
                </div>
              </div>
            ) : <p className="text-xs text-muted-foreground">Leave blank to keep the current password.</p>}
          </div>
          <div className="flex gap-3 rounded-xl border bg-muted/40 p-3 text-xs leading-5 text-muted-foreground">
            <ShieldCheck className="mt-0.5 size-4 shrink-0" />
            Passwords are hashed by the backend and are never shown again.
          </div>
        </div>
        <DialogFooter className="border-t bg-background px-5 py-4 sm:px-6">
          <Button className="w-full sm:w-auto" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button className="w-full sm:w-auto" disabled={!valid || mutation.isPending} onClick={() => mutation.mutate()}>
            {mutation.isPending ? <LoaderCircle className="animate-spin" /> : <LockKeyhole />}
            {user ? 'Save changes' : 'Create login'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function ReasonDialog({
  request,
  pending,
  onOpenChange,
  onConfirm,
}: {
  request: ActionRequest | null
  pending: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: (reason: string) => void
}) {
  const [reason, setReason] = useState('')
  if (!request) return null
  const copy = actionCopy(request)
  const valid = reason.trim().length >= 3

  return (
    <AlertDialog open onOpenChange={(open) => !pending && onOpenChange(open)}>
      <AlertDialogContent className="w-[calc(100%-1.5rem)] max-w-md overflow-hidden p-0">
        <div className={cn('h-1.5 w-full', copy.destructive ? 'bg-destructive' : 'bg-primary')} />
        <div className="px-5 pt-5 sm:px-6 sm:pt-6">
          <div className={cn('mb-4 flex size-11 items-center justify-center rounded-xl', copy.destructive ? 'bg-destructive/10 text-destructive' : 'bg-primary/10 text-primary')}>
            {request.kind === 'device' ? <Smartphone className="size-5" /> : request.kind === 'delete' ? <Trash2 className="size-5" /> : <Power className="size-5" />}
          </div>
          <AlertDialogHeader>
            <p className={cn('text-xs font-bold uppercase tracking-[0.18em]', copy.destructive ? 'text-destructive' : 'text-primary')}>{copy.eyebrow}</p>
            <AlertDialogTitle>{copy.title}</AlertDialogTitle>
            <AlertDialogDescription className="leading-6">{copy.description}</AlertDialogDescription>
          </AlertDialogHeader>
        </div>
        <div className="space-y-2 px-5 sm:px-6">
          <label className="text-sm font-semibold" htmlFor="mobile-user-action-reason">Reason</label>
          <Textarea
            id="mobile-user-action-reason"
            autoFocus
            className="min-h-24 resize-none"
            maxLength={300}
            placeholder={copy.placeholder}
            value={reason}
            onChange={(event) => setReason(event.target.value)}
          />
          <div className="flex justify-between gap-3 text-xs text-muted-foreground">
            <span>Required · minimum 3 characters</span>
            <span>{reason.length}/300</span>
          </div>
        </div>
        <AlertDialogFooter className="gap-2 border-t bg-muted/30 px-5 py-4 sm:px-6">
          <AlertDialogCancel className="w-full sm:w-auto" disabled={pending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            className={cn('w-full sm:w-auto', copy.destructive && 'bg-destructive text-destructive-foreground hover:bg-destructive/90')}
            disabled={!valid || pending}
            onClick={(event) => {
              event.preventDefault()
              onConfirm(reason.trim())
            }}
          >
            {pending ? <LoaderCircle className="animate-spin" /> : null}
            {copy.label}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

export function MobileUsersPanel() {
  const { can } = usePermissions()
  const [search, setSearch] = useState('')
  const [creating, setCreating] = useState(false)
  const [editing, setEditing] = useState<MobileDriverUser | null>(null)
  const [actionRequest, setActionRequest] = useState<ActionRequest | null>(null)
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
      setActionRequest(null)
    },
    onError: (error) => toast.error(message(error)),
  })

  return (
    <Card className="audio-surface overflow-hidden rounded-2xl">
      <CardHeader className="border-b bg-gradient-to-br from-primary/[0.07] via-background to-background px-5 py-6 sm:px-7">
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
          <div>
            <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-primary"><Smartphone className="size-4" /> Controlled access</div>
            <CardTitle className="text-xl">Driver mobile accounts</CardTitle>
            <p className="mt-1.5 max-w-xl text-sm leading-6 text-muted-foreground">One account, one authorized phone. Deactivation, password changes, and device resets revoke active sessions.</p>
          </div>
          {can('announcements', 'mobile_users', 'create') ? <Button className="h-11 w-full shadow-sm sm:w-auto" onClick={() => setCreating(true)}><Plus /> Create login</Button> : null}
        </div>
      </CardHeader>
      <CardContent className="p-5 sm:p-7">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1"><Search className="absolute left-3.5 top-3.5 size-4 text-muted-foreground" /><Input className="h-11 pl-10" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search driver name or username" /></div>
          <Button className="h-11 w-full sm:w-auto" variant="outline" onClick={() => query.refetch()} disabled={query.isFetching}><RefreshCcw className={cn(query.isFetching && 'animate-spin')} /> Refresh</Button>
        </div>

        {query.isLoading ? <div className="flex min-h-64 items-center justify-center"><LoaderCircle className="size-6 animate-spin text-amber-500" /></div> : null}
        {query.isError ? <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">{message(query.error)}</div> : null}
        {!query.isLoading && !items.length ? <div className="flex min-h-64 flex-col items-center justify-center rounded-2xl border border-dashed text-center"><UserRound className="mb-4 size-8 text-muted-foreground" /><p className="font-semibold">No mobile accounts found</p><p className="mt-1 text-sm text-muted-foreground">Create the first driver login or change your search.</p></div> : null}

        <div className="grid gap-5 xl:grid-cols-2">
          {items.map((user) => (
            <article key={user.id} className={cn('group relative overflow-hidden rounded-2xl border bg-card shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg', user.isActive ? 'border-emerald-500/20' : 'border-border')}>
              <div className={cn('absolute inset-y-0 left-0 w-1', user.isActive ? 'bg-emerald-500' : 'bg-muted-foreground/35')} />
              <div className="p-4 pl-5 sm:p-5 sm:pl-6">
                <div className="flex min-w-0 items-start gap-3 sm:gap-4">
                  <div className={cn('relative flex size-12 shrink-0 items-center justify-center rounded-2xl text-sm font-black tracking-tight sm:size-14 sm:text-base', user.isActive ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300' : 'bg-muted text-muted-foreground')}>
                    {initials(user.displayName)}
                    <span className={cn('absolute -bottom-1 -right-1 size-3.5 rounded-full border-[3px] border-card', user.isActive ? 'bg-emerald-500' : 'bg-muted-foreground/50')} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <h3 className="truncate text-base font-bold tracking-tight sm:text-lg">{user.displayName}</h3>
                        <p className="mt-0.5 truncate text-sm text-muted-foreground">@{user.username}</p>
                      </div>
                      <span className={cn('inline-flex w-fit items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em]', user.isActive ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300' : 'bg-muted text-muted-foreground')}>
                        {user.isActive ? <CircleCheck className="size-3" /> : <CircleSlash className="size-3" />}
                        {user.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-5 grid grid-cols-2 gap-2">
                  <div className="rounded-xl border bg-muted/25 px-3 py-2.5">
                    <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground"><Fingerprint className="size-3.5" /> Driver ID</p>
                    <p className="mt-1 truncate text-sm font-semibold">{user.driver?.driverIdNumber || 'Not linked'}</p>
                  </div>
                  <div className="rounded-xl border bg-muted/25 px-3 py-2.5">
                    <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground"><CalendarDays className="size-3.5" /> Created</p>
                    <p className="mt-1 truncate text-sm font-semibold">{new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(new Date(user.createdAt))}</p>
                  </div>
                </div>

                <div className={cn('mt-3 rounded-xl border p-3.5', user.device ? 'border-sky-500/20 bg-sky-500/[0.05]' : 'border-dashed bg-muted/20')}>
                  {user.device ? (
                    <div className="flex min-w-0 items-start gap-3">
                      <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-sky-500/10 text-sky-700 dark:text-sky-300"><Smartphone className="size-4" /></div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-col gap-0.5 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
                          <p className="truncate text-sm font-semibold">{user.device.deviceName || user.device.platform || 'Registered device'}</p>
                          <p className="flex shrink-0 items-center gap-1 text-[11px] text-muted-foreground"><Clock3 className="size-3" /> {formatDate(user.device.lastSeenAt)}</p>
                        </div>
                        <p className="mt-1 truncate text-xs text-muted-foreground">{[user.device.platform, user.device.osVersion, user.device.appVersion && `App ${user.device.appVersion}`].filter(Boolean).join(' · ') || 'Device details unavailable'}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 text-muted-foreground"><div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted"><Smartphone className="size-4" /></div><div><p className="text-sm font-semibold text-foreground">Waiting for first login</p><p className="text-xs">No phone has been registered yet.</p></div></div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-1 border-t bg-muted/20 p-2 sm:flex sm:flex-wrap sm:justify-end">
                {can('announcements', 'mobile_users', 'edit') ? <Button variant="ghost" className="h-10 justify-start px-3 sm:justify-center" onClick={() => setEditing(user)}><Pencil /> Edit</Button> : null}
                {user.device && can('announcements', 'mobile_users', 'reset_device') ? <Button variant="ghost" className="h-10 justify-start px-3 sm:justify-center" disabled={action.isPending} onClick={() => setActionRequest({ kind: 'device', user })}><RefreshCcw /> Reset device</Button> : null}
                {can('announcements', 'mobile_users', 'change_status') ? <Button variant="ghost" className={cn('h-10 justify-start px-3 sm:justify-center', !user.isActive && 'text-emerald-700 hover:text-emerald-700 dark:text-emerald-300')} disabled={action.isPending} onClick={() => setActionRequest({ kind: 'status', user })}><Power /> {user.isActive ? 'Deactivate' : 'Activate'}</Button> : null}
                {can('announcements', 'mobile_users', 'delete') ? <Button variant="ghost" className="h-10 justify-start px-3 text-destructive hover:text-destructive sm:justify-center" disabled={action.isPending} onClick={() => setActionRequest({ kind: 'delete', user })}><Trash2 /> Delete</Button> : null}
              </div>
            </article>
          ))}
        </div>
      </CardContent>
      {creating ? <AccountDialog open onOpenChange={setCreating} /> : null}
      {editing ? <AccountDialog key={editing.id} user={editing} open onOpenChange={(open) => !open && setEditing(null)} /> : null}
      <ReasonDialog
        key={actionRequest ? `${actionRequest.kind}-${actionRequest.user.id}` : 'closed'}
        request={actionRequest}
        pending={action.isPending}
        onOpenChange={(open) => !open && setActionRequest(null)}
        onConfirm={(reason) => actionRequest && action.mutate({ ...actionRequest, reason })}
      />
    </Card>
  )
}
