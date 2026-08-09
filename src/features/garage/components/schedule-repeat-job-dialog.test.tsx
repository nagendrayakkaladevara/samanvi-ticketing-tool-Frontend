import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { renderWithProviders } from '@/test/render-with-providers'

vi.mock('@/features/garage/api/garage.service', () => ({
  garageService: { scheduleRepeatJob: vi.fn(), cancelRepeatJob: vi.fn() },
}))
vi.mock('@/lib/toast', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

import { ScheduleRepeatJobDialog } from './schedule-repeat-job-dialog'

describe('ScheduleRepeatJobDialog', () => {
  it('renders schedule repeat dialog', () => {
    renderWithProviders(
      <ScheduleRepeatJobDialog
        open
        jobId="job-1"
        jobIdNumber="RJ-001"
        onOpenChange={vi.fn()}
      />,
    )

    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByText('Create Repeat Job')).toBeInTheDocument()
  })
})
