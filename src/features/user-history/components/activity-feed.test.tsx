import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { makeActivityItem } from '@/test/fixtures/user-history'
import { renderWithProviders } from '@/test/render-with-providers'

import { ActivityFeed } from './activity-feed'

describe('ActivityFeed', () => {
  it('renders activity items', () => {
    renderWithProviders(
      <ActivityFeed
        title="Activity"
        description="Recent actions"
        items={[makeActivityItem()]}
        emptyMessage="No activity"
      />,
    )

    expect(screen.getByText('Activity')).toBeInTheDocument()
    expect(screen.getByText('Changed status')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Ticket' })).toBeInTheDocument()
  })

  it('shows empty message when no items', () => {
    renderWithProviders(
      <ActivityFeed title="Activity" description="Recent" items={[]} emptyMessage="No activity yet" />,
    )
    expect(screen.getByText('No activity yet')).toBeInTheDocument()
  })
})
