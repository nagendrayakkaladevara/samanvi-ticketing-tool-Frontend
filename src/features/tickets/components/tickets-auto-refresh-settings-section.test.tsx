import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

const toggleAutoRefresh = vi.fn()

vi.mock('@/features/tickets/hooks/use-tickets-auto-refresh', () => ({
  useTicketsAutoRefresh: () => ({ autoRefresh: false, toggleAutoRefresh }),
}))

import { TicketsAutoRefreshSettingsSection } from './tickets-auto-refresh-settings-section'

describe('TicketsAutoRefreshSettingsSection', () => {
  it('renders toggle and calls toggle handler', async () => {
    const user = userEvent.setup()

    render(<TicketsAutoRefreshSettingsSection />)

    expect(screen.getByText('Auto refresh')).toBeInTheDocument()
    await user.click(screen.getByRole('switch', { name: 'Auto refresh tickets list' }))
    expect(toggleAutoRefresh).toHaveBeenCalled()
  })
})
