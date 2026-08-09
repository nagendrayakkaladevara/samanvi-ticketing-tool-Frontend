import { QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { describe, expect, it, vi } from 'vitest'

import { createTestQueryClient } from '@/test/test-utils'

import { useTicketsQuery } from './use-tickets-query'

vi.mock('@/features/tickets/api/tickets.service', () => ({
  ticketsService: {
    list: vi.fn(),
  },
}))

import { ticketsService } from '@/features/tickets/api/tickets.service'

function createWrapper() {
  const queryClient = createTestQueryClient()
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  }
}

describe('useTicketsQuery', () => {
  it('fetches tickets with default query key', async () => {
    vi.mocked(ticketsService.list).mockResolvedValue([])

    const { result } = renderHook(() => useTicketsQuery(), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(ticketsService.list).toHaveBeenCalledWith()
  })

  it('accepts poll option and still fetches tickets', async () => {
    vi.mocked(ticketsService.list).mockResolvedValue([])

    const { result } = renderHook(() => useTicketsQuery({ poll: true }), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(ticketsService.list).toHaveBeenCalled()
  })

  it('does not poll when poll option is false', async () => {
    vi.mocked(ticketsService.list).mockResolvedValue([])

    const { result } = renderHook(() => useTicketsQuery({ poll: false }), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(ticketsService.list).toHaveBeenCalledTimes(1)
  })
})
