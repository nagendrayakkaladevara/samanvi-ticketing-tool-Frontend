import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { StatusBreakdownBars } from './status-breakdown-bars'

describe('StatusBreakdownBars', () => {
  it('renders status counts', () => {
    render(
      <StatusBreakdownBars
        title="Assigned tickets"
        description="By status"
        breakdown={{ assigned: 2, in_progress: 1 }}
      />,
    )

    expect(screen.getByText('Assigned tickets')).toBeInTheDocument()
    expect(screen.getByText('assigned')).toBeInTheDocument()
    expect(screen.getByText('in progress')).toBeInTheDocument()
  })

  it('shows empty state when no breakdown data', () => {
    render(
      <StatusBreakdownBars title="Empty" description="No data" breakdown={{}} />,
    )

    expect(screen.getByText('No tickets in this category.')).toBeInTheDocument()
  })
})
