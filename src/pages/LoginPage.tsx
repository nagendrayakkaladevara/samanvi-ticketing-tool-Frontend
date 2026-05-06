import { type FormEvent, useMemo, useState } from 'react'
import { GalleryVerticalEnd } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'
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
  const details = error.details
  if (!details || typeof details !== 'object') {
    return undefined
  }

  const detailsRecord = details as Record<string, unknown>
  const errorPayload = detailsRecord.error
  if (!errorPayload || typeof errorPayload !== 'object') {
    return undefined
  }

  const message = (errorPayload as Record<string, unknown>).message
  return typeof message === 'string' && message.trim().length > 0 ? message : undefined
}

export function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const setSession = useAuthStore((state) => state.setSession)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState<FormErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const redirectTo = useMemo(() => {
    const from = location.state?.from
    return typeof from === 'string' && from.startsWith('/') ? from : '/'
  }, [location.state])

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
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

    setIsSubmitting(true)
    try {
      const session = await login(parsed.data)
      setSession(session)

      navigate(redirectTo, { replace: true })
    } catch (error) {
      const fallbackMessage = 'Invalid username or password. Please try again.'
      if (error instanceof ApiError) {
        const message = extractLoginErrorMessage(error) ?? error.message ?? fallbackMessage
        setErrors({ form: message })
        toast.error(message)
      } else {
        setErrors({ form: fallbackMessage })
        toast.error(fallbackMessage)
      }
    } finally {
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
      <div className="bg-muted relative hidden lg:block">
        <img
          src="/placeholder.svg"
          alt="Image"
          className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
        />
      </div>
    </div>
  )
}
