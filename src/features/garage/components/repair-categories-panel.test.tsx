import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { makeRepairCategoryNode } from '@/test/fixtures/garage'
import { renderWithProviders } from '@/test/render-with-providers'

vi.mock('@/features/garage/api/garage.service', () => ({
  garageService: { deleteRepairCategory: vi.fn() },
}))
vi.mock('@/lib/toast', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

import { RepairCategoriesPanel } from './repair-categories-panel'

describe('RepairCategoriesPanel', () => {
  it('renders category tree', () => {
    renderWithProviders(
      <RepairCategoriesPanel
        tree={[makeRepairCategoryNode({ name: 'Engine' })]}
        isLoading={false}
        isError={false}
        error={null}
        canCreate
      />,
    )

    expect(screen.getByText('Engine')).toBeInTheDocument()
  })

  it('shows loading skeleton', () => {
    const { container } = renderWithProviders(
      <RepairCategoriesPanel tree={[]} isLoading isError={false} error={null} />,
    )
    expect(container.querySelector('.h-12')).toBeTruthy()
  })
})
