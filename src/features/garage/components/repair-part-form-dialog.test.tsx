import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { renderWithProviders } from '@/test/render-with-providers'

vi.mock('@/features/garage/api/garage.service', () => ({
  garageService: { createRepairPart: vi.fn(), updateRepairPart: vi.fn() },
}))
vi.mock('@/lib/toast', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

import { RepairPartFormDialog } from './repair-part-form-dialog'

describe('RepairPartFormDialog', () => {
  it('renders create part dialog', () => {
    renderWithProviders(
      <RepairPartFormDialog open mode="create" editingPart={null} onOpenChange={vi.fn()} />,
    )
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByLabelText(/Part name/i)).toBeInTheDocument()
  })
})
