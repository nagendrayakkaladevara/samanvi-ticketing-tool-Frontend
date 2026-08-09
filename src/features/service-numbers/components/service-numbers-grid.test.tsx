vi.mock('ag-grid-react', () => import('@/test/mocks/ag-grid-react'))
import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { makeServiceNumber } from '@/test/fixtures/masters'

vi.mock('@/hooks/use-dark-mode', () => ({ useDarkMode: () => false }))
vi.mock('@/hooks/use-mobile', () => ({ useIsMobile: () => false }))
vi.mock('@/features/service-numbers/api/service-numbers.service', () => ({
  serviceNumbersService: { remove: vi.fn() },
}))
vi.mock('@/lib/toast', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

import { ServiceNumbersGrid } from './service-numbers-grid'

describe('ServiceNumbersGrid', () => {
  it('renders empty state', () => {
    render(
      <ServiceNumbersGrid items={[]} isLoading={false} isError={false} error={null} onEdit={vi.fn()} onView={vi.fn()} />,
    )
    expect(screen.getByText(/No service numbers/i)).toBeInTheDocument()
  })

  it('renders grid with data', () => {
    render(
      <ServiceNumbersGrid
        items={[makeServiceNumber()]}
        isLoading={false}
        isError={false}
        error={null}
        onEdit={vi.fn()}
        onView={vi.fn()}
      />,
    )
    expect(screen.getByTestId('ag-grid')).toBeInTheDocument()
  })
})
