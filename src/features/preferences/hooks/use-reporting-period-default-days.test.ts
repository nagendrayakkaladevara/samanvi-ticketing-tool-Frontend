import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'

import { REPORTING_PERIOD_DEFAULT_DAYS_KEY } from '@/features/preferences/reporting-period'
import { useReportingPeriodDefaultDays } from './use-reporting-period-default-days'

describe('useReportingPeriodDefaultDays', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('initializes from localStorage and updates on setDefaultDays', () => {
    localStorage.setItem(REPORTING_PERIOD_DEFAULT_DAYS_KEY, '6')

    const { result } = renderHook(() => useReportingPeriodDefaultDays())

    expect(result.current.defaultDays).toBe(6)

    act(() => {
      result.current.setDefaultDays(30)
    })

    expect(result.current.defaultDays).toBe(30)
    expect(localStorage.getItem(REPORTING_PERIOD_DEFAULT_DAYS_KEY)).toBe('30')
  })

  it('ignores invalid values when persisting', () => {
    const { result } = renderHook(() => useReportingPeriodDefaultDays())

    act(() => {
      result.current.setDefaultDays(999)
    })

    expect(result.current.defaultDays).toBe(999)
    expect(localStorage.getItem(REPORTING_PERIOD_DEFAULT_DAYS_KEY)).toBeNull()
  })
})
