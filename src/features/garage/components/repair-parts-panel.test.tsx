import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { makeRepairPart } from '@/test/fixtures/garage'
import { renderWithProviders } from '@/test/render-with-providers'

vi.mock('@/features/garage/api/garage.service', () => ({
  garageService: { deleteRepairPart: vi.fn() },
}))
vi.mock('@/lib/toast', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

import { RepairPartsPanel } from './repair-parts-panel'

describe('RepairPartsPanel', () => {
  it('renders parts list', () => {
    renderWithProviders(
      <RepairPartsPanel
        parts={[makeRepairPart({ partName: 'Brake Pad' })]}
        isLoading={false}
        isError={false}
        error={null}
        canEdit
      />,
    )

    expect(screen.getAllByText('Brake Pad').length).toBeGreaterThan(0)
  })

  it('shows empty state', () => {
    renderWithProviders(
      <RepairPartsPanel parts={[]} isLoading={false} isError={false} error={null} />,
    )
    expect(screen.getByText('No repair parts in catalog')).toBeInTheDocument()
  })
})
