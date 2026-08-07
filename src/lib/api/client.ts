import axios from 'axios'

import { env } from '@/config/env'
import { ApiError } from '@/lib/api/api-error'
import { getAccessToken, useAuthStore } from '@/store/auth-store'

export const apiClient = axios.create({
  baseURL: env.apiBaseUrl,
  timeout: 20_000,
})

function readHeaderValue(headers: unknown, name: string): string | undefined {
  if (!headers || typeof headers !== 'object') {
    return undefined
  }

  if ('get' in headers && typeof (headers as { get: (key: string) => unknown }).get === 'function') {
    const value = (headers as { get: (key: string) => unknown }).get(name)
    return typeof value === 'string' ? value : undefined
  }

  const record = headers as Record<string, unknown>
  const direct = record[name] ?? record[name.toLowerCase()]
  return typeof direct === 'string' ? direct : undefined
}

function hasAuthorizationHeader(config: { headers?: unknown }): boolean {
  return Boolean(readHeaderValue(config.headers, 'Authorization'))
}

function bearerTokenFromAuthorization(value: string | undefined): string | null {
  if (!value) {
    return null
  }

  const match = /^Bearer\s+(.+)$/i.exec(value.trim())
  return match?.[1]?.trim() || null
}

apiClient.interceptors.request.use((config) => {
  if (hasAuthorizationHeader(config)) {
    return config
  }

  const token = getAccessToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  return config
})

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status as number | undefined
    const message = error.response?.data?.message ?? error.message ?? 'Unexpected API error'

    if (status === 401) {
      const requestToken = bearerTokenFromAuthorization(
        readHeaderValue(error.config?.headers, 'Authorization'),
      )
      const currentToken = useAuthStore.getState().accessToken

      // Only clear the session when the failing request used the active token.
      // Otherwise a stale in-flight 401 from a prior session can log out the new user.
      if (!requestToken || !currentToken || requestToken === currentToken) {
        useAuthStore.getState().logout()
      }
    }

    throw new ApiError(message, status, error.response?.data)
  },
)
