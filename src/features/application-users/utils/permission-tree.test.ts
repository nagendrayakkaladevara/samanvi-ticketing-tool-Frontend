import { describe, expect, it } from 'vitest'

import { makePermission } from '@/test/fixtures/auth'

import {
  filterVisiblePermissionTree,
  isHiddenPermissionModule,
  isHiddenPermissionSubmodule,
  mergePermissionIdsForSave,
  partitionPermissionIds,
} from './permission-tree'

describe('isHiddenPermissionModule', () => {
  it.each(['tickets', 'TICKETS', ' issue_category ', 'issue_categories'])('hides %s', (module) => {
    expect(isHiddenPermissionModule(module)).toBe(true)
  })

  it('does not hide visible modules', () => {
    expect(isHiddenPermissionModule('users')).toBe(false)
  })
})

describe('isHiddenPermissionSubmodule', () => {
  it.each(['issue_category', 'ISSUE_CATEGORIES'])('hides %s', (submodule) => {
    expect(isHiddenPermissionSubmodule(submodule)).toBe(true)
  })
})

describe('filterVisiblePermissionTree', () => {
  it('removes hidden modules and submodules', () => {
    const tree = filterVisiblePermissionTree([
      {
        module: 'tickets',
        label: 'Tickets',
        submodules: [
          {
            submodule: '',
            label: 'General',
            permissions: [makePermission()],
          },
        ],
      },
      {
        module: 'users',
        label: 'Users',
        submodules: [
          {
            submodule: 'issue_category',
            label: 'Hidden',
            permissions: [makePermission({ submodule: 'issue_category' })],
          },
          {
            submodule: 'general',
            label: 'General',
            permissions: [makePermission({ submodule: 'general', module: 'users' })],
          },
        ],
      },
    ])

    expect(tree).toHaveLength(1)
    expect(tree[0]?.module).toBe('users')
    expect(tree[0]?.submodules).toHaveLength(1)
    expect(tree[0]?.submodules[0]?.submodule).toBe('general')
  })
})

describe('partitionPermissionIds', () => {
  const items = [
    makePermission({ id: 'visible', module: 'users', submodule: 'general' }),
    makePermission({ id: 'hidden-mod', module: 'tickets', submodule: '' }),
    makePermission({ id: 'hidden-sub', module: 'users', submodule: 'issue_category' }),
  ]

  it('splits visible and hidden permission ids', () => {
    const result = partitionPermissionIds(items, ['visible', 'hidden-mod', 'hidden-sub', 'unknown'])

    expect(result.visibleIds).toEqual(['visible', 'unknown'])
    expect(result.hiddenIds).toEqual(['hidden-mod', 'hidden-sub'])
  })
})

describe('mergePermissionIdsForSave', () => {
  it('merges hidden first then visible with deduplication', () => {
    expect(mergePermissionIdsForSave(['a', 'b'], ['b', 'c'])).toEqual(['b', 'a', 'c'])
  })
})
