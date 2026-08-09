import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { makeAppUser } from '@/test/fixtures/users'

import { UserMobileCard, UserMobileCardSkeleton } from './user-mobile-card'

describe('UserMobileCard', () => {
  it('renders user details and handles actions', async () => {
    const user = userEvent.setup()
    const onEdit = vi.fn()
    const onViewHistory = vi.fn()

    render(
      <UserMobileCard
        user={makeAppUser({ displayName: 'Jane Doe', username: 'jdoe' })}
        onEdit={onEdit}
        onDelete={vi.fn()}
        onViewHistory={onViewHistory}
      />,
    )

    expect(screen.getByRole('article', { name: 'User Jane Doe' })).toBeInTheDocument()
    expect(screen.getAllByText('jdoe').length).toBeGreaterThan(0)
    expect(screen.getByText('Active')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Analytics' }))
    await user.click(screen.getByRole('button', { name: 'Edit' }))
    expect(onViewHistory).toHaveBeenCalled()
    expect(onEdit).toHaveBeenCalled()
  })

  it('renders skeleton placeholder', () => {
    const { container } = render(<UserMobileCardSkeleton />)
    expect(container.querySelector('.ticket-mobile-card--skeleton')).toBeInTheDocument()
  })
})
