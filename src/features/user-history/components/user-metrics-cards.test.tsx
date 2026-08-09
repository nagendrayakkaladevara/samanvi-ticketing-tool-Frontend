import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { makeUserMetrics } from '@/test/fixtures/user-history'

import { UserMetricsCards } from './user-metrics-cards'

describe('UserMetricsCards', () => {
  it('renders key metric labels and values', () => {
    render(<UserMetricsCards metrics={makeUserMetrics()} />)

    expect(screen.getByText('Open assigned')).toBeInTheDocument()
    expect(screen.getByText('3')).toBeInTheDocument()
    expect(screen.getByText('Created tickets')).toBeInTheDocument()
    expect(screen.getByText('5')).toBeInTheDocument()
  })
})
