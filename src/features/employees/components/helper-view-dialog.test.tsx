import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { makeHelper } from '@/test/fixtures/employees'

vi.mock('@/features/employees/hooks/use-helpers-query', () => ({
  useHelperDetailQuery: () => ({ data: null, isLoading: false }),
}))

import { HelperViewDialog } from './helper-view-dialog'

describe('HelperViewDialog', () => {
  it('renders helper details', () => {
    render(
      <HelperViewDialog open item={makeHelper({ aadharName: 'Helper One' })} onOpenChange={vi.fn()} />,
    )
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getAllByText('Helper One').length).toBeGreaterThan(0)
  })
})
