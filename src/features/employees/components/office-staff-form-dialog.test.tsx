import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { renderWithProviders } from '@/test/render-with-providers'

vi.mock('@/features/employees/api/office-staff.service', () => ({
  officeStaffService: { create: vi.fn(), update: vi.fn(), getById: vi.fn() },
}))
vi.mock('@/features/employees/hooks/use-office-staff-query', () => ({
  useOfficeStaffDetailQuery: () => ({ data: null, isLoading: false }),
}))
vi.mock('@/lib/toast', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

import { OfficeStaffFormDialog } from './office-staff-form-dialog'

describe('OfficeStaffFormDialog', () => {
  it('renders create office staff dialog', () => {
    renderWithProviders(
      <OfficeStaffFormDialog open mode="create" editingItem={null} onOpenChange={vi.fn()} />,
    )
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByLabelText(/Full Name/i)).toBeInTheDocument()
  })
})
