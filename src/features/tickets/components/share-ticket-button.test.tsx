import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

const shareTicketViaWhatsApp = vi.fn()

vi.mock('@/features/tickets/utils/ticket-share', () => ({
  shareTicketViaWhatsApp: (...args: unknown[]) => shareTicketViaWhatsApp(...args),
  getTicketShareDisplayId: () => 'TKT-001',
}))

import { ShareTicketButton } from './share-ticket-button'

describe('ShareTicketButton', () => {
  it('shares ticket via WhatsApp on click', async () => {
    const user = userEvent.setup()

    render(<ShareTicketButton ticketId="t1" ticketNumber="TKT-001" title="Engine issue" />)

    await user.click(screen.getByRole('button', { name: /Share ticket TKT-001/i }))
    expect(shareTicketViaWhatsApp).toHaveBeenCalledWith({
      ticketId: 't1',
      ticketNumber: 'TKT-001',
      title: 'Engine issue',
    })
  })
})
