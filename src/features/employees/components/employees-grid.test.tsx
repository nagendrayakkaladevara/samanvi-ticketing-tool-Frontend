vi.mock('ag-grid-react', () => import('@/test/mocks/ag-grid-react'))
import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { makeDriver } from '@/test/fixtures/employees'
import { driverDataColumnDefs, driverMobileBadge, driverMobileFields } from './employees-grid-columns'

vi.mock('@/hooks/use-dark-mode', () => ({ useDarkMode: () => false }))

import { EmployeesGrid } from './employees-grid'

describe('EmployeesGrid', () => {
  it('renders empty state', () => {
    render(
      <EmployeesGrid
        items={[]}
        dataColumnDefs={driverDataColumnDefs}
        mobileBadge={driverMobileBadge}
        mobileFields={driverMobileFields}
        isLoading={false}
        isError={false}
        error={null}
        emptyIcon={<span>icon</span>}
        emptyTitle="No drivers"
        emptyDescription="Add a driver"
        onView={vi.fn()}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />,
    )
    expect(screen.getByText('No drivers')).toBeInTheDocument()
  })

  it('renders grid with employees', () => {
    render(
      <EmployeesGrid
        items={[makeDriver()]}
        dataColumnDefs={driverDataColumnDefs}
        mobileBadge={driverMobileBadge}
        mobileFields={driverMobileFields}
        isLoading={false}
        isError={false}
        error={null}
        emptyIcon={<span>icon</span>}
        emptyTitle="No drivers"
        emptyDescription="Add a driver"
        onView={vi.fn()}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />,
    )
    expect(screen.getByTestId('ag-grid')).toBeInTheDocument()
  })
})
