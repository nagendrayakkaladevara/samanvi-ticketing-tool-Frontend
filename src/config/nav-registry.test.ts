import { describe, expect, it } from 'vitest'

import {
  BUS_NO_VIEW_CHECKS,
  EMPLOYEE_VIEW_CHECKS,
  GARAGE_MASTERS_VIEW_CHECKS,
  HOME_ROUTE_PRIORITY,
  NAV_REGISTRY,
  ROUTE_GUARD_REGISTRY,
  getNavEntryByPath,
  getSubmoduleLabelFromTree,
} from './nav-registry'

describe('nav-registry', () => {
  it('exports home route priority list', () => {
    expect(HOME_ROUTE_PRIORITY).toEqual(['/dashboard', '/tickets', '/application-access'])
  })

  it('defines permission check constants', () => {
    expect(EMPLOYEE_VIEW_CHECKS.length).toBe(3)
    expect(BUS_NO_VIEW_CHECKS.length).toBe(2)
    expect(GARAGE_MASTERS_VIEW_CHECKS.length).toBe(2)
  })

  it('NAV_REGISTRY entries have required shape', () => {
    for (const entry of NAV_REGISTRY) {
      expect(entry.id).toBeTruthy()
      expect(entry.to).toBeTruthy()
      expect(entry.label).toBeTruthy()
      expect(['main', 'masters', 'garage']).toContain(entry.group)
      expect(typeof entry.sortOrder).toBe('number')
    }
  })

  it('ROUTE_GUARD_REGISTRY entries reference path prefixes', () => {
    expect(ROUTE_GUARD_REGISTRY.length).toBeGreaterThan(0)
    for (const guard of ROUTE_GUARD_REGISTRY) {
      expect(guard.pathPrefix.startsWith('/')).toBe(true)
      expect(guard.permission).toBeDefined()
    }
  })

  describe('getNavEntryByPath', () => {
    it.each([
      ['/masters/employees', 'masters-employees'],
      ['/masters/employees/123', 'masters-employees'],
      ['/garage/repair-tracking', 'garage-repair-tracking'],
      ['/', 'welcome'],
    ] as const)('matches %s to %s', (pathname, id) => {
      expect(getNavEntryByPath(pathname)?.id).toBe(id)
    })

    it('normalizes trailing slashes', () => {
      expect(getNavEntryByPath('/settings/')?.id).toBe('settings')
    })

    it('ignores external entries', () => {
      expect(getNavEntryByPath('https://samanvidashboard.netlify.app/voice-app-access')).toBeUndefined()
    })

    it('returns undefined for unknown paths', () => {
      expect(getNavEntryByPath('/unknown-route')).toBeUndefined()
    })
  })

  describe('getSubmoduleLabelFromTree', () => {
    const tree = [
      {
        module: 'masters',
        label: 'Masters',
        submodules: [
          {
            submodule: 'driver',
            label: 'Driver',
            permissions: [],
          },
        ],
      },
    ]

    it('returns label when module and submodule match', () => {
      expect(getSubmoduleLabelFromTree(tree, 'masters', 'driver')).toBe('Driver')
    })

    it('returns undefined when module missing', () => {
      expect(getSubmoduleLabelFromTree(tree, 'garage', 'driver')).toBeUndefined()
    })

    it('returns undefined when submodule missing', () => {
      expect(getSubmoduleLabelFromTree(tree, 'masters', 'helper')).toBeUndefined()
    })
  })
})
