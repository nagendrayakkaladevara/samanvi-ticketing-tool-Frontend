import { useState } from 'react'

import {
  persistReportingPeriodDefaultDays,
  readReportingPeriodDefaultDays,
} from '@/features/preferences/reporting-period'

export function useReportingPeriodDefaultDays() {
  const [defaultDays, setDefaultDaysState] = useState(readReportingPeriodDefaultDays)

  function setDefaultDays(days: number) {
    persistReportingPeriodDefaultDays(days)
    setDefaultDaysState(days)
  }

  return { defaultDays, setDefaultDays }
}
