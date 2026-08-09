import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

vi.mock('@/features/tickets/utils/ticket-share', () => ({
  shareTicketViaWhatsApp: vi.fn(),
  getTicketShareDisplayId: () => 'TKT-001',
}))

import { TicketMobileCard, TicketMobileCardSkeleton } from './ticket-mobile-card'

describe('TicketMobileCard', () => {
  it('renders ticket details and handles view', async () => {
    const user = userEvent.setup()
    const onView = vi.fn()

    render(
      <TicketMobileCard
        ticketId="t1"
        ticketNumber="TKT-001"
        title="Engine issue"
        busNumber="BUS-01"
        createdBy="Admin"
        assignedTo="Tech"
        severity="HIGH"
        slaLabel="Due tomorrow"
        onView={onView}
      />,
    )

    expect(screen.getByRole('article', { name: 'Ticket TKT-001: Engine issue' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'View ticket TKT-001' }))
    expect(onView).toHaveBeenCalled()
  })

  it('renders skeleton', () => {
    const { container } = render(<TicketMobileCardSkeleton />)
    expect(container.querySelector('.ticket-mobile-card--skeleton')).toBeInTheDocument()
  })
})
