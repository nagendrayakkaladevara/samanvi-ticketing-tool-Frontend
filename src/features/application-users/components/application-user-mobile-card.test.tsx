vi.mock('framer-motion', () => import('@/test/mocks/framer-motion'))
vi.mock('@/hooks/use-mobile', () => ({ useIsMobile: () => false }))

import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { ApplicationUserMobileCard, ApplicationUserMobileCardSkeleton } from './application-user-mobile-card'

const user = {
  id: 'au-1',
  displayName: 'App User',
  mobileNumber: '9876543210',
  username: 'appuser',
  email: 'app@example.com',
  userType: 'worker' as const,
  isActive: true,
  permissionIds: [],
}

describe('ApplicationUserMobileCard', () => {
  it('renders user card and handles edit', async () => {
    const userEventApi = userEvent.setup()
    const onEdit = vi.fn()

    render(
      <ApplicationUserMobileCard
        user={user}
        canEdit
        onView={vi.fn()}
        onEdit={onEdit}
        onDelete={vi.fn()}
      />,
    )

    expect(screen.getByText('App User')).toBeInTheDocument()
    await userEventApi.click(screen.getByRole('button', { name: 'Edit' }))
    expect(onEdit).toHaveBeenCalled()
  })

  it('renders skeleton', () => {
    const { container } = render(<ApplicationUserMobileCardSkeleton />)
    expect(container.querySelector('.ticket-mobile-card--skeleton')).toBeInTheDocument()
  })
})
