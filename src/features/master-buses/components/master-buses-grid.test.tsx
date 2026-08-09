vi.mock('ag-grid-react', () => import('@/test/mocks/ag-grid-react'))
vi.mock('framer-motion', () => import('@/test/mocks/framer-motion'))
import { screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { makeMasterBus } from '@/test/fixtures/masters'
import { renderWithProviders } from '@/test/render-with-providers'

vi.mock('@/hooks/use-dark-mode', () => ({ useDarkMode: () => false }))
vi.mock('@/hooks/use-mobile', () => ({ useIsMobile: () => false }))
vi.mock('@/features/master-buses/api/master-buses.service', () => ({
  masterBusesService: { remove: vi.fn() },
}))
vi.mock('@/lib/toast', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

import { MasterBusesGrid } from './master-buses-grid'

describe('MasterBusesGrid', () => {
  it('renders empty state when no buses', () => {
    renderWithProviders(
      <MasterBusesGrid buses={[]} isLoading={false} isError={false} error={null} onEdit={vi.fn()} />,
    )

    expect(screen.getByText('No buses registered')).toBeInTheDocument()
  })

  it('renders ag grid when buses exist on desktop', () => {
    renderWithProviders(
      <MasterBusesGrid
        buses={[makeMasterBus()]}
        isLoading={false}
        isError={false}
        error={null}
        onEdit={vi.fn()}
      />,
    )

    expect(screen.getByTestId('ag-grid')).toHaveAttribute('data-row-count', '1')
  })
})
