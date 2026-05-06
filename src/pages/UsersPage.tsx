import { useMemo, useState, type FormEvent } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Eye, EyeOff, Loader2, Pencil, Trash2, UserPlus, Users } from 'lucide-react'
import { toast } from '@/lib/toast'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
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
import { usersService } from '@/features/users/api/users.service'
import { useUsersQuery } from '@/features/users/hooks/use-users-query'
import type { AppUser, CreateUserInput, UpdateUserInput } from '@/features/users/types/user'
import { useCurrentUser } from '@/hooks/use-current-user'
import { queryClient } from '@/lib/query/query-client'

type UserFormMode = 'create' | 'edit'
type RoleOption = CreateUserInput['roleCode']

type UserFormValues = {
  username: string
  displayName: string
  email: string
  password: string
  roleCode: RoleOption
  isActive: boolean
}

const roleOptions: Array<{ label: string; value: RoleOption }> = [
  { label: 'Admin', value: 'admin' },
  { label: 'Supervisor', value: 'supervisor' },
  { label: 'Worker', value: 'worker' },
]

function getDefaultValues(): UserFormValues {
  return {
    username: '',
    displayName: '',
    email: '',
    password: '',
    roleCode: 'worker',
    isActive: true,
  }
}

function getValuesFromUser(user: AppUser): UserFormValues {
  return {
    username: user.username,
    displayName: user.displayName,
    email: user.email ?? '',
    password: '',
    roleCode: user.role.toLowerCase() as RoleOption,
    isActive: user.isActive,
  }
}

function validateUserForm(values: UserFormValues, mode: UserFormMode): string | null {
  if (!values.username.trim()) return 'Username is required.'
  if (!values.displayName.trim()) return 'Name is required.'
  if (mode === 'create' && !values.password.trim()) return 'Password is required.'
  if (values.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) {
    return 'Please provide a valid email address.'
  }

  return null
}

export function UsersPage() {
  const currentUser = useCurrentUser()
  const { data: users = [], isLoading, isError, isFetching, error } = useUsersQuery()

  const [isFormOpen, setIsFormOpen] = useState(false)
  const [formMode, setFormMode] = useState<UserFormMode>('create')
  const [editingUser, setEditingUser] = useState<AppUser | null>(null)
  const [values, setValues] = useState<UserFormValues>(getDefaultValues())
  const [isPasswordVisible, setIsPasswordVisible] = useState(true)
  const [deleteTarget, setDeleteTarget] = useState<AppUser | null>(null)

  const sortedUsers = useMemo(
    () => [...users].sort((a, b) => Number(b.isActive) - Number(a.isActive) || a.displayName.localeCompare(b.displayName)),
    [users],
  )

  const createMutation = useMutation({
    mutationFn: (payload: CreateUserInput) => usersService.create(payload),
    onSuccess: () => {
      toast.success('User created successfully.')
      queryClient.invalidateQueries({ queryKey: ['users'] })
      setIsFormOpen(false)
      setValues(getDefaultValues())
    },
    onError: (mutationError) => {
      toast.error(mutationError instanceof Error ? mutationError.message : 'Failed to create user.')
    },
  })

  const updateMutation = useMutation({
    mutationFn: (payload: UpdateUserInput) => usersService.update(payload),
    onSuccess: () => {
      toast.success('User updated successfully.')
      queryClient.invalidateQueries({ queryKey: ['users'] })
      setIsFormOpen(false)
      setEditingUser(null)
      setValues(getDefaultValues())
    },
    onError: (mutationError) => {
      toast.error(mutationError instanceof Error ? mutationError.message : 'Failed to update user.')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (userId: string) => usersService.remove(userId),
    onSuccess: () => {
      toast.success('User deleted successfully.')
      queryClient.invalidateQueries({ queryKey: ['users'] })
      setDeleteTarget(null)
    },
    onError: (mutationError) => {
      toast.error(mutationError instanceof Error ? mutationError.message : 'Failed to delete user.')
    },
  })

  const isSaving = createMutation.isPending || updateMutation.isPending

  const openCreateForm = () => {
    setFormMode('create')
    setEditingUser(null)
    setValues(getDefaultValues())
    setIsPasswordVisible(true)
    setIsFormOpen(true)
  }

  const openEditForm = (user: AppUser) => {
    setFormMode('edit')
    setEditingUser(user)
    setValues(getValuesFromUser(user))
    setIsPasswordVisible(true)
    setIsFormOpen(true)
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const validationError = validateUserForm(values, formMode)
    if (validationError) {
      toast.error(validationError)
      return
    }

    if (formMode === 'create') {
      createMutation.mutate({
        username: values.username.trim(),
        displayName: values.displayName.trim(),
        password: values.password.trim(),
        roleCode: values.roleCode,
        isActive: values.isActive,
        ...(values.email.trim() ? { email: values.email.trim() } : {}),
      })
      return
    }

    if (!editingUser) {
      toast.error('Unable to identify the selected user.')
      return
    }

    updateMutation.mutate({
      userId: editingUser.id,
      username: values.username.trim(),
      displayName: values.displayName.trim(),
      roleCode: values.roleCode,
      isActive: values.isActive,
      email: values.email.trim() ? values.email.trim() : null,
      ...(values.password.trim() ? { password: values.password.trim() } : {}),
    })
  }

  const confirmDelete = () => {
    if (!deleteTarget) return
    deleteMutation.mutate(deleteTarget.id)
  }

  if (currentUser?.role !== 'ADMIN') {
    return (
      <section className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Users</h1>
        <p className="text-sm text-muted-foreground">You do not have permission to manage users.</p>
      </section>
    )
  }

  return (
    <section className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">Users</h1>
          <p className="text-sm text-muted-foreground">Create, update, and manage user access in one place.</p>
        </div>
        <div className="flex w-full items-stretch gap-2 sm:w-auto sm:items-center">
          {isFetching && !isLoading ? <span className="text-xs text-muted-foreground">Refreshing...</span> : null}
          <Button onClick={openCreateForm} className="w-full sm:w-auto">
            <UserPlus className="h-4 w-4" />
            Create User
          </Button>
        </div>
      </header>

      {isLoading ? (
        <Card className="space-y-3 p-4">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-10 w-full" />
          ))}
        </Card>
      ) : null}

      {isError ? (
        <Card className="p-5">
          <p className="font-medium text-destructive">Failed to load users</p>
          <p className="mt-1 text-sm text-muted-foreground">{(error as Error)?.message ?? 'Unexpected error occurred.'}</p>
        </Card>
      ) : null}

      {!isLoading && !isError && sortedUsers.length === 0 ? (
        <Card className="flex flex-col items-center justify-center gap-2 p-10 text-center">
          <Users className="h-8 w-8 text-muted-foreground" />
          <h2 className="text-lg font-semibold">No users found</h2>
          <p className="max-w-md text-sm text-muted-foreground">
            There are no users available yet. Create your first user to get started.
          </p>
        </Card>
      ) : null}

      {!isLoading && !isError && sortedUsers.length > 0 ? (
        <Card className="overflow-x-auto">
          <table className="w-full min-w-[760px] border-collapse text-sm">
            <thead>
              <tr className="border-b bg-muted/30 text-left">
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Username</th>
                <th className="hidden px-4 py-3 font-medium md:table-cell">Email</th>
                <th className="px-4 py-3 font-medium">Role</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {sortedUsers.map((user) => (
                <tr key={user.id} className="border-b last:border-b-0">
                  <td className="px-4 py-3 font-medium">{user.displayName}</td>
                  <td className="px-4 py-3">{user.username}</td>
                  <td className="hidden px-4 py-3 text-muted-foreground md:table-cell">{user.email ?? '-'}</td>
                  <td className="px-4 py-3">{user.role}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                        user.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {user.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="outline" size="sm" onClick={() => openEditForm(user)}>
                        <Pencil className="h-3.5 w-3.5" />
                        Edit
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        className="border-red-600 bg-red-600 text-white hover:bg-red-700"
                        onClick={() => setDeleteTarget(user)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Delete
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      ) : null}

      <Sheet open={isFormOpen} onOpenChange={setIsFormOpen}>
        <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-xl">
          <SheetHeader>
            <SheetTitle>{formMode === 'create' ? 'Create User' : 'Edit User'}</SheetTitle>
            <SheetDescription>
              {formMode === 'create'
                ? 'Add a new user and assign the appropriate role.'
                : 'Update user details, role, and account state.'}
            </SheetDescription>
          </SheetHeader>

          <form className="mt-6 space-y-4" onSubmit={handleSubmit} autoComplete="off">
            <div className="space-y-2">
              <Label htmlFor="displayName">Name</Label>
              <Input
                id="displayName"
                value={values.displayName}
                onChange={(event) => setValues((prev) => ({ ...prev, displayName: event.target.value }))}
                disabled={isSaving}
                autoComplete="off"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                value={values.username}
                onChange={(event) => setValues((prev) => ({ ...prev, username: event.target.value }))}
                disabled={isSaving}
                autoComplete="off"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email (Optional)</Label>
              <Input
                id="email"
                type="email"
                value={values.email}
                onChange={(event) => setValues((prev) => ({ ...prev, email: event.target.value }))}
                disabled={isSaving}
                autoComplete="off"
                placeholder="name@example.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="roleCode">Role</Label>
              <Select
                value={values.roleCode}
                onValueChange={(value) => setValues((prev) => ({ ...prev, roleCode: value as RoleOption }))}
                disabled={isSaving}
              >
                <SelectTrigger id="roleCode">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  {roleOptions.map((role) => (
                    <SelectItem key={role.value} value={role.value}>
                      {role.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">{formMode === 'create' ? 'Password' : 'Password (Optional)'}</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={isPasswordVisible ? 'text' : 'password'}
                  value={values.password}
                  onChange={(event) => setValues((prev) => ({ ...prev, password: event.target.value }))}
                  disabled={isSaving}
                  autoComplete="new-password"
                  className="pr-10"
                  placeholder={formMode === 'create' ? 'Enter password' : 'Leave blank to keep unchanged'}
                  required={formMode === 'create'}
                />
                <button
                  type="button"
                  onClick={() => setIsPasswordVisible((prev) => !prev)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground disabled:cursor-not-allowed"
                  disabled={isSaving}
                  aria-label={isPasswordVisible ? 'Hide password' : 'Show password'}
                >
                  {isPasswordVisible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2 rounded-md border p-3">
              <input
                id="isActive"
                type="checkbox"
                className="h-4 w-4"
                checked={values.isActive}
                onChange={(event) => setValues((prev) => ({ ...prev, isActive: event.target.checked }))}
                disabled={isSaving}
              />
              <Label htmlFor="isActive" className="cursor-pointer">
                Account is active
              </Label>
            </div>

            <SheetFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsFormOpen(false)}
                disabled={isSaving}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {formMode === 'create' ? 'Create User' : 'Save Changes'}
              </Button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>

      <AlertDialog open={Boolean(deleteTarget)} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete user?</AlertDialogTitle>
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
