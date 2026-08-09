import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { Dialog, DialogContent } from '@/components/ui/dialog'

import {
  EmployeeDetailItem,
  EmployeeFormSection,
  EmployeeRecordDialogHeader,
} from './employee-shared'

describe('employee-shared', () => {
  it('renders dialog header', () => {
    render(
      <Dialog open>
        <DialogContent>
          <EmployeeRecordDialogHeader
            icon={<span>icon</span>}
            idNumber="DRV-001"
            aadharName="John Driver"
            emptyTitle="Driver"
            emptyDescription="Create driver"
          />
        </DialogContent>
      </Dialog>,
    )
    expect(screen.getByText('DRV-001')).toBeInTheDocument()
    expect(screen.getByText('John Driver')).toBeInTheDocument()
  })

  it('renders form section and detail item', () => {
    render(
      <EmployeeFormSection title="Personal">
        <EmployeeDetailItem label="Name" value="John Driver" />
      </EmployeeFormSection>,
    )
    expect(screen.getByText('Personal')).toBeInTheDocument()
    expect(screen.getByText('John Driver')).toBeInTheDocument()
  })
})
