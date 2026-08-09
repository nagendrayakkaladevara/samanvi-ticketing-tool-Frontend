import { describe, expect, it } from 'vitest'

import { makePermission } from '@/test/fixtures/auth'

import {
  buildPermissionKey,
  buildPermissionKeySet,
  buildPermissionTreeFromItems,
  extractPermissionItems,
  extractPermissionPayload,
  normalizePermission,
  normalizePermissionsCatalog,
  normalizePermissionTree,
} from './permission-normalize'

describe('normalizePermission', () => {
  it('returns null for non-object input', () => {
    expect(normalizePermission(null)).toBeNull()
    expect(normalizePermission('x')).toBeNull()
  })

  it('normalizes minimal valid permission', () => {
    expect(
      normalizePermission({
        id: '1',
        module: 'tickets',
        action: 'view',
      }),
    ).toEqual({
      id: '1',
      module: 'tickets',
      submodule: '',
      action: 'view',
      label: undefined,
      key: undefined,
    })
  })

  it('accepts alternate id keys and numeric ids', () => {
    expect(normalizePermission({ permissionId: 'p2', module: 'users', action: 'edit' })?.id).toBe('p2')
    expect(normalizePermission({ _id: 42, module: 'users', action: 'edit' })?.id).toBe('42')
  })

  it('accepts label and name aliases', () => {
    expect(normalizePermission({ id: '1', module: 'm', action: 'view', name: 'View M' })?.label).toBe('View M')
  })

  it('returns null when required fields are missing or blank', () => {
    expect(normalizePermission({ id: '1', module: '  ', action: 'view' })).toBeNull()
    expect(normalizePermission({ id: '', module: 'm', action: 'view' })).toBeNull()
    expect(normalizePermission({ id: '1', module: 'm' })).toBeNull()
  })
})

describe('extractPermissionPayload', () => {
  it('unwraps nested data', () => {
    expect(extractPermissionPayload({ data: { items: [] } })).toEqual({ items: [] })
  })

  it('returns empty object for invalid input', () => {
    expect(extractPermissionPayload(null)).toEqual({})
  })
})

describe('extractPermissionItems', () => {
  it.each([
    [{ items: [{ id: '1', module: 'm', action: 'view' }] }, 1],
    [{ permissions: [{ id: '2', module: 'm', action: 'view' }] }, 1],
    [[{ id: '3', module: 'm', action: 'view' }], 1],
    [{ data: { items: [{ id: '4', module: 'm', action: 'view' }] } }, 1],
    [null, 0],
    [{}, 0],
  ] as const)('extracts items from %#', (raw, count) => {
    expect(extractPermissionItems(raw)).toHaveLength(count)
  })
})

describe('buildPermissionTreeFromItems', () => {
  it('groups by module and submodule with sorted actions', () => {
    const tree = buildPermissionTreeFromItems([
      makePermission({ id: '1', module: 'garage', submodule: 'repair_job', action: 'view' }),
      makePermission({ id: '2', module: 'masters', submodule: 'driver', action: 'edit' }),
      makePermission({ id: '3', module: 'masters', submodule: 'driver', action: 'view' }),
    ])

    expect(tree[0]?.module).toBe('masters')
    expect(tree[1]?.module).toBe('garage')
    expect(tree[0]?.submodules[0]?.permissions.map((p) => p.action)).toEqual(['edit', 'view'])
  })
})

describe('normalizePermissionTree', () => {
  it('uses API tree when present', () => {
    const tree = normalizePermissionTree(
      {
        tree: [
          {
            module: 'tickets',
            submodules: [{ submodule: '', permissions: [{ id: '1', module: 'tickets', action: 'view' }] }],
          },
        ],
      },
      [],
    )

    expect(tree[0]?.module).toBe('tickets')
  })

  it('falls back to buildPermissionTreeFromItems when tree is empty', () => {
    const items = [makePermission()]
    const tree = normalizePermissionTree({}, items)
    expect(tree[0]?.module).toBe('tickets')
  })

  it('normalizes actions alias on submodules', () => {
    const tree = normalizePermissionTree(
      {
        tree: [
          {
            module: 'users',
            submodules: [{ submodule: '', actions: [{ id: '1', module: 'users', action: 'view' }] }],
          },
        ],
      },
      [],
    )

    expect(tree[0]?.submodules[0]?.permissions).toHaveLength(1)
  })

  it('skips tree groups and submodules without permissions', () => {
    expect(
      normalizePermissionTree(
        {
          tree: [
            { module: 'empty', submodules: [{ submodule: 'x', permissions: [] }] },
            { submodules: [{ submodule: '', permissions: [{ id: '1', module: 'm', action: 'view' }] }] },
          ],
        },
        [],
      ),
    ).toEqual([])

    expect(
      normalizePermissionTree(
        {
          tree: [
            {
              module: 'users',
              label: 'Custom Users',
              submodules: [{ submodule: 'profile', label: 'Profile', permissions: [] }],
            },
          ],
        },
        [],
      ).length,
    ).toBe(0)
  })
})

describe('normalizePermissionsCatalog', () => {
  it('returns items and tree for full payload', () => {
    const catalog = normalizePermissionsCatalog({
      items: [makePermission({ id: 'c1' })],
    })

    expect(catalog.items).toHaveLength(1)
    expect(catalog.tree.length).toBeGreaterThan(0)
  })

  it('filters garbage items', () => {
    const catalog = normalizePermissionsCatalog({
      items: [null, { id: '1' }, { id: '2', module: 'm', action: 'view' }],
    })

    expect(catalog.items).toHaveLength(1)
    expect(catalog.items[0]?.id).toBe('2')
  })
})

describe('buildPermissionKey', () => {
  it.each([
    ['tickets', '', 'view', 'tickets::view'],
    ['masters', 'driver', 'edit', 'masters:driver:edit'],
  ] as const)('builds %s', (module, submodule, action, expected) => {
    expect(buildPermissionKey(module, submodule, action)).toBe(expected)
  })
})

describe('buildPermissionKeySet', () => {
  it('uses explicit key when provided', () => {
    const set = buildPermissionKeySet([
      makePermission({ key: 'custom-key', module: 'x', submodule: 'y', action: 'z' }),
    ])
    expect(set.has('custom-key')).toBe(true)
  })

  it('deduplicates built keys', () => {
    const set = buildPermissionKeySet([
      makePermission({ module: 'tickets', action: 'view' }),
      makePermission({ id: '2', module: 'tickets', action: 'view' }),
    ])
    expect(set.size).toBe(1)
  })
})
