import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { makeUserTicketItem } from '@/test/fixtures/user-history'
import { renderWithProviders } from '@/test/render-with-providers'

import { RecentTicketList } from './recent-ticket-list'

describe('RecentTicketList', () => {
  it('renders tickets and view buttons', () => {
    renderWithProviders(
      <RecentTicketList
        title="Recent"
        description="Latest tickets"
        tickets={[makeUserTicketItem({ title: 'Brake inspection' })]}
        emptyMessage="No tickets"
      />,
    )

    expect(screen.getByText('Recent')).toBeInTheDocument()
    expect(screen.getByText('Brake inspection')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'View' })).toBeInTheDocument()
  })

  it('shows empty message when list is empty', () => {
    renderWithProviders(
      <RecentTicketList title="Recent" description="Latest" tickets={[]} emptyMessage="No tickets yet" />,
    )

    expect(screen.getByText('No tickets yet')).toBeInTheDocument()
  })
})
