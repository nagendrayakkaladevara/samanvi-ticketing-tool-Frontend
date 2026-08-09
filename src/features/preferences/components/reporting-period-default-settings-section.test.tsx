import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

vi.mock('@/features/preferences/hooks/use-reporting-period-default-days', () => ({
  useReportingPeriodDefaultDays: () => ({ defaultDays: 30, setDefaultDays: vi.fn() }),
}))

import { ReportingPeriodDefaultSettingsSection } from './reporting-period-default-settings-section'

describe('ReportingPeriodDefaultSettingsSection', () => {
  it('renders reporting period selector', () => {
    render(<ReportingPeriodDefaultSettingsSection />)
    expect(screen.getByText('Reporting period')).toBeInTheDocument()
    expect(screen.getByLabelText('Default reporting period')).toBeInTheDocument()
  })
})
