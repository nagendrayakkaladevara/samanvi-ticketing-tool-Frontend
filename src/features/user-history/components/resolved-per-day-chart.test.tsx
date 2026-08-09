import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

vi.mock('@/components/ui/chart', () => ({
  ChartContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="recharts-bar-chart">{children}</div>
  ),
  ChartTooltip: () => null,
  ChartTooltipContent: () => null,
}))

import { ResolvedPerDayChart } from './resolved-per-day-chart'

describe('ResolvedPerDayChart', () => {
  it('renders chart when data is provided', () => {
    render(<ResolvedPerDayChart data={[{ date: '2024-06-01', count: 3 }]} />)

    expect(screen.getByText('Resolutions per day')).toBeInTheDocument()
    expect(screen.getByTestId('recharts-bar-chart')).toBeInTheDocument()
  })

  it('shows empty message without data', () => {
    render(<ResolvedPerDayChart data={[]} />)
    expect(screen.getByText('No resolutions recorded in this window.')).toBeInTheDocument()
  })
})
