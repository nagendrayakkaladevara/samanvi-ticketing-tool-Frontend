import { screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { makeServiceFor } from '@/test/fixtures/masters'
import { renderWithProviders } from '@/test/render-with-providers'

vi.mock('@/features/service-numbers/api/service-numbers.service', () => ({
  serviceNumbersService: { create: vi.fn(), update: vi.fn() },
}))
vi.mock('@/lib/toast', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

import { ServiceNumberFormDialog } from './service-number-form-dialog'

describe('ServiceNumberFormDialog', () => {
  it('renders create dialog', () => {
    renderWithProviders(
      <ServiceNumberFormDialog
        open
        mode="create"
        editingItem={null}
        serviceForOptions={[makeServiceFor()]}
        onOpenChange={vi.fn()}
      />,
    )
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByRole('textbox', { name: /service number/i })).toBeInTheDocument()
  })
})
