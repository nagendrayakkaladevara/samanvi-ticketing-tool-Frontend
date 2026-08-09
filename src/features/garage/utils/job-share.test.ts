import { describe, expect, it } from 'vitest'

import { getJobShareUrl } from './job-share'

describe('getJobShareUrl', () => {
  it('builds share URL with default origin', () => {
    const url = getJobShareUrl('job-1')
    expect(url).toBe(`${window.location.origin}/garage/repair-tracking/job-1`)
  })

  it('uses custom origin when provided', () => {
    expect(getJobShareUrl('job-1', 'https://app.example.com')).toBe(
      'https://app.example.com/garage/repair-tracking/job-1',
    )
  })
})
