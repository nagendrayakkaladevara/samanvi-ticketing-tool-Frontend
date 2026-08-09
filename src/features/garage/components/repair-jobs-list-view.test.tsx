vi.mock('ag-grid-react', () => import('@/test/mocks/ag-grid-react'))
vi.mock('framer-motion', () => import('@/test/mocks/framer-motion'))
import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { makeRepairJob } from '@/test/fixtures/garage'
import { renderWithProviders } from '@/test/render-with-providers'

vi.mock('@/hooks/use-dark-mode', () => ({ useDarkMode: () => false }))
vi.mock('@/hooks/use-mobile', () => ({ useIsMobile: () => false }))
vi.mock('@/features/garage/api/garage.service', () => ({ garageService: { deleteRepairJob: vi.fn() } }))
vi.mock('@/lib/toast', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

import { RepairJobsListView } from './repair-jobs-list-view'

describe('RepairJobsListView', () => {
  it('renders empty state', () => {
    renderWithProviders(
      <RepairJobsListView jobs={[]} isLoading={false} isError={false} error={null} />,
    )
    expect(screen.getByText(/No repair jobs/i)).toBeInTheDocument()
  })

  it('renders grid when jobs exist', () => {
    renderWithProviders(
      <RepairJobsListView jobs={[makeRepairJob()]} isLoading={false} isError={false} error={null} />,
    )
    expect(screen.getByTestId('ag-grid')).toBeInTheDocument()
  })
})
