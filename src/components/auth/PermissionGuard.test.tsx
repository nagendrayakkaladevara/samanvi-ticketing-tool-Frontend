import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'

import { makeAuthSession, makePermission, makePermissionSet } from '@/test/fixtures/auth'
import { buildPermissionKey } from '@/features/permissions/utils/permission-normalize'
import { useAuthStore } from '@/store/auth-store'

import { PermissionGate, PermissionGuard } from './PermissionGuard'

vi.mock('@/hooks/use-permissions', () => ({
  usePermissions: vi.fn(),
}))

import { usePermissions } from '@/hooks/use-permissions'

function renderGuard(ui: React.ReactElement, initialRoute = '/protected') {
  return render(
    <MemoryRouter initialEntries={[initialRoute]}>
      <Routes>
        <Route path="/protected" element={ui} />
        <Route path="/login" element={<div>Login Page</div>} />
        <Route path="/application-access" element={<div>Application Access</div>} />
        <Route path="/tickets" element={<div>Tickets</div>} />
        <Route path="/dashboard" element={<div>Dashboard</div>} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('PermissionGuard', () => {
  it('renders children when canAccess returns true', () => {
    vi.mocked(usePermissions).mockReturnValue({
      canAccess: () => true,
      has: () => true,
      can: () => true,
      canManage: () => true,
      isAdmin: false,
      permissionSet: new Set(),
      permissions: null,
    })

    renderGuard(
      <PermissionGuard module="users" action="view">
        <div>Allowed Content</div>
      </PermissionGuard>,
    )

    expect(screen.getByText('Allowed Content')).toBeInTheDocument()
  })

  it('renders fallback when access denied and fallback provided', () => {
    vi.mocked(usePermissions).mockReturnValue({
      canAccess: () => false,
      has: () => false,
      can: () => false,
      canManage: () => false,
      isAdmin: false,
      permissionSet: new Set(),
      permissions: null,
    })

    renderGuard(
      <PermissionGuard module="users" action="view" fallback={<div>Denied</div>}>
        <div>Allowed Content</div>
      </PermissionGuard>,
    )

    expect(screen.getByText('Denied')).toBeInTheDocument()
    expect(screen.queryByText('Allowed Content')).not.toBeInTheDocument()
  })

  it('redirects to first allowed route when access denied', () => {
    const permissionSet = makePermissionSet([['users', '', 'view']])
    useAuthStore.getState().setSession(
      makeAuthSession({
        permissions: { items: [makePermission({ module: 'users', action: 'view' })], tree: [] },
      }),
      true,
    )

    vi.mocked(usePermissions).mockReturnValue({
      canAccess: () => false,
      has: () => false,
      can: () => false,
      canManage: () => false,
      isAdmin: false,
      permissionSet,
      permissions: null,
    })

    renderGuard(
      <PermissionGuard module="tickets" action="view">
        <div>Allowed Content</div>
      </PermissionGuard>,
    )

    expect(screen.getByText('Application Access')).toBeInTheDocument()
  })
})

describe('PermissionGate', () => {
  it('renders children when has permission', () => {
    vi.mocked(usePermissions).mockReturnValue({
      canAccess: () => true,
      has: () => true,
      can: () => true,
      canManage: () => true,
      isAdmin: false,
      permissionSet: new Set([buildPermissionKey('users', '', 'view')]),
      permissions: null,
    })

    render(
      <PermissionGate module="users" action="view">
        <div>Gate Content</div>
      </PermissionGate>,
    )

    expect(screen.getByText('Gate Content')).toBeInTheDocument()
  })

  it('renders fallback when permission missing', () => {
    vi.mocked(usePermissions).mockReturnValue({
      canAccess: () => false,
      has: () => false,
      can: () => false,
      canManage: () => false,
      isAdmin: false,
      permissionSet: new Set(),
      permissions: null,
    })

    render(
      <PermissionGate module="users" action="view" fallback={<div>No Access</div>}>
        <div>Gate Content</div>
      </PermissionGate>,
    )

    expect(screen.getByText('No Access')).toBeInTheDocument()
  })
})
