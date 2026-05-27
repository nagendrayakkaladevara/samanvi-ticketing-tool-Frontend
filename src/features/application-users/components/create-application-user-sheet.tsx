import { useState, type FormEvent } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Eye, EyeOff, Loader2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Switch } from '@/components/ui/switch'
import { applicationUsersService } from '@/features/application-users/api/application-users.service'
import {
  creatableUserTypeOptions,
  type CreateApplicationUserInput,
  type CreatableApplicationUserType,
} from '@/features/application-users/types/application-user'
import { queryClient } from '@/lib/query/query-client'
import { toast } from '@/lib/toast'

type CreateApplicationUserFormValues = {
  fullName: string
  mobileNumber: string
  email: string
  password: string
  userType: CreatableApplicationUserType
  isActive: boolean
}

function getDefaultValues(): CreateApplicationUserFormValues {
  return {
    fullName: '',
    mobileNumber: '',
    email: '',
    password: '',
    userType: 'supervisor',
    isActive: true,
  }
}

function validateForm(values: CreateApplicationUserFormValues): string | null {
  if (!values.fullName.trim()) {
    return 'Full name is required.'
  }

  if (!/^\d{10}$/.test(values.mobileNumber.trim())) {
    return 'Mobile number must be exactly 10 digits.'
  }

  if (values.password.trim().length < 6) {
    return 'Password must be at least 6 characters.'
  }

  if (values.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) {
    return 'Please provide a valid email address.'
  }

  return null
}

type CreateApplicationUserSheetProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreateApplicationUserSheet({ open, onOpenChange }: CreateApplicationUserSheetProps) {
  const [values, setValues] = useState<CreateApplicationUserFormValues>(getDefaultValues)
  const [isPasswordVisible, setIsPasswordVisible] = useState(false)

  const createMutation = useMutation({
    mutationFn: (payload: CreateApplicationUserInput) => applicationUsersService.create(payload),
    onSuccess: () => {
      toast.success('Application user created successfully.')
      queryClient.invalidateQueries({ queryKey: ['application-users'] })
      setValues(getDefaultValues())
      onOpenChange(false)
    },
    onError: (mutationError) => {
      toast.error(mutationError instanceof Error ? mutationError.message : 'Failed to create application user.')
    },
  })

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const validationError = validateForm(values)
    if (validationError) {
      toast.error(validationError)
      return
    }

    createMutation.mutate({
      fullName: values.fullName.trim(),
      mobileNumber: values.mobileNumber.trim(),
      password: values.password.trim(),
      userType: values.userType,
      isActive: values.isActive,
      ...(values.email.trim() ? { email: values.email.trim() } : {}),
    })
  }

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen && !createMutation.isPending) {
      setValues(getDefaultValues())
    }
    onOpenChange(nextOpen)
  }

  const isSaving = createMutation.isPending

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-xl">
        <SheetHeader>
          <SheetTitle>Create Application User</SheetTitle>
          <SheetDescription>
            Add a new login user with mobile number as username. Role permissions apply from the selected user type.
          </SheetDescription>
        </SheetHeader>

        <form className="mt-6 space-y-5" onSubmit={handleSubmit} autoComplete="off">
          <div className="space-y-2">
            <Label htmlFor="fullName">Full Name</Label>
            <Input
              id="fullName"
              value={values.fullName}
              onChange={(event) => setValues((prev) => ({ ...prev, fullName: event.target.value }))}
              disabled={isSaving}
              autoComplete="off"
              placeholder="Rajesh Kumar"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="mobileNumber">Mobile Number</Label>
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
              autoComplete="off"
              placeholder="9876543210"
              required
            />
            <p className="text-xs text-muted-foreground">Used as the login username.</p>
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
            <Label htmlFor="userType">User Type</Label>
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
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={isPasswordVisible ? 'text' : 'password'}
                value={values.password}
                onChange={(event) => setValues((prev) => ({ ...prev, password: event.target.value }))}
                disabled={isSaving}
                autoComplete="new-password"
                className="pr-10"
                placeholder="Minimum 6 characters"
                required
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

          <div className="flex items-center justify-between rounded-md border px-4 py-3">
            <div className="space-y-0.5">
              <Label htmlFor="isActive" className="cursor-pointer">
                Active account
              </Label>
              <p className="text-xs text-muted-foreground">Inactive users cannot sign in.</p>
            </div>
            <Switch
              id="isActive"
              checked={values.isActive}
              onCheckedChange={(checked) => setValues((prev) => ({ ...prev, isActive: checked }))}
              disabled={isSaving}
            />
          </div>

          <SheetFooter>
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)} disabled={isSaving}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Create User
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}
