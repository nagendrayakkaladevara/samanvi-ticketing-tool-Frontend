import { describe, expect, it } from 'vitest'

import { applicationAccessRoutes } from './application-access-routes'

describe('applicationAccessRoutes', () => {
  it('exposes static list and create paths', () => {
    expect(applicationAccessRoutes.list).toBe('/application-access')
    expect(applicationAccessRoutes.create).toBe('/application-access/create')
  })

  it('builds view and edit paths from user id', () => {
    expect(applicationAccessRoutes.view('user-42')).toBe('/application-access/user-42')
    expect(applicationAccessRoutes.edit('user-42')).toBe('/application-access/user-42/edit')
  })
})
