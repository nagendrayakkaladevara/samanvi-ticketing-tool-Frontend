import { describe, expect, it } from 'vitest'

import { buildPermissionKey } from '@/features/permissions/utils/permission-normalize'
import type { PermissionTreeGroup } from '@/features/application-users/types/permission'
import { makePermissionSet } from '@/test/fixtures/auth'

import {
  canAccessRoute,
  canManageSubmodule,
  canPerformAction,
  getFirstAllowedRoute,
  hasAnyPermission,
  hasAnyViewInModule,
  hasPermission,
} from './permission-checks'

const ticketsView = makePermissionSet([['tickets', '', 'view']])
const usersView = makePermissionSet([['users', '', 'view']])
const garageCreate = makePermissionSet([['garage', 'repair_job', 'create']])
const emptySet = new Set<string>()

describe('hasPermission', () => {
  it('returns true for admin regardless of permission set', () => {
    expect(hasPermission(emptySet, 'tickets', '', 'view', true)).toBe(true)
  })

  it('returns false when permission set is empty', () => {
    expect(hasPermission(emptySet, 'tickets', '', 'view')).toBe(false)
  })

  it('returns true when exact permission key exists', () => {
    expect(hasPermission(ticketsView, 'tickets', '', 'view')).toBe(true)
  })

  it('uses buildPermissionKey format module:submodule:action', () => {
    const set = makePermissionSet([['masters', 'driver', 'edit']])
    expect(hasPermission(set, 'masters', 'driver', 'edit')).toBe(true)
    expect(hasPermission(set, 'masters', 'driver', 'view')).toBe(false)
  })
})

describe('hasAnyPermission', () => {
  it('returns true for admin bypass', () => {
    expect(hasAnyPermission(emptySet, [{ module: 'tickets', action: 'view' }], true)).toBe(true)
  })

  it('returns false when no checks match', () => {
    expect(
      hasAnyPermission(emptySet, [
        { module: 'tickets', action: 'view' },
        { module: 'users', action: 'view' },
      ]),
    ).toBe(false)
  })

  it('returns true when any check matches (OR semantics)', () => {
    expect(
      hasAnyPermission(usersView, [
        { module: 'tickets', action: 'view' },
        { module: 'users', action: 'view' },
      ]),
    ).toBe(true)
  })

  it('defaults action to view when omitted', () => {
    expect(hasAnyPermission(usersView, [{ module: 'users' }])).toBe(true)
  })
})

describe('canAccessRoute', () => {
  it('returns true for admin bypass', () => {
    expect(canAccessRoute(emptySet, { module: 'tickets', action: 'view' }, true)).toBe(true)
  })

  it('returns true when requirement is undefined', () => {
    expect(canAccessRoute(emptySet, undefined)).toBe(true)
  })

  it('returns true for authOnly requirement', () => {
    expect(canAccessRoute(emptySet, { authOnly: true })).toBe(true)
  })

  it('returns true when module is missing', () => {
    expect(canAccessRoute(emptySet, { submodule: 'x', action: 'view' })).toBe(true)
  })

  it('evaluates anyOf with OR semantics', () => {
    expect(
      canAccessRoute(usersView, {
        anyOf: [
          { module: 'tickets', action: 'view' },
          { module: 'users', action: 'view' },
        ],
      }),
    ).toBe(true)
  })

  it('denies when anyOf is empty and module check fails', () => {
    expect(
      canAccessRoute(emptySet, {
        anyOf: [],
        module: 'tickets',
        action: 'view',
      }),
    ).toBe(false)
  })

  it('checks single module permission with default submodule and action', () => {
    expect(canAccessRoute(ticketsView, { module: 'tickets' })).toBe(true)
    expect(canAccessRoute(emptySet, { module: 'tickets' })).toBe(false)
  })
})

describe('hasAnyViewInModule', () => {
  const tree: PermissionTreeGroup[] = [
    {
      module: 'tickets',
      label: 'Tickets',
      submodules: [
        {
          submodule: '',
          label: 'General',
          permissions: [{ id: '1', module: 'tickets', submodule: '', action: 'view' }],
        },
      ],
    },
    {
      module: 'garage',
      label: 'Garage',
      submodules: [
        {
          submodule: 'repair_job',
          label: 'Repair Job',
          permissions: [{ id: '2', module: 'garage', submodule: 'repair_job', action: 'create' }],
        },
      ],
    },
  ]

  it('returns false when module is not in tree', () => {
    expect(hasAnyViewInModule(tree, 'users')).toBe(false)
  })

  it('returns true when any submodule has view action', () => {
    expect(hasAnyViewInModule(tree, 'tickets')).toBe(true)
  })

  it('returns false when module has no view permissions', () => {
    expect(hasAnyViewInModule(tree, 'garage')).toBe(false)
  })
})

describe('getFirstAllowedRoute', () => {
  it('returns /login when unauthenticated', () => {
    expect(getFirstAllowedRoute(emptySet, false)).toBe('/login')
  })

  it('returns /application-access when user has users:view', () => {
    expect(getFirstAllowedRoute(usersView, true)).toBe('/application-access')
  })

  it('returns /garage/create-job when user has garage repair_job create', () => {
    expect(getFirstAllowedRoute(garageCreate, true)).toBe('/garage/create-job')
  })

  it('returns /tickets fallback when authenticated but no nav matches', () => {
    expect(getFirstAllowedRoute(emptySet, true)).toBe('/tickets')
  })

  it('returns priority home route when user has tickets view (hidden routes in priority)', () => {
    const set = makePermissionSet([['tickets', '', 'view']])
    expect(getFirstAllowedRoute(set, true)).toBe('/dashboard')
  })

  it('returns admin-first visible route for admin', () => {
    expect(getFirstAllowedRoute(emptySet, true, true)).toBe('/dashboard')
  })
})

describe('canPerformAction', () => {
  it('delegates to hasPermission', () => {
    expect(canPerformAction(ticketsView, 'tickets', '', 'view')).toBe(true)
    expect(canPerformAction(emptySet, 'tickets', '', 'view')).toBe(false)
  })
})

describe('canManageSubmodule', () => {
  it('returns true when user has create, edit, or delete', () => {
    expect(canManageSubmodule(makePermissionSet([['users', '', 'create']]), 'users', '')).toBe(true)
    expect(canManageSubmodule(makePermissionSet([['users', '', 'edit']]), 'users', '')).toBe(true)
    expect(canManageSubmodule(makePermissionSet([['users', '', 'delete']]), 'users', '')).toBe(true)
  })

  it('returns false when user only has view', () => {
    expect(canManageSubmodule(usersView, 'users', '')).toBe(false)
  })

  it('returns true for admin', () => {
    expect(canManageSubmodule(emptySet, 'users', '', true)).toBe(true)
  })
})

describe('buildPermissionKey contract', () => {
  it.each([
    ['tickets', '', 'view', 'tickets::view'],
    ['masters', 'driver', 'edit', 'masters:driver:edit'],
  ] as const)('key %s:%s:%s', (module, submodule, action, expected) => {
    expect(buildPermissionKey(module, submodule, action)).toBe(expected)
  })
})
