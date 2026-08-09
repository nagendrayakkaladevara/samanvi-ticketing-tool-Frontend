import { beforeEach, describe, expect, it, vi } from 'vitest'

const sonnerMocks = vi.hoisted(() => ({
  success: vi.fn(),
  error: vi.fn(),
  info: vi.fn(),
  warning: vi.fn(),
  message: vi.fn(),
}))

vi.mock('sonner', () => ({
  toast: sonnerMocks,
}))

import { toast } from './toast'

describe('toast', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it.each(['success', 'error', 'info', 'warning', 'message'] as const)(
    'calls sonner %s with auto duration',
    (method) => {
      toast[method]('Hello world')
      expect(sonnerMocks[method]).toHaveBeenCalledWith('Hello world', {
        duration: expect.any(Number),
      })
    },
  )

  it('uses minimum duration for empty message', () => {
    toast.success('   ')
    expect(sonnerMocks.success).toHaveBeenCalledWith('   ', { duration: 2200 })
  })

  it('caps duration at maximum for long messages', () => {
    const longMessage = 'a'.repeat(500)
    toast.error(longMessage)
    expect(sonnerMocks.error).toHaveBeenCalledWith(longMessage, { duration: 8000 })
  })

  it('scales duration with message length within bounds', () => {
    toast.info('1234567890')
    expect(sonnerMocks.info).toHaveBeenCalledWith('1234567890', { duration: 350 })
  })

  it('respects explicit duration in options', () => {
    toast.warning('Short', { duration: 1000 })
    expect(sonnerMocks.warning).toHaveBeenCalledWith('Short', { duration: 1000 })
  })

  it('passes through additional options', () => {
    toast.message('Hi', { id: 'toast-1', description: 'Details' })
    expect(sonnerMocks.message).toHaveBeenCalledWith('Hi', {
      id: 'toast-1',
      description: 'Details',
      duration: expect.any(Number),
    })
  })
})
