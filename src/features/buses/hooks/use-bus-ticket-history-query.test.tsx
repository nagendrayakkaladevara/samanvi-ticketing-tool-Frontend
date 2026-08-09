import { renderHook, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { busesService } from '@/features/buses/api/buses.service'
import { createWrapper } from '@/test/test-utils'
import { useBusTicketHistoryQuery } from './use-bus-ticket-history-query'

vi.mock('@/features/buses/api/buses.service', () => ({
  busesService: { listTicketHistory: vi.fn() },
}))

describe('useBusTicketHistoryQuery', () => {
  it('does not fetch when busId is empty', () => {
    const { result } = renderHook(() => useBusTicketHistoryQuery(''), { wrapper: createWrapper() })

    expect(result.current.fetchStatus).toBe('idle')
    expect(busesService.listTicketHistory).not.toHaveBeenCalled()
  })

  it('fetches ticket history for a bus id', async () => {
    const tickets = [{ id: 't1', title: 'Issue', status: 'CREATED', severity: 'LOW', priority: 'P3' }]
    vi.mocked(busesService.listTicketHistory).mockResolvedValue(tickets)

    const { result } = renderHook(() => useBusTicketHistoryQuery('bus-1'), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(busesService.listTicketHistory).toHaveBeenCalledWith('bus-1')
    expect(result.current.data).toEqual(tickets)
  })
})
