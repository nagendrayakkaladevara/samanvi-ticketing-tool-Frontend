import { QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { describe, expect, it, vi } from 'vitest'

import type { Ticket } from '@/features/tickets/types/ticket'
import { createTestQueryClient } from '@/test/test-utils'

import { useFilteredTicketsQuery } from './use-filtered-tickets-query'

vi.mock('@/features/tickets/api/tickets.service', () => ({
  ticketsService: {
    list: vi.fn(),
  },
}))

import { ticketsService } from '@/features/tickets/api/tickets.service'

function makeTicket(overrides: Partial<Ticket> = {}): Ticket {
  return {
    id: 't1',
    busNumber: 'BUS',
    title: 'Title',
    description: '',
    status: 'CREATED',
    severity: 'LOW',
    priority: 'P3',
    category: 'General',
    slaDueAt: '',
    ...overrides,
  }
}

function createWrapper() {
  const queryClient = createTestQueryClient()
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  }
}

describe('useFilteredTicketsQuery', () => {
  it('fetches tickets for a single status filter', async () => {
    vi.mocked(ticketsService.list).mockResolvedValue([makeTicket({ id: 'open-1', createdAt: '2024-02-01' })])

    const { result } = renderHook(() => useFilteredTicketsQuery('open', { days: 7 }), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(ticketsService.list).toHaveBeenCalledWith({ status: 'open', days: 7 })
    expect(result.current.data?.[0]?.id).toBe('open-1')
  })

  it('merges resolved and closed for closed_resolved filter', async () => {
    vi.mocked(ticketsService.list)
      .mockResolvedValueOnce([makeTicket({ id: 'r1', status: 'RESOLVED', createdAt: '2024-03-01' })])
      .mockResolvedValueOnce([makeTicket({ id: 'c1', status: 'CLOSED', createdAt: '2024-04-01' })])

    const { result } = renderHook(() => useFilteredTicketsQuery('closed_resolved'), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(ticketsService.list).toHaveBeenCalledWith({ status: 'resolved' })
    expect(ticketsService.list).toHaveBeenCalledWith({ status: 'closed' })
    expect(result.current.data?.map((t) => t.id)).toEqual(['c1', 'r1'])
  })

  it('merges closed_resolved with days filter', async () => {
    vi.mocked(ticketsService.list)
      .mockResolvedValueOnce([makeTicket({ id: 'r1', createdAt: '2024-03-01' })])
      .mockResolvedValueOnce([makeTicket({ id: 'c1', createdAt: '2024-04-01' })])

    const { result } = renderHook(() => useFilteredTicketsQuery('closed_resolved', { days: 30 }), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(ticketsService.list).toHaveBeenCalledWith({ status: 'resolved', days: 30 })
    expect(ticketsService.list).toHaveBeenCalledWith({ status: 'closed', days: 30 })
  })

  it('sorts tickets by id when createdAt is equal', async () => {
    vi.mocked(ticketsService.list).mockResolvedValue([
      makeTicket({ id: 'a-ticket', createdAt: '2024-01-01' }),
      makeTicket({ id: 'b-ticket', createdAt: '2024-01-01' }),
    ])

    const { result } = renderHook(() => useFilteredTicketsQuery('open'), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.map((t) => t.id)).toEqual(['b-ticket', 'a-ticket'])
  })

  it('sorts tickets with missing createdAt as zero', async () => {
    vi.mocked(ticketsService.list).mockResolvedValue([
      makeTicket({ id: 'older', createdAt: undefined }),
      makeTicket({ id: 'newer', createdAt: '2024-02-01' }),
    ])

    const { result } = renderHook(() => useFilteredTicketsQuery('open'), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.[0]?.id).toBe('newer')
  })

  it('respects enabled:false', () => {
    const { result } = renderHook(() => useFilteredTicketsQuery('open', { enabled: false }), {
      wrapper: createWrapper(),
    })

    expect(result.current.fetchStatus).toBe('idle')
    expect(ticketsService.list).not.toHaveBeenCalled()
  })

  it('fetches tickets without days when days option omitted', async () => {
    vi.mocked(ticketsService.list).mockResolvedValue([
      makeTicket({ id: 'older', createdAt: '2024-01-01' }),
      makeTicket({ id: 'newer', createdAt: '2024-02-01' }),
    ])

    const { result } = renderHook(() => useFilteredTicketsQuery('assigned'), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(ticketsService.list).toHaveBeenCalledWith({ status: 'assigned' })
    expect(result.current.data?.[0]?.id).toBe('newer')
  })
})
