import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { makeDriver } from '@/test/fixtures/employees'

vi.mock('@/features/employees/hooks/use-drivers-query', () => ({
  useDriverDetailQuery: () => ({ data: null, isLoading: false }),
}))

import { DriverViewDialog } from './driver-view-dialog'

describe('DriverViewDialog', () => {
  it('renders driver details', () => {
    render(
      <DriverViewDialog open item={makeDriver({ aadharName: 'John Driver' })} onOpenChange={vi.fn()} />,
    )
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getAllByText('John Driver').length).toBeGreaterThan(0)
  })
})
