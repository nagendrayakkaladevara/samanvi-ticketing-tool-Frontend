vi.mock('ag-grid-react', () => import('@/test/mocks/ag-grid-react'))
import { screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { makeSpareTank } from '@/test/fixtures/masters'
import { renderWithProviders } from '@/test/render-with-providers'

vi.mock('@/hooks/use-dark-mode', () => ({ useDarkMode: () => false }))
vi.mock('@/hooks/use-mobile', () => ({ useIsMobile: () => false }))
vi.mock('framer-motion', () => import('@/test/mocks/framer-motion'))
vi.mock('@/features/spare-tanks/api/spare-tanks.service', () => ({
  spareTanksService: { remove: vi.fn() },
}))
vi.mock('@/lib/toast', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

import { SpareTanksGrid } from './spare-tanks-grid'

describe('SpareTanksGrid', () => {
  it('renders empty state', () => {
    renderWithProviders(
      <SpareTanksGrid spareTanks={[]} isLoading={false} isError={false} error={null} onEdit={vi.fn()} />,
    )
    expect(screen.getByText('No spare tanks registered')).toBeInTheDocument()
  })

  it('renders grid with data', () => {
    renderWithProviders(
      <SpareTanksGrid
        spareTanks={[makeSpareTank()]}
        isLoading={false}
        isError={false}
        error={null}
        onEdit={vi.fn()}
      />,
    )
    expect(screen.getByTestId('ag-grid')).toBeInTheDocument()
  })
})
