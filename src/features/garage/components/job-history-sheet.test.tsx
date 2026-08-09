import { screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { renderWithProviders } from '@/test/render-with-providers'

const { getJobTimeline } = vi.hoisted(() => ({
  getJobTimeline: vi.fn(),
}))

vi.mock('@/features/garage/api/garage.service', () => ({
  garageService: {
    getJobTimeline,
  },
}))

import { JobHistorySheet } from './job-history-sheet'

describe('JobHistorySheet', () => {
  beforeEach(() => {
    getJobTimeline.mockReset()
    getJobTimeline.mockResolvedValue({
      jobId: 'job-1',
      items: [],
    })
  })

  it('renders job history sheet header for the selected job', async () => {
    renderWithProviders(
      <JobHistorySheet
        open
        onOpenChange={vi.fn()}
        jobId="job-1"
        jobIdNumber="RJ-001"
        currentStatus="in_progress"
      />,
    )

    expect(await screen.findByText('RJ-001')).toBeInTheDocument()
    expect(screen.getByText(/activity timeline/i)).toBeInTheDocument()
    expect(await screen.findByText('No activity yet')).toBeInTheDocument()
  })
})
