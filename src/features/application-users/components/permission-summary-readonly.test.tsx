import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { makePermission } from '@/test/fixtures/auth'

import { PermissionSummaryReadonly } from './permission-summary-readonly'

const tree = [
  {
    module: 'users',
    label: 'Users',
    submodules: [
      {
        submodule: 'accounts',
        label: 'Accounts',
        permissions: [makePermission({ id: 'p1', module: 'users', submodule: 'accounts', action: 'view', label: 'View users' })],
      },
    ],
  },
]

describe('PermissionSummaryReadonly', () => {
  it('renders selected permission summary', () => {
    render(<PermissionSummaryReadonly tree={tree} selectedIds={['p1']} />)
    expect(screen.getByText('View users')).toBeInTheDocument()
  })

  it('shows empty state without selections', () => {
    render(<PermissionSummaryReadonly tree={tree} selectedIds={[]} />)
    expect(screen.getByText('No direct permission overrides assigned.')).toBeInTheDocument()
  })
})
