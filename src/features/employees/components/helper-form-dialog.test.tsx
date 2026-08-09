import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { renderWithProviders } from '@/test/render-with-providers'

vi.mock('@/features/employees/api/helpers.service', () => ({
  helpersService: { create: vi.fn(), update: vi.fn(), getById: vi.fn() },
}))
vi.mock('@/features/employees/hooks/use-helpers-query', () => ({
  useHelperDetailQuery: () => ({ data: null, isLoading: false }),
}))
vi.mock('@/lib/toast', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

import { HelperFormDialog } from './helper-form-dialog'

describe('HelperFormDialog', () => {
  it('renders create helper dialog', () => {
    renderWithProviders(
      <HelperFormDialog open mode="create" editingItem={null} onOpenChange={vi.fn()} />,
    )
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByLabelText(/Aadhar name/i)).toBeInTheDocument()
  })
})
