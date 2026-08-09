import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { REPORTING_PERIOD_DEFAULT_DAYS_KEY } from '@/features/preferences/reporting-period'
import {
  DASHBOARD_WINDOW_DAYS_KEY,
  persistDashboardWindowDaysPreference,
  readDashboardWindowDaysPreference,
  useDashboardWindowDays,
} from './use-dashboard-window-days'

describe('dashboard window days preference', () => {
  beforeEach(() => {
    localStorage.clear()
    localStorage.setItem(REPORTING_PERIOD_DEFAULT_DAYS_KEY, '2')
  })

  it('reads default when storage is empty', () => {
    expect(readDashboardWindowDaysPreference()).toBe(2)
  })

  it('reads valid stored preference', () => {
    localStorage.setItem(DASHBOARD_WINDOW_DAYS_KEY, '14')
    expect(readDashboardWindowDaysPreference()).toBe(14)
  })

  it('falls back for invalid stored values', () => {
    localStorage.setItem(DASHBOARD_WINDOW_DAYS_KEY, '999')
    expect(readDashboardWindowDaysPreference()).toBe(2)
  })

  it('persists preference to localStorage', () => {
    persistDashboardWindowDaysPreference(30)
    expect(localStorage.getItem(DASHBOARD_WINDOW_DAYS_KEY)).toBe('30')
  })

  it('ignores storage write errors', () => {
    const setItem = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('quota')
    })

    expect(() => persistDashboardWindowDaysPreference(6)).not.toThrow()
    setItem.mockRestore()
  })

  it('falls back when localStorage read throws', () => {
    const getItem = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked')
    })

    expect(readDashboardWindowDaysPreference()).toBe(2)
    getItem.mockRestore()
  })
})

describe('useDashboardWindowDays', () => {
  beforeEach(() => {
    localStorage.clear()
    localStorage.setItem(REPORTING_PERIOD_DEFAULT_DAYS_KEY, '2')
  })

  it('initializes from storage and updates state on set', () => {
    localStorage.setItem(DASHBOARD_WINDOW_DAYS_KEY, '6')

    const { result } = renderHook(() => useDashboardWindowDays())

    expect(result.current.windowDays).toBe(6)

    act(() => {
      result.current.setWindowDays(30)
    })

    expect(result.current.windowDays).toBe(30)
    expect(localStorage.getItem(DASHBOARD_WINDOW_DAYS_KEY)).toBe('30')
  })
})
