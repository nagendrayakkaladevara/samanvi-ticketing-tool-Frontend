import { type FormEvent, useRef, useState } from 'react'
import { GalleryVerticalEnd } from 'lucide-react'
import { toast } from '@/lib/toast'
import { z } from 'zod'

import { login } from '@/features/auth/api/auth.service'
import { ApiError } from '@/lib/api/api-error'
import { useAuthStore } from '@/store/auth-store'
import { LoginForm } from '@/components/login-form'

const formSchema = z.object({
  username: z
    .string()
    .trim()
    .min(3, 'Username must be at least 3 characters')
    .max(64, 'Username is too long'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password is too long'),
})

type FormErrors = Partial<Record<'username' | 'password' | 'form', string>>

function extractLoginErrorMessage(error: ApiError): string | undefined {
  if (error.message.trim().length > 0) {
    return error.message
  }

  const details = error.details
  if (!details || typeof details !== 'object') {
    return undefined
  }

  const detailsRecord = details as Record<string, unknown>
  if (typeof detailsRecord.message === 'string' && detailsRecord.message.trim().length > 0) {
    return detailsRecord.message
  }

  const errorPayload = detailsRecord.error
  if (typeof errorPayload === 'string' && errorPayload.trim().length > 0) {
    return errorPayload
  }

  if (errorPayload && typeof errorPayload === 'object') {
    const message = (errorPayload as Record<string, unknown>).message
    return typeof message === 'string' && message.trim().length > 0 ? message : undefined
  }

  return undefined
}

function resolveLoginErrorMessage(error: unknown): string {
  const fallbackMessage = 'Invalid username or password. Please try again.'

  if (error instanceof ApiError) {
    return extractLoginErrorMessage(error) ?? fallbackMessage
  }

  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message
  }

  return fallbackMessage
}

export function LoginPage() {
  const setSession = useAuthStore((state) => state.setSession)
  const loginInFlightRef = useRef(false)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState<FormErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (loginInFlightRef.current) {
      return
    }

    setErrors({})

    const parsed = formSchema.safeParse({ username, password })
    if (!parsed.success) {
      const flattened = parsed.error.flatten().fieldErrors
      setErrors({
        username: flattened.username?.[0],
        password: flattened.password?.[0],
      })
      return
    }

    loginInFlightRef.current = true
    setIsSubmitting(true)
    try {
      const session = await login(parsed.data)
      setSession(session)
    } catch (error) {
      if (!useAuthStore.getState().isAuthenticated) {
        const message = resolveLoginErrorMessage(error)
        setErrors({ form: message })
        toast.error(message)
      }
    } finally {
      loginInFlightRef.current = false
      setIsSubmitting(false)
    }
  }

  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="flex flex-col gap-4 p-6 md:p-10">
        <div className="flex justify-center gap-2 md:justify-start">
          <a href="#" className="flex items-center gap-2 font-medium">
            <div className="bg-primary text-primary-foreground flex size-6 items-center justify-center rounded-md">
              <GalleryVerticalEnd className="size-4" />
            </div>
            Samanvi Ticketing Tool
          </a>
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-xs">
            <LoginForm
              username={username}
              password={password}
              isSubmitting={isSubmitting}
              errors={errors}
              onUsernameChange={setUsername}
              onPasswordChange={setPassword}
              onSubmit={onSubmit}
            />
          </div>
        </div>
      </div>
      <div className="hidden bg-white lg:block" />
    </div>
  )
}
