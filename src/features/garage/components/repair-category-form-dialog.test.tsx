import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { renderWithProviders } from '@/test/render-with-providers'

vi.mock('@/features/garage/api/garage.service', () => ({
  garageService: { createRepairCategory: vi.fn(), updateRepairCategory: vi.fn() },
}))
vi.mock('@/lib/toast', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

import { RepairCategoryFormDialog } from './repair-category-form-dialog'

describe('RepairCategoryFormDialog', () => {
  it('renders create category dialog', () => {
    renderWithProviders(
      <RepairCategoryFormDialog
        open
        mode="create-root"
        editingCategory={null}
        parentCategory={null}
        tree={[]}
        onOpenChange={vi.fn()}
      />,
    )
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByLabelText(/Category name/i)).toBeInTheDocument()
  })
})
