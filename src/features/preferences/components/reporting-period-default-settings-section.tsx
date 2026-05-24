import { CalendarDays } from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useReportingPeriodDefaultDays } from '@/features/preferences/hooks/use-reporting-period-default-days'
import { REPORTING_PERIOD_OPTIONS } from '@/features/preferences/reporting-period'

export function ReportingPeriodDefaultSettingsSection() {
  const { defaultDays, setDefaultDays } = useReportingPeriodDefaultDays()

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-base">
          <CalendarDays className="h-4 w-4" />
          Reporting period
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Default period for the dashboard and ticket lists when no period is selected.
        </p>
      </CardHeader>
      <CardContent>
        <div className="rounded-lg border p-3">
          <label htmlFor="default-reporting-period" className="font-medium">
            Default period
          </label>
          <p className="mt-1 text-xs text-muted-foreground">
            Applies on first visit and when opening ticket lists without a period in the URL.
          </p>
          <Select value={String(defaultDays)} onValueChange={(value) => setDefaultDays(Number(value))}>
            <SelectTrigger id="default-reporting-period" aria-label="Default reporting period" className="mt-3">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {REPORTING_PERIOD_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={String(option.value)}>
                  {option.value === defaultDays ? `${option.label} (current)` : option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  )
}
