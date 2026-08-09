import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { renderWithProviders } from '@/test/render-with-providers'

vi.mock('@/features/spare-tanks/api/spare-tanks.service', () => ({
  spareTanksService: { create: vi.fn(), update: vi.fn() },
}))
vi.mock('@/features/master-buses/hooks/use-master-buses-query', () => ({
  useMasterBusNumbersQuery: () => ({ data: ['BUS-01'] }),
}))
vi.mock('@/lib/toast', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

import { SpareTankFormDialog } from './spare-tank-form-dialog'

describe('SpareTankFormDialog', () => {
  it('renders create dialog', () => {
    renderWithProviders(
      <SpareTankFormDialog open mode="create" editingItem={null} onOpenChange={vi.fn()} />,
    )
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByLabelText(/Bus number/i)).toBeInTheDocument()
  })
})
