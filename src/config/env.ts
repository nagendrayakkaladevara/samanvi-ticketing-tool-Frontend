const required = ['VITE_API_BASE_URL'] as const

required.forEach((key) => {
  if (!import.meta.env[key]) {
    throw new Error(`Missing environment variable: ${key}`)
  }
})

export const env = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL as string,
} as const
