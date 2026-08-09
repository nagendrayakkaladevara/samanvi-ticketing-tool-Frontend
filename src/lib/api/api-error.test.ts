import { describe, expect, it } from 'vitest'

import { ApiError } from './api-error'

describe('ApiError', () => {
  it('sets name, message, status, and details', () => {
    const details = { field: 'username' }
    const error = new ApiError('Invalid credentials', 401, details)

    expect(error).toBeInstanceOf(Error)
    expect(error).toBeInstanceOf(ApiError)
    expect(error.name).toBe('ApiError')
    expect(error.message).toBe('Invalid credentials')
    expect(error.status).toBe(401)
    expect(error.details).toBe(details)
  })

  it('allows optional status and details', () => {
    const error = new ApiError('Something went wrong')

    expect(error.status).toBeUndefined()
    expect(error.details).toBeUndefined()
  })

  it('preserves empty message', () => {
    const error = new ApiError('', 500)

    expect(error.message).toBe('')
    expect(error.status).toBe(500)
  })
})
