import { describe, expect, it } from 'vitest'

import { getJobDetailsPath, getJobEditPath, getRepairTrackingPath } from './job-routes'

describe('job routes', () => {
  it('returns repair tracking base path', () => {
    expect(getRepairTrackingPath()).toBe('/garage/repair-tracking')
  })

  it('builds job details and edit paths', () => {
    expect(getJobDetailsPath('job-123')).toBe('/garage/repair-tracking/job-123')
    expect(getJobEditPath('job-123')).toBe('/garage/repair-tracking/job-123/edit')
  })
})
