import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { makeRepairJob } from '@/test/fixtures/garage'
import { renderWithProviders } from '@/test/render-with-providers'

vi.mock('@/features/garage/api/garage.service', () => ({
  garageService: { updateRepairJobStatus: vi.fn() },
}))
vi.mock('@/lib/toast', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

import { UpdateJobStatusDialog } from './update-job-status-dialog'

describe('UpdateJobStatusDialog', () => {
  it('renders status update dialog', () => {
    renderWithProviders(
      <UpdateJobStatusDialog open job={makeRepairJob()} onOpenChange={vi.fn()} />,
    )

    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByText('Update status')).toBeInTheDocument()
  })
})
