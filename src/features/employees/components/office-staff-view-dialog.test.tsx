import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { makeOfficeStaff } from '@/test/fixtures/employees'

vi.mock('@/features/employees/hooks/use-office-staff-query', () => ({
  useOfficeStaffDetailQuery: () => ({ data: null, isLoading: false }),
}))

import { OfficeStaffViewDialog } from './office-staff-view-dialog'

describe('OfficeStaffViewDialog', () => {
  it('renders office staff details', () => {
    render(
      <OfficeStaffViewDialog open item={makeOfficeStaff({ aadharName: 'Staff Member' })} onOpenChange={vi.fn()} />,
    )
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getAllByText('Staff Member').length).toBeGreaterThan(0)
  })
})
