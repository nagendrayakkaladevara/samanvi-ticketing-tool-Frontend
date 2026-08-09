import { beforeEach, describe, expect, it, vi } from 'vitest'

const mockGetAccessToken = vi.hoisted(() => vi.fn())
const mockLogout = vi.hoisted(() => vi.fn())

vi.mock('@/store/auth-store', () => ({
  getAccessToken: () => mockGetAccessToken(),
  useAuthStore: {
    getState: () => ({ logout: mockLogout }),
  },
}))

import { AxiosHeaders, type InternalAxiosRequestConfig } from 'axios'

import { ApiError } from './api-error'
import { apiClient } from './client'

type AdapterConfig = InternalAxiosRequestConfig

function installAdapter(
  handler: (config: AdapterConfig) => Promise<unknown> | unknown,
) {
  apiClient.defaults.adapter = async (config) => handler(config) as never
}

describe('apiClient', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetAccessToken.mockReturnValue(null)
    installAdapter(async (config) => ({
      data: { ok: true },
      status: 200,
      statusText: 'OK',
      headers: {},
      config,
    }))
  })

  describe('request interceptor', () => {
    it('attaches Bearer token when present and header absent', async () => {
      mockGetAccessToken.mockReturnValue('secret-token')
      let captured: AdapterConfig | undefined
      installAdapter(async (config) => {
        captured = config
        return { data: {}, status: 200, statusText: 'OK', headers: {}, config }
      })

      await apiClient.get('/test')

      expect(captured?.headers.Authorization).toBe('Bearer secret-token')
    })

    it('does not attach token when getAccessToken returns null', async () => {
      let captured: AdapterConfig | undefined
      installAdapter(async (config) => {
        captured = config
        return { data: {}, status: 200, statusText: 'OK', headers: {}, config }
      })

      await apiClient.get('/test')

      expect(captured?.headers.Authorization).toBeUndefined()
    })

    it('does not overwrite existing Authorization header (plain object)', async () => {
      mockGetAccessToken.mockReturnValue('new-token')
      let captured: AdapterConfig | undefined
      installAdapter(async (config) => {
        captured = config
        return { data: {}, status: 200, statusText: 'OK', headers: {}, config }
      })

      await apiClient.get('/test', { headers: { Authorization: 'Bearer existing' } })

      expect(captured?.headers.Authorization).toBe('Bearer existing')
    })

    it('does not overwrite lowercase authorization header', async () => {
      mockGetAccessToken.mockReturnValue('new-token')
      let captured: AdapterConfig | undefined
      installAdapter(async (config) => {
        captured = config
        return { data: {}, status: 200, statusText: 'OK', headers: {}, config }
      })

      await apiClient.get('/test', { headers: { authorization: 'Bearer existing' } })

      expect(captured?.headers.Authorization).toBeUndefined()
      expect((captured?.headers as Record<string, string>).authorization).toBe('Bearer existing')
    })

    it('does not overwrite AxiosHeaders-style authorization', async () => {
      mockGetAccessToken.mockReturnValue('new-token')
      let captured: AdapterConfig | undefined
      installAdapter(async (config) => {
        captured = config
        return { data: {}, status: 200, statusText: 'OK', headers: {}, config }
      })

      const headers = new AxiosHeaders()
      headers.set('Authorization', 'Bearer existing')

      await apiClient.get('/test', { headers })

      expect(captured?.headers.get('Authorization')).toBe('Bearer existing')
    })

    it('does not overwrite lowercase authorization on AxiosHeaders', async () => {
      mockGetAccessToken.mockReturnValue('new-token')
      let captured: AdapterConfig | undefined
      installAdapter(async (config) => {
        captured = config
        return { data: {}, status: 200, statusText: 'OK', headers: {}, config }
      })

      const headers = new AxiosHeaders()
      headers.set('authorization', 'Bearer lowercase')

      await apiClient.get('/test', { headers })

      expect(captured?.headers.get('authorization')).toBe('Bearer lowercase')
    })

    it('skips token when request has no headers object', async () => {
      mockGetAccessToken.mockReturnValue('secret-token')
      let captured: AdapterConfig | undefined
      installAdapter(async (config) => {
        captured = { ...config, headers: undefined as never }
        return { data: {}, status: 200, statusText: 'OK', headers: {}, config: captured }
      })

      await apiClient.get('/test')

      expect(captured?.headers).toBeUndefined()
    })

    it('detects authorization on plain headers without get method', async () => {
      mockGetAccessToken.mockReturnValue('new-token')
      let captured: AdapterConfig | undefined
      installAdapter(async (config) => {
        captured = config
        return { data: {}, status: 200, statusText: 'OK', headers: {}, config }
      })

      const plainHeaders = { authorization: 'Bearer plain' } as InternalAxiosRequestConfig['headers']
      await apiClient.get('/test', { headers: plainHeaders })

      expect((captured?.headers as Record<string, string>).authorization).toBe('Bearer plain')
      expect(captured?.headers.Authorization).toBeUndefined()
    })

    it('treats headers with non-function get as plain object', async () => {
      mockGetAccessToken.mockReturnValue('new-token')
      let captured: AdapterConfig | undefined
      installAdapter(async (config) => {
        captured = config
        return { data: {}, status: 200, statusText: 'OK', headers: {}, config }
      })

      const headers = { get: 'not-fn', Authorization: 'Bearer legacy' } as never
      await apiClient.get('/test', { headers })

      expect((captured?.headers as Record<string, string>).Authorization).toBe('Bearer legacy')
    })

    it('does not attach token when config headers are explicitly undefined', async () => {
      mockGetAccessToken.mockReturnValue('secret-token')
      let captured: AdapterConfig | undefined
      installAdapter(async (config) => {
        captured = config
        return { data: {}, status: 200, statusText: 'OK', headers: {}, config }
      })

      await apiClient.get('/test', { headers: undefined as never })

      expect(captured?.headers.Authorization).toBe('Bearer secret-token')
    })
  })

  describe('response interceptor', () => {
    it('passes through successful responses', async () => {
      const response = await apiClient.get('/ok')
      expect(response.data).toEqual({ ok: true })
    })

    it('throws ApiError with response message', async () => {
      installAdapter(async () => {
        throw {
          response: { status: 400, data: { message: 'Bad request' } },
          message: 'Request failed',
        }
      })

      await expect(apiClient.get('/bad')).rejects.toMatchObject({
        name: 'ApiError',
        message: 'Bad request',
        status: 400,
      })
    })

    it('falls back to error.message when response message missing', async () => {
      installAdapter(async () => {
        throw { message: 'Network Error' }
      })

      await expect(apiClient.get('/bad')).rejects.toThrow(
        expect.objectContaining<Partial<ApiError>>({ message: 'Network Error' }),
      )
    })

    it('uses default message when no details available', async () => {
      installAdapter(async () => {
        throw {}
      })

      await expect(apiClient.get('/bad')).rejects.toThrow(
        expect.objectContaining<Partial<ApiError>>({ message: 'Unexpected API error' }),
      )
    })

    it('calls logout on 401', async () => {
      installAdapter(async () => {
        throw {
          response: { status: 401, data: { message: 'Unauthorized' } },
          message: 'Unauthorized',
        }
      })

      await expect(apiClient.get('/protected')).rejects.toThrow(ApiError)
      expect(mockLogout).toHaveBeenCalledTimes(1)
    })

    it('does not call logout on non-401 errors', async () => {
      installAdapter(async () => {
        throw {
          response: { status: 403, data: { message: 'Forbidden' } },
          message: 'Forbidden',
        }
      })

      await expect(apiClient.get('/forbidden')).rejects.toThrow(ApiError)
      expect(mockLogout).not.toHaveBeenCalled()
    })
  })
})
