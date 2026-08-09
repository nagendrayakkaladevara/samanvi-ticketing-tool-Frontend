vi.mock('framer-motion', () => import('@/test/mocks/framer-motion'))
vi.mock('@/hooks/use-mobile', () => ({ useIsMobile: () => false }))

import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { JobMobileCard, JobMobileCardSkeleton } from './job-mobile-card'

describe('JobMobileCard', () => {
  it('renders job id and view action', async () => {
    const user = userEvent.setup()
    const onView = vi.fn()

    render(
      <JobMobileCard
        jobIdNumber="RJ-100"
        description="Fix brakes"
        busNumber="BUS-01"
        category="Brakes"
        priority="medium"
        status="in progress"
        assignedTo="Alex"
        createdBy="Admin"
        createdAt="01 Jun 2024"
        onView={onView}
      />,
    )

    expect(screen.getByText('RJ-100')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'View job RJ-100' }))
    expect(onView).toHaveBeenCalled()
  })

  it('renders skeleton', () => {
    const { container } = render(<JobMobileCardSkeleton />)
    expect(container.querySelector('.ticket-mobile-card--skeleton')).toBeInTheDocument()
  })
})
