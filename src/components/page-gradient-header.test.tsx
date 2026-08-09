import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { PageGradientHeader } from './page-gradient-header'

describe('PageGradientHeader', () => {
  it('renders eyebrow, title, and description', () => {
    render(
      <PageGradientHeader
        eyebrow="Fleet"
        title="Master Buses"
        description="Manage fleet compliance dates."
      />,
    )

    expect(screen.getByRole('banner')).toBeInTheDocument()
    expect(screen.getByText('Fleet')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Master Buses' })).toBeInTheDocument()
    expect(screen.getByText('Manage fleet compliance dates.')).toBeInTheDocument()
  })

  it('renders optional actions', () => {
    render(
      <PageGradientHeader
        eyebrow="Tickets"
        title="Open Tickets"
        description="Track issues."
        actions={<button type="button">Add ticket</button>}
      />,
    )

    expect(screen.getByRole('button', { name: 'Add ticket' })).toBeInTheDocument()
  })
})
