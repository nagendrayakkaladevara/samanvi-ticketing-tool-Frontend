import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { renderWithProviders } from '@/test/render-with-providers'

vi.mock('@/features/employees/api/drivers.service', () => ({
  driversService: { create: vi.fn(), update: vi.fn(), getById: vi.fn() },
}))
vi.mock('@/features/employees/hooks/use-drivers-query', () => ({
  useDriverDetailQuery: () => ({ data: null, isLoading: false }),
}))
vi.mock('@/lib/toast', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

import { DriverFormDialog } from './driver-form-dialog'

describe('DriverFormDialog', () => {
  it('renders create driver dialog', () => {
    renderWithProviders(
      <DriverFormDialog open mode="create" editingItem={null} onOpenChange={vi.fn()} />,
    )
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByLabelText(/Aadhar name/i)).toBeInTheDocument()
  })
})
