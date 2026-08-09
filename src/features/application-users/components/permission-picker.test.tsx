import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { makePermission } from '@/test/fixtures/auth'

import { PermissionPicker } from './permission-picker'

const tree = [
  {
    module: 'users',
    label: 'Users',
    submodules: [
      {
        submodule: 'accounts',
        label: 'Accounts',
        permissions: [
          makePermission({
            id: 'p1',
            module: 'users',
            submodule: 'accounts',
            action: 'view',
            label: 'View users',
          }),
        ],
      },
    ],
  },
]

describe('PermissionPicker', () => {
  it('renders permissions and toggles selection', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()

    render(<PermissionPicker tree={tree} selectedIds={[]} onChange={onChange} />)

    expect(screen.getByText('Application Access')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /Application Access/i }))
    await user.click(screen.getByRole('checkbox', { name: /View users/i }))
    expect(onChange).toHaveBeenCalledWith(['p1'])
  })

  it('shows empty catalog message', () => {
    render(<PermissionPicker tree={[]} selectedIds={[]} onChange={vi.fn()} />)
    expect(screen.getByText('No permissions available in the catalog.')).toBeInTheDocument()
  })
})
