import axios from 'axios'

import { env } from '@/config/env'
import { ApiError } from '@/lib/api/api-error'
import { getAccessToken, useAuthStore } from '@/store/auth-store'

export const apiClient = axios.create({
  baseURL: env.apiBaseUrl,
  timeout: 15_000,
})

function hasAuthorizationHeader(config: { headers?: unknown }): boolean {
  const headers = config.headers
  if (!headers) {
    return false
  }

  if (typeof headers === 'object' && headers !== null && 'get' in headers && typeof headers.get === 'function') {
    return Boolean(headers.get('Authorization') ?? headers.get('authorization'))
  }

  const record = headers as Record<string, unknown>
  return Boolean(record.Authorization ?? record.authorization)
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
      useAuthStore.getState().logout()
    }

    throw new ApiError(message, status, error.response?.data)
  },
)
