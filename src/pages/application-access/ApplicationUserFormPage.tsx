import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react'
import { useMutation } from '@tanstack/react-query'
import { ArrowLeft, CheckCircle2, Eye, EyeOff, KeyRound, Loader2, Shield } from 'lucide-react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { FieldError } from '@/components/ui/field-error'
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
  toCreatableUserType,
  type CreateApplicationUserInput,
  type CreatableApplicationUserType,
  type UpdateApplicationUserInput,
  type ApplicationUser,
} from '@/features/application-users/types/application-user'
import { applicationAccessRoutes } from '@/features/application-users/utils/application-access-routes'
import {
  mergePermissionIdsForSave,
  partitionPermissionIds,
} from '@/features/application-users/utils/permission-tree'
import { AUTH_PASSWORD_MIN_LENGTH } from '@/features/auth/types/auth'
import { usePermissions } from '@/hooks/use-permissions'
import { invalidFieldClass } from '@/lib/form/form-field-styles'
import { queryClient } from '@/lib/query/query-client'
import { toast } from '@/lib/toast'
import { cn } from '@/lib/utils'

type FormMode = 'create' | 'edit'

type ApplicationUserFormValues = {
  username: string
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
    username: '',
    fullName: '',
    mobileNumber: '',
    email: '',
    password: '',
    userType: 'supervisor',
    isActive: true,
    permissionIds: [],
  }
}

function getValuesFromEditingUser(editingUser: ApplicationUser): ApplicationUserFormValues {
  return {
    username: editingUser.username,
    fullName: editingUser.displayName,
    mobileNumber: editingUser.mobileNumber,
    email: editingUser.email ?? '',
    password: '',
    userType: toCreatableUserType(editingUser.userType),
    isActive: editingUser.isActive,
    permissionIds: editingUser.permissionIds,
  }
}

type ApplicationUserFormField = keyof ApplicationUserFormValues

type ApplicationUserFormErrors = Partial<Record<ApplicationUserFormField, string>>

function getApplicationUserFieldError(
  field: ApplicationUserFormField,
  values: ApplicationUserFormValues,
  mode: FormMode,
): string | undefined {
  switch (field) {
    case 'username': {
      const username = values.username.trim()
      if (!username) return 'Username is required.'
      if (username.length < 3 || username.length > 50) {
        return 'Username must be between 3 and 50 characters.'
      }
      return undefined
    }
    case 'fullName':
      return !values.fullName.trim() ? 'Full name is required.' : undefined
    case 'mobileNumber':
      return !/^\d{10}$/.test(values.mobileNumber.trim())
        ? 'Mobile number must be exactly 10 digits.'
        : undefined
    case 'password':
      if (mode === 'create' && values.password.trim().length < AUTH_PASSWORD_MIN_LENGTH) {
        return `Password must be at least ${AUTH_PASSWORD_MIN_LENGTH} characters.`
      }
      if (
        mode === 'edit' &&
        values.password.trim() &&
        values.password.trim().length < AUTH_PASSWORD_MIN_LENGTH
      ) {
        return `Password must be at least ${AUTH_PASSWORD_MIN_LENGTH} characters.`
      }
      return undefined
    case 'email':
      return values.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())
        ? 'Please provide a valid email address.'
        : undefined
    default:
      return undefined
  }
}

function validateForm(values: ApplicationUserFormValues, mode: FormMode): ApplicationUserFormErrors {
  const errors: ApplicationUserFormErrors = {}
  const validatedFields: ApplicationUserFormField[] = ['username', 'fullName', 'mobileNumber', 'password', 'email']

  for (const field of validatedFields) {
    const error = getApplicationUserFieldError(field, values, mode)
    if (error) errors[field] = error
  }

  return errors
}

type UsernameAvailabilityStatus = 'idle' | 'checking' | 'available' | 'taken' | 'error'

const USERNAME_TAKEN_MESSAGE = 'This username is already taken.'
const USERNAME_DEBOUNCE_MS = 500

type ApplicationUserFormPageProps = {
  mode: FormMode
}

export function ApplicationUserFormPage({ mode }: ApplicationUserFormPageProps) {
  const navigate = useNavigate()
  const { userId } = useParams()
  const { can } = usePermissions()
  const canAccessForm = mode === 'create' ? can('users', '', 'create') : can('users', '', 'edit')
  const canManagePermissions = can('users', '', 'manage_permissions')
  const [values, setValues] = useState<ApplicationUserFormValues>(getDefaultValues)
  const [fieldErrors, setFieldErrors] = useState<ApplicationUserFormErrors>({})
  const [isPasswordVisible, setIsPasswordVisible] = useState(false)
  const [usernameAvailability, setUsernameAvailability] = useState<UsernameAvailabilityStatus>('idle')
  const originalUsernameRef = useRef('')
  const preservedHiddenPermissionIdsRef = useRef<string[]>([])
  const initializedUserIdRef = useRef<string | null>(null)
  const usernameCheckRequestIdRef = useRef(0)
  const valuesRef = useRef(values)
  valuesRef.current = values

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
  const permissionTree = permissionsCatalog?.tree ?? []

  useEffect(() => {
    initializedUserIdRef.current = null
  }, [userId])

  useEffect(() => {
    if (mode === 'create') {
      initializedUserIdRef.current = null
      originalUsernameRef.current = ''
      preservedHiddenPermissionIdsRef.current = []
      setValues(getDefaultValues())
      setUsernameAvailability('idle')
      setFieldErrors({})
      return
    }

    if (!editingUser || !permissionsCatalog || initializedUserIdRef.current === editingUser.id) {
      return
    }

    const { visibleIds, hiddenIds } = partitionPermissionIds(
      permissionsCatalog.items,
      editingUser.permissionIds,
    )
    preservedHiddenPermissionIdsRef.current = hiddenIds

    initializedUserIdRef.current = editingUser.id
    originalUsernameRef.current = editingUser.username.trim()
    setValues({
      ...getValuesFromEditingUser(editingUser),
      permissionIds: visibleIds,
    })
    setUsernameAvailability('available')
    setFieldErrors({})
  }, [mode, editingUser, permissionsCatalog])

  const updateField = <K extends ApplicationUserFormField>(field: K, value: ApplicationUserFormValues[K]) => {
    setValues((prev) => ({ ...prev, [field]: value }))
    setFieldErrors((prev) => ({ ...prev, [field]: undefined }))

    if (field === 'username') {
      usernameCheckRequestIdRef.current += 1
      setUsernameAvailability('idle')
    }
  }

  const needsUsernameAvailabilityCheck = useCallback((username: string) => {
    const trimmed = username.trim()
    return trimmed.length > 0 && trimmed !== originalUsernameRef.current
  }, [])

  const verifyUsernameAvailability = useCallback(async (username: string): Promise<boolean> => {
    const currentValues = valuesRef.current
    const syncError = getApplicationUserFieldError('username', { ...currentValues, username }, mode)
    if (syncError) {
      setFieldErrors((prev) => ({ ...prev, username: syncError }))
      setUsernameAvailability('idle')
      return false
    }

    const trimmed = username.trim()
    if (!needsUsernameAvailabilityCheck(trimmed)) {
      setFieldErrors((prev) => ({ ...prev, username: undefined }))
      setUsernameAvailability(trimmed ? 'available' : 'idle')
      return true
    }

    const requestId = ++usernameCheckRequestIdRef.current
    setUsernameAvailability('checking')

    try {
      const { exists } = await applicationUsersService.checkUsernameExists(trimmed)
      if (requestId !== usernameCheckRequestIdRef.current) {
        return false
      }

      if (exists) {
        setFieldErrors((prev) => ({ ...prev, username: USERNAME_TAKEN_MESSAGE }))
        setUsernameAvailability('taken')
        return false
      }

      setFieldErrors((prev) => ({ ...prev, username: undefined }))
      setUsernameAvailability('available')
      return true
    } catch {
      if (requestId !== usernameCheckRequestIdRef.current) {
        return false
      }

      setFieldErrors((prev) => ({
        ...prev,
        username: 'Unable to verify username. Please try again.',
      }))
      setUsernameAvailability('error')
      return false
    }
  }, [mode, needsUsernameAvailabilityCheck])

  useEffect(() => {
    const trimmed = values.username.trim()
    const syncError = getApplicationUserFieldError('username', values, mode)

    if (syncError) {
      setUsernameAvailability('idle')
      return
    }

    if (!needsUsernameAvailabilityCheck(trimmed)) {
      setUsernameAvailability(trimmed ? 'available' : 'idle')
      setFieldErrors((prev) => {
        if (
          prev.username === USERNAME_TAKEN_MESSAGE ||
          prev.username === 'Unable to verify username. Please try again.'
        ) {
          return { ...prev, username: undefined }
        }
        return prev
      })
      return
    }

    const timer = window.setTimeout(() => {
      void verifyUsernameAvailability(values.username)
    }, USERNAME_DEBOUNCE_MS)

    return () => {
      window.clearTimeout(timer)
      usernameCheckRequestIdRef.current += 1
    }
  }, [values.username, mode, needsUsernameAvailabilityCheck, verifyUsernameAvailability])

  const blurField = (field: ApplicationUserFormField) => {
    const error = getApplicationUserFieldError(field, values, mode)
    setFieldErrors((prev) => ({ ...prev, [field]: error }))
  }

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
    mutationFn: async (payload: UpdateApplicationUserInput & { permissionIds: string[]; assignPermissions: boolean }) => {
      const { permissionIds, assignPermissions, userId: targetUserId, ...updatePayload } = payload
      await applicationUsersService.update({ userId: targetUserId, ...updatePayload })
      if (assignPermissions) {
        await applicationUsersService.assignPermissions(targetUserId, permissionIds)
      }
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

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const nextErrors = validateForm(values, mode)
    if (Object.keys(nextErrors).length > 0) {
      setFieldErrors(nextErrors)
      toast.error('Please fix the highlighted fields.')
      return
    }

    if (needsUsernameAvailabilityCheck(values.username)) {
      const isAvailable = await verifyUsernameAvailability(values.username)
      if (!isAvailable) {
        toast.error('Please fix the username field before continuing.')
        return
      }
    }

    if (mode === 'create') {
      createMutation.mutate({
        username: values.username.trim().toLowerCase(),
        fullName: values.fullName.trim(),
        mobileNumber: values.mobileNumber.trim(),
        password: values.password.trim(),
        userType: values.userType,
        isActive: values.isActive,
        permissionIds: canManagePermissions ? values.permissionIds : [],
        ...(values.email.trim() ? { email: values.email.trim() } : {}),
      })
      return
    }

    if (!editingUser || !userId) {
      toast.error('Unable to identify the selected user.')
      return
    }

    const permissionIds = canManagePermissions
      ? mergePermissionIdsForSave(values.permissionIds, preservedHiddenPermissionIdsRef.current)
      : []

    updateMutation.mutate({
      userId,
      username: values.username.trim().toLowerCase(),
      fullName: values.fullName.trim(),
      mobileNumber: values.mobileNumber.trim(),
      isActive: values.isActive,
      email: values.email.trim() ? values.email.trim() : null,
      permissionIds,
      assignPermissions: canManagePermissions,
      ...(!isAdminUser ? { userType: values.userType } : {}),
      ...(values.password.trim() ? { password: values.password.trim() } : {}),
    })
  }

  const isSaving = createMutation.isPending || updateMutation.isPending
  const isCheckingUsername = usernameAvailability === 'checking'
  const isLoading = mode === 'edit' ? isUserLoading || isPermissionsLoading : isPermissionsLoading

  if (!canAccessForm) {
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
              <div className="space-y-2">
                <FormLabel htmlFor="username" required>
                  Username
                </FormLabel>
                <div className="relative">
                  <Input
                    id="username"
                    value={values.username}
                    onChange={(event) => updateField('username', event.target.value.toLowerCase())}
                    onBlur={() => blurField('username')}
                    disabled={isSaving}
                    placeholder="rajesh.kumar"
                    autoComplete="off"
                    autoCapitalize="none"
                    maxLength={50}
                    aria-invalid={Boolean(fieldErrors.username)}
                    aria-busy={isCheckingUsername}
                    className={cn(
                      (isCheckingUsername ||
                        (usernameAvailability === 'available' &&
                          values.username.trim() &&
                          !fieldErrors.username)) &&
                        'pr-10',
                      fieldErrors.username && invalidFieldClass,
                    )}
                  />
                  {isCheckingUsername ? (
                    <span
                      className="pointer-events-none absolute right-2 top-1/2 flex -translate-y-1/2 items-center justify-center"
                      aria-hidden
                    >
                      <Loader2 className="h-4 w-4 shrink-0 animate-spin text-muted-foreground" />
                    </span>
                  ) : usernameAvailability === 'available' && values.username.trim() && !fieldErrors.username ? (
                    <CheckCircle2
                      className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-emerald-600"
                      aria-hidden
                    />
                  ) : null}
                </div>
                <FieldError message={fieldErrors.username} />
              </div>

              <div className="space-y-2">
                <FormLabel htmlFor="fullName" required>
                  Full Name
                </FormLabel>
                <Input
                  id="fullName"
                  value={values.fullName}
                  onChange={(event) => updateField('fullName', event.target.value)}
                  onBlur={() => blurField('fullName')}
                  disabled={isSaving}
                  placeholder="Rajesh Kumar"
                  aria-invalid={Boolean(fieldErrors.fullName)}
                  className={cn(fieldErrors.fullName && invalidFieldClass)}
                />
                <FieldError message={fieldErrors.fullName} />
              </div>

              <div className="space-y-2 sm:col-span-2">
                <FormLabel htmlFor="mobileNumber" required>
                  Mobile Number
                </FormLabel>
                <Input
                  id="mobileNumber"
                  inputMode="numeric"
                  maxLength={10}
                  value={values.mobileNumber}
                  onChange={(event) =>
                    updateField('mobileNumber', event.target.value.replace(/\D/g, '').slice(0, 10))
                  }
                  onBlur={() => blurField('mobileNumber')}
                  disabled={isSaving}
                  placeholder="9876543210"
                  aria-invalid={Boolean(fieldErrors.mobileNumber)}
                  className={cn(fieldErrors.mobileNumber && invalidFieldClass)}
                />
                <FieldError message={fieldErrors.mobileNumber} />
              </div>

              <div className="space-y-2">
                <FormLabel htmlFor="email">Email</FormLabel>
                <Input
                  id="email"
                  type="email"
                  value={values.email}
                  onChange={(event) => updateField('email', event.target.value)}
                  onBlur={() => blurField('email')}
                  disabled={isSaving}
                  placeholder="name@example.com"
                  aria-invalid={Boolean(fieldErrors.email)}
                  className={cn(fieldErrors.email && invalidFieldClass)}
                />
                <FieldError message={fieldErrors.email} />
              </div>

              <div className="space-y-2">
                <FormLabel htmlFor="userType" required>
                  User Type
                </FormLabel>
                {isAdminUser ? (
                  <Input id="userType" value={applicationUserTypeLabels.admin} disabled readOnly />
                ) : (
                  <Select
                    key={`${userId ?? 'create'}-${values.userType}`}
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
                    onChange={(event) => updateField('password', event.target.value)}
                    onBlur={() => blurField('password')}
                    disabled={isSaving}
                    autoComplete="new-password"
                    className={cn('pr-10', fieldErrors.password && invalidFieldClass)}
                    placeholder={mode === 'create' ? 'Minimum 6 characters' : 'Leave blank to keep current password'}
                    aria-invalid={Boolean(fieldErrors.password)}
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
                <FieldError message={fieldErrors.password} />
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

          {canManagePermissions ? (
            <Card className="space-y-4 p-4 sm:p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-primary" />
                    <h2 className="text-base font-semibold">Permissions/Access</h2>
                  </div>
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
          ) : null}

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate(applicationAccessRoutes.list)}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSaving || isCheckingUsername}>
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
