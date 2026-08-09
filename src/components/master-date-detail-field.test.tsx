import { render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { MasterDateDetailField } from './master-date-detail-field'

describe('MasterDateDetailField', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2024-06-15T12:00:00Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders label and value', () => {
    render(<MasterDateDetailField label="Insurance" value="15-06-2025" dateValue="15-06-2025" />)

    expect(screen.getByText('Insurance')).toBeInTheDocument()
    expect(screen.getByText('15-06-2025')).toBeInTheDocument()
  })

  it('applies expired highlight classes for past dates', () => {
    const { container } = render(
      <MasterDateDetailField label="Permit" value="01-01-2024" dateValue="01-01-2024" />,
    )

    expect(container.firstChild).toHaveClass('border-destructive/60')
    expect(screen.getByText('Permit')).toHaveClass('text-destructive')
  })

  it('applies warning highlight classes for dates within six days', () => {
    const { container } = render(
      <MasterDateDetailField label="Fitness" value="18-06-2024" dateValue="18-06-2024" />,
    )

    expect(container.firstChild).toHaveClass('border-orange-500/60')
    expect(screen.getByText('Fitness')).toHaveClass('text-orange-600')
  })

  it('uses muted styling for empty display values', () => {
    render(<MasterDateDetailField label="Tax" value="—" />)

    expect(screen.getByText('—')).toHaveClass('text-muted-foreground')
  })

  it('skips highlight when dateValue is absent', () => {
    const { container } = render(<MasterDateDetailField label="Tax" value="—" dateValue={null} />)

    expect(container.firstChild).not.toHaveClass('border-destructive/60')
    expect(container.firstChild).not.toHaveClass('border-orange-500/60')
  })
})
