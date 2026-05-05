import { z } from 'zod'

import { apiClient } from '@/lib/api/client'
import { ApiError } from '@/lib/api/api-error'
import type { AuthSession, AuthUser, LoginInput } from '@/features/auth/types/auth'

const loginSchema = z.object({
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

function parseAuthUser(raw: unknown): AuthUser {
  const parsed = z
    .object({
      id: z.union([z.string(), z.number()]).transform(String),
      name: z.string().trim().min(1).optional(),
      username: z.string().trim().min(1).optional(),
      displayName: z.string().trim().min(1).optional(),
      fullName: z.string().trim().min(1).optional(),
      email: z.string().email().optional(),
      role: z.string().optional(),
      roleCode: z.string().optional(),
    })
    .or(
      z.object({
        userId: z.union([z.string(), z.number()]).transform(String),
        username: z.string().trim().min(1).optional(),
        displayName: z.string().trim().min(1).optional(),
        fullName: z.string().trim().min(1).optional(),
        email: z.string().email().optional(),
        role: z.string().optional(),
        roleCode: z.string().optional(),
      }),
    )
    .safeParse(raw)

  if (!parsed.success) {
    throw new ApiError('Login succeeded but user information is malformed')
  }

  const user = parsed.data
  const userId = 'id' in user ? user.id : user.userId
  const displayName =
    ('displayName' in user ? user.displayName : undefined) ??
    ('name' in user ? user.name : undefined) ??
    ('fullName' in user ? user.fullName : undefined) ??
    ('username' in user ? user.username : undefined) ??
    'Samanvi User'
  const role = user.role ?? user.roleCode ?? 'WORKER'

  return {
    id: userId,
    name: displayName,
    email: user.email,
    role: role.toUpperCase(),
  }
}

function extractSessionEnvelope(raw: unknown): {
  accessToken: string
  refreshToken?: string
  user?: unknown
} {
  const asString = (value: unknown): string | undefined =>
    typeof value === 'string' && value.trim().length > 0 ? value : undefined

  const envelope = z
    .object({
      data: z.unknown().optional(),
      accessToken: z.string().optional(),
      token: z.string().optional(),
      refreshToken: z.string().optional(),
      user: z.unknown().optional(),
    })
    .passthrough()
    .safeParse(raw)

  if (!envelope.success) {
    throw new ApiError('Login response format is invalid')
  }

  const source = envelope.data.data ?? envelope.data
  const tokenFromSource =
    (typeof source === 'object' &&
      source !== null &&
      ('accessToken' in source || 'token' in source) &&
      (source as Record<string, unknown>)) ||
    null

  const jwtFromEnvelopeData =
    typeof envelope.data.data === 'object' && envelope.data.data !== null
      ? asString((envelope.data.data as Record<string, unknown>).jwt)
      : undefined

  const accessToken =
    asString(tokenFromSource?.accessToken) ??
    asString(tokenFromSource?.token) ??
    asString(tokenFromSource?.jwt) ??
    asString(envelope.data.accessToken) ??
    asString(envelope.data.token) ??
    jwtFromEnvelopeData

  if (!accessToken) {
    throw new ApiError('Login succeeded but access token is missing')
  }

  const refreshToken =
    asString(tokenFromSource?.refreshToken) ?? asString(envelope.data.refreshToken)

  const user =
    (typeof source === 'object' &&
      source !== null &&
      'user' in source &&
      (source as Record<string, unknown>).user) ??
    envelope.data.user

  return { accessToken, refreshToken, user }
}

async function fetchCurrentUser(accessToken: string): Promise<AuthUser> {
  try {
    const response = await apiClient.get('/auth/me', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })
    const data = response.data as unknown
    const source =
      (typeof data === 'object' && data !== null && 'data' in (data as Record<string, unknown>)
        ? (data as Record<string, unknown>).data
        : data) ?? data
    return parseAuthUser(source)
  } catch (error) {
    if (error instanceof ApiError) {
      throw error
    }
    throw new ApiError('Logged in but failed to load user profile')
  }
}

async function parseSessionPayload(raw: unknown): Promise<AuthSession> {
  const { accessToken, refreshToken, user } = extractSessionEnvelope(raw)
  const parsedUser = user ? parseAuthUser(user) : await fetchCurrentUser(accessToken)

  return { accessToken, refreshToken, user: parsedUser }
}

export async function login(input: LoginInput): Promise<AuthSession> {
  const payload = loginSchema.parse(input)

  try {
    const response = await apiClient.post('/auth/login', payload)
    return await parseSessionPayload(response.data)
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new ApiError(error.issues[0]?.message ?? 'Invalid login details')
    }

    if (error instanceof ApiError) {
      throw error
    }

    throw new ApiError('Unable to sign in right now. Please try again.')
  }
}
