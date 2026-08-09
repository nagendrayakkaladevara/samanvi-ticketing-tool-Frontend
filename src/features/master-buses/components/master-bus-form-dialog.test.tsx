import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { renderWithProviders } from '@/test/render-with-providers'

vi.mock('@/features/master-buses/api/master-buses.service', () => ({
  masterBusesService: { create: vi.fn(), update: vi.fn() },
}))
vi.mock('@/lib/toast', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

import { MasterBusFormDialog } from './master-bus-form-dialog'

describe('MasterBusFormDialog', () => {
  it('renders create dialog fields', () => {
    renderWithProviders(
      <MasterBusFormDialog open mode="create" editingBus={null} onOpenChange={vi.fn()} />,
    )

    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByLabelText(/Bus number/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Add Bus/i })).toBeInTheDocument()
  })
})
