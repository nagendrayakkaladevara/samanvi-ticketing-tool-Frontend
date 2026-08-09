import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { renderWithProviders } from '@/test/render-with-providers'

vi.mock('@/features/garage/hooks/use-repair-parts-query', () => ({
  useRepairPartsQuery: () => ({ data: [{ id: 'rp-1', partName: 'Oil Filter', price: '25.00' }], isLoading: false }),
}))
vi.mock('@/features/garage/api/garage.service', () => ({
  garageService: { addRepairJobPart: vi.fn() },
}))
vi.mock('@/lib/toast', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

import { AddJobPartDialog } from './add-job-part-dialog'

describe('AddJobPartDialog', () => {
  it('renders add part dialog', () => {
    renderWithProviders(<AddJobPartDialog open jobId="job-1" onOpenChange={vi.fn()} />)
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByText('Add Spare Part')).toBeInTheDocument()
  })
})
