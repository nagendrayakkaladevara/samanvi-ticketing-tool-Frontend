import { afterEach, describe, expect, it, vi } from 'vitest'

describe('env', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
    vi.resetModules()
  })

  it('exports apiBaseUrl from VITE_API_BASE_URL', async () => {
    vi.stubEnv('VITE_API_BASE_URL', 'http://localhost:3000')
    const { env } = await import('./env')
    expect(env.apiBaseUrl).toBe('http://localhost:3000')
  })

  it('throws when VITE_API_BASE_URL is missing', async () => {
    vi.stubEnv('VITE_API_BASE_URL', '')
    await expect(import('./env')).rejects.toThrow('Missing environment variable: VITE_API_BASE_URL')
  })
})
