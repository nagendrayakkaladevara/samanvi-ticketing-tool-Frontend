vi.mock('ag-grid-react', () => import('@/test/mocks/ag-grid-react'))
import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { renderWithProviders } from '@/test/render-with-providers'

vi.mock('@/hooks/use-dark-mode', () => ({ useDarkMode: () => false }))
vi.mock('@/hooks/use-current-user', () => ({ useCurrentUser: () => ({ id: 'u1', name: 'Admin' }) }))
vi.mock('@/features/tickets/api/tickets.service', () => ({ ticketsService: { remove: vi.fn() } }))
vi.mock('@/lib/toast', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))
vi.mock('@/features/tickets/utils/ticket-share', () => ({
  shareTicketViaWhatsApp: vi.fn(),
  getTicketShareDisplayId: () => 'TKT-001',
}))

import { TicketsListView } from './tickets-list-view'

const ticket = {
  id: 't1',
  ticketNumber: 'TKT-001',
  title: 'Engine issue',
  status: 'assigned',
  severity: 'high',
  priority: 'p2',
  slaDueAt: '2024-06-15T12:00:00Z',
  createdAt: '2024-06-01T08:00:00Z',
  updatedAt: '2024-06-02T08:00:00Z',
  bus: { id: 'b1', busNumber: 'BUS-01' },
  category: { id: 'c1', name: 'Mechanical' },
  createdBy: { id: 'u1', username: 'admin', displayName: 'Admin' },
  assignedTo: { id: 'u2', username: 'tech', displayName: 'Tech' },
  isOverdue: false,
}

describe('TicketsListView', () => {
  it('renders empty state', () => {
    renderWithProviders(
      <TicketsListView tickets={[]} isLoading={false} isError={false} error={null} />,
    )
    expect(screen.getByText(/No tickets/i)).toBeInTheDocument()
  })

  it('renders grid when tickets exist', () => {
    renderWithProviders(
      <TicketsListView tickets={[ticket as never]} isLoading={false} isError={false} error={null} />,
    )
    expect(screen.getByTestId('ag-grid')).toBeInTheDocument()
  })
})
