import { describe, expect, it } from 'vitest'

import {
  applicationUserDataColumnDefs,
  applicationUserMobileBadge,
  applicationUserMobileFields,
} from './application-users-grid-columns'

describe('application-users-grid-columns', () => {
  it('exports column definitions and mobile helpers', () => {
    const user = {
      id: 'au-1',
      displayName: 'App User',
      mobileNumber: '9876543210',
      username: 'appuser',
      userType: 'worker' as const,
      isActive: true,
      permissionIds: [],
    }

    expect(applicationUserDataColumnDefs.length).toBeGreaterThan(0)
    expect(applicationUserMobileFields.length).toBeGreaterThan(0)
    expect(applicationUserMobileBadge(user)).toBeTruthy()
  })
})
