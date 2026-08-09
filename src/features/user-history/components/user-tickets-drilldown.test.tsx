import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { makeActivityItem, makeUserTicketItem } from '@/test/fixtures/user-history'
import { renderWithProviders } from '@/test/render-with-providers'

vi.mock('@/features/user-history/hooks/use-user-tickets-query', () => ({
  useUserTicketsQuery: vi.fn(),
}))

vi.mock('@/features/user-history/hooks/use-user-activity-query', () => ({
  useUserActivityQuery: vi.fn(),
}))

import { useUserActivityQuery } from '@/features/user-history/hooks/use-user-activity-query'
import { useUserTicketsQuery } from '@/features/user-history/hooks/use-user-tickets-query'
import { UserTicketsDrilldown } from './user-tickets-drilldown'

describe('UserTicketsDrilldown', () => {
  it('renders tickets tab with data', () => {
    vi.mocked(useUserTicketsQuery).mockReturnValue({
      data: { items: [makeUserTicketItem()], meta: { page: 1, totalPages: 1, total: 1, limit: 10 } },
      isLoading: false,
      isFetching: false,
    } as never)
    vi.mocked(useUserActivityQuery).mockReturnValue({
      data: { items: [], meta: { page: 1, totalPages: 0, total: 0, limit: 10 } },
      isLoading: false,
      isFetching: false,
    } as never)

    renderWithProviders(<UserTicketsDrilldown userId="user-1" />)

    expect(screen.getByText('Full history')).toBeInTheDocument()
    expect(screen.getAllByText('Brake inspection').length).toBeGreaterThan(0)
  })

  it('switches to activity tab', async () => {
    const user = userEvent.setup()
    vi.mocked(useUserTicketsQuery).mockReturnValue({
      data: { items: [], meta: { page: 1, totalPages: 0, total: 0, limit: 10 } },
      isLoading: false,
      isFetching: false,
    } as never)
    vi.mocked(useUserActivityQuery).mockReturnValue({
      data: { items: [makeActivityItem()], meta: { page: 1, totalPages: 1, total: 1, limit: 10 } },
      isLoading: false,
      isFetching: false,
    } as never)

    renderWithProviders(<UserTicketsDrilldown userId="user-1" />)

    await user.click(screen.getByRole('tab', { name: 'Activity' }))
    expect(screen.getByText('status changed')).toBeInTheDocument()
  })
})
