import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { useMutation } from '@tanstack/react-query'
import { ArrowLeft, Eye, EyeOff, KeyRound, Loader2, Shield } from 'lucide-react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { FormLabel } from '@/components/ui/form-label'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Switch } from '@/components/ui/switch'
import { applicationUsersService } from '@/features/application-users/api/application-users.service'
import { PermissionPicker } from '@/features/application-users/components/permission-picker'
import { useApplicationUserQuery } from '@/features/application-users/hooks/use-application-user-query'
import { usePermissionsQuery } from '@/features/application-users/hooks/use-permissions-query'
import {
  applicationUserTypeLabels,
  creatableUserTypeOptions,
  type CreateApplicationUserInput,
  type CreatableApplicationUserType,
  type UpdateApplicationUserInput,
} from '@/features/application-users/types/application-user'
import { applicationAccessRoutes } from '@/features/application-users/utils/application-access-routes'
import {
  filterPermissionTreeForOverrides,
  mergePermissionIdsForSave,
  partitionPermissionIds,
} from '@/features/application-users/utils/permission-ui-filters'
import { useCurrentUser } from '@/hooks/use-current-user'
import { queryClient } from '@/lib/query/query-client'
import { toast } from '@/lib/toast'

type FormMode = 'create' | 'edit'

type ApplicationUserFormValues = {
  fullName: string
  mobileNumber: string
  email: string
  password: string
  userType: CreatableApplicationUserType
  isActive: boolean
  permissionIds: string[]
}

function getDefaultValues(): ApplicationUserFormValues {
  return {
    fullName: '',
    mobileNumber: '',
    email: '',
    password: '',
    userType: 'supervisor',
    isActive: true,
    permissionIds: [],
  }
}

function validateForm(values: ApplicationUserFormValues, mode: FormMode): string | null {
  if (!values.fullName.trim()) {
    return 'Full name is required.'
  }

  if (!/^\d{10}$/.test(values.mobileNumber.trim())) {
    return 'Mobile number must be exactly 10 digits.'
  }

  if (mode === 'create' && values.password.trim().length < 6) {
    return 'Password must be at least 6 characters.'
  }

  if (mode === 'edit' && values.password.trim() && values.password.trim().length < 6) {
    return 'Password must be at least 6 characters.'
  }

  if (values.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) {
    return 'Please provide a valid email address.'
  }

  return null
}

type ApplicationUserFormPageProps = {
  mode: FormMode
}

export function ApplicationUserFormPage({ mode }: ApplicationUserFormPageProps) {
  const navigate = useNavigate()
  const { userId } = useParams()
  const currentUser = useCurrentUser()
  const [values, setValues] = useState<ApplicationUserFormValues>(getDefaultValues)
  const [isPasswordVisible, setIsPasswordVisible] = useState(false)
  const preservedHiddenPermissionIdsRef = useRef<string[]>([])

  const {
    data: editingUser,
    isLoading: isUserLoading,
    isError: isUserError,
    error: userError,
  } = useApplicationUserQuery(mode === 'edit' ? userId : undefined)

  const {
    data: permissionsCatalog,
    isLoading: isPermissionsLoading,
    isError: isPermissionsError,
    error: permissionsError,
  } = usePermissionsQuery()

  const isAdminUser = editingUser?.userType === 'admin'
  const permissionTree = useMemo(
    () => filterPermissionTreeForOverrides(permissionsCatalog?.tree ?? []),
    [permissionsCatalog?.tree],
  )

  useEffect(() => {
    if (mode === 'create') {
      preservedHiddenPermissionIdsRef.current = []
      return
    }

    if (!editingUser || !permissionsCatalog) {
      return
    }

    const { visibleIds, hiddenIds } = partitionPermissionIds(
      permissionsCatalog.items,
      editingUser.permissionIds,
    )
    preservedHiddenPermissionIdsRef.current = hiddenIds

    setValues({
      fullName: editingUser.displayName,
      mobileNumber: editingUser.mobileNumber,
      email: editingUser.email ?? '',
      password: '',
      userType: editingUser.userType === 'admin' ? 'supervisor' : editingUser.userType,
      isActive: editingUser.isActive,
      permissionIds: visibleIds,
    })
  }, [mode, editingUser, permissionsCatalog])

  const createMutation = useMutation({
    mutationFn: (payload: CreateApplicationUserInput) => applicationUsersService.create(payload),
    onSuccess: () => {
      toast.success('Application user created successfully.')
      queryClient.invalidateQueries({ queryKey: ['application-users'] })
      navigate(applicationAccessRoutes.list)
    },
    onError: (mutationError) => {
      toast.error(mutationError instanceof Error ? mutationError.message : 'Failed to create application user.')
    },
  })

  const updateMutation = useMutation({
    mutationFn: async (payload: UpdateApplicationUserInput & { permissionIds: string[] }) => {
      const { permissionIds, userId: targetUserId, ...updatePayload } = payload
      await applicationUsersService.update({ userId: targetUserId, ...updatePayload })
      await applicationUsersService.assignPermissions(targetUserId, permissionIds)
    },
    onSuccess: () => {
      toast.success('Application user updated successfully.')
      queryClient.invalidateQueries({ queryKey: ['application-users'] })
      if (userId) {
        queryClient.invalidateQueries({ queryKey: ['application-users', userId] })
      }
      navigate(applicationAccessRoutes.list)
    },
    onError: (mutationError) => {
      toast.error(mutationError instanceof Error ? mutationError.message : 'Failed to update application user.')
    },
  })

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const validationError = validateForm(values, mode)
    if (validationError) {
      toast.error(validationError)
      return
    }

    if (mode === 'create') {
      createMutation.mutate({
        fullName: values.fullName.trim(),
        mobileNumber: values.mobileNumber.trim(),
        password: values.password.trim(),
        userType: values.userType,
        isActive: values.isActive,
        permissionIds: values.permissionIds,
        ...(values.email.trim() ? { email: values.email.trim() } : {}),
      })
      return
    }

    if (!editingUser || !userId) {
      toast.error('Unable to identify the selected user.')
      return
    }

    const permissionIds = mergePermissionIdsForSave(
      values.permissionIds,
      preservedHiddenPermissionIdsRef.current,
    )

    updateMutation.mutate({
      userId,
      fullName: values.fullName.trim(),
      mobileNumber: values.mobileNumber.trim(),
      isActive: values.isActive,
      email: values.email.trim() ? values.email.trim() : null,
      permissionIds,
      ...(!isAdminUser ? { userType: values.userType } : {}),
      ...(values.password.trim() ? { password: values.password.trim() } : {}),
    })
  }

  const isSaving = createMutation.isPending || updateMutation.isPending
  const isLoading = mode === 'edit' ? isUserLoading || isPermissionsLoading : isPermissionsLoading

  if (currentUser?.role !== 'ADMIN') {
    return <Navigate to={applicationAccessRoutes.list} replace />
  }

  if (mode === 'edit' && !userId) {
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

        <div className="flex items-start gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary shadow-sm sm:size-11">
            <KeyRound className="size-5" />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
              {mode === 'create' ? 'Create Application User' : 'Edit Application User'}
            </h1>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
              {mode === 'create'
                ? 'Provision a login account and assign direct permission overrides on top of the selected role template.'
                : `Update account details and permission overrides for ${editingUser?.displayName ?? 'this user'}.`}
            </p>
          </div>
        </div>
      </header>

      {isLoading ? (
        <Card className="space-y-4 p-5">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-10 w-full" />
          ))}
        </Card>
      ) : null}

      {mode === 'edit' && isUserError ? (
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

      {!isLoading && !isPermissionsError && (mode === 'create' || (!isUserError && editingUser)) ? (
        <form onSubmit={handleSubmit} className="space-y-4 pb-28 sm:pb-4" autoComplete="off" noValidate>
          <Card className="space-y-5 p-4 sm:p-5">
            <div>
              <h2 className="text-base font-semibold">Account details</h2>
              <p className="text-sm text-muted-foreground">Basic login credentials and role assignment.</p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <FormLabel htmlFor="fullName" required>
                  Full Name
                </FormLabel>
                <Input
                  id="fullName"
                  value={values.fullName}
                  onChange={(event) => setValues((prev) => ({ ...prev, fullName: event.target.value }))}
                  disabled={isSaving}
                  placeholder="Rajesh Kumar"
                />
              </div>

              <div className="space-y-2">
                <FormLabel htmlFor="mobileNumber" required>
                  Mobile Number
                </FormLabel>
                <Input
                  id="mobileNumber"
                  inputMode="numeric"
                  maxLength={10}
                  value={values.mobileNumber}
                  onChange={(event) =>
                    setValues((prev) => ({
                      ...prev,
                      mobileNumber: event.target.value.replace(/\D/g, '').slice(0, 10),
                    }))
                  }
                  disabled={isSaving}
                  placeholder="9876543210"
                />
                <p className="text-xs text-muted-foreground">Used as the login username.</p>
              </div>

              <div className="space-y-2">
                <FormLabel htmlFor="email">Email</FormLabel>
                <Input
                  id="email"
                  type="email"
                  value={values.email}
                  onChange={(event) => setValues((prev) => ({ ...prev, email: event.target.value }))}
                  disabled={isSaving}
                  placeholder="name@example.com"
                />
              </div>

              <div className="space-y-2">
                <FormLabel htmlFor="userType" required>
                  User Type
                </FormLabel>
                {isAdminUser ? (
                  <Input id="userType" value={applicationUserTypeLabels.admin} disabled readOnly />
                ) : (
                  <Select
                    value={values.userType}
                    onValueChange={(value) =>
                      setValues((prev) => ({ ...prev, userType: value as CreatableApplicationUserType }))
                    }
                    disabled={isSaving}
                  >
                    <SelectTrigger id="userType">
                      <SelectValue placeholder="Select user type" />
                    </SelectTrigger>
                    <SelectContent>
                      {creatableUserTypeOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              <div className="space-y-2">
                <FormLabel htmlFor="password" required={mode === 'create'}>
                  {mode === 'create' ? 'Password' : 'Change Password'}
                </FormLabel>
                <div className="relative">
                  <Input
                    id="password"
                    type={isPasswordVisible ? 'text' : 'password'}
                    value={values.password}
                    onChange={(event) => setValues((prev) => ({ ...prev, password: event.target.value }))}
                    disabled={isSaving}
                    autoComplete="new-password"
                    className="pr-10"
                    placeholder={mode === 'create' ? 'Minimum 6 characters' : 'Leave blank to keep current password'}
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
            </div>

            <div className="flex items-center justify-between rounded-md border px-4 py-3">
              <div className="space-y-0.5">
                <FormLabel htmlFor="isActive">Active account</FormLabel>
                <p className="text-xs text-muted-foreground">Inactive users cannot sign in.</p>
              </div>
              <Switch
                id="isActive"
                checked={values.isActive}
                onCheckedChange={(checked) => setValues((prev) => ({ ...prev, isActive: checked }))}
                disabled={isSaving}
              />
            </div>
          </Card>

          <Card className="space-y-4 p-4 sm:p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-primary" />
                  <h2 className="text-base font-semibold">Permission overrides</h2>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  Direct permissions added here stack on top of the role template. Leave unchecked to rely on role defaults only.
                </p>
              </div>
              <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
                {values.permissionIds.length} selected
              </span>
            </div>

            <PermissionPicker
              tree={permissionTree}
              selectedIds={values.permissionIds}
              onChange={(permissionIds) => setValues((prev) => ({ ...prev, permissionIds }))}
              disabled={isSaving}
            />
          </Card>

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate(applicationAccessRoutes.list)}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {mode === 'create' ? 'Create User' : 'Save Changes'}
            </Button>
          </div>
        </form>
      ) : null}
    </section>
  )
}

export function CreateApplicationUserPage() {
  return <ApplicationUserFormPage mode="create" />
}

export function EditApplicationUserPage() {
  return <ApplicationUserFormPage mode="edit" />
}
