import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import type { ResolvedPerDay } from '@/features/user-history/types/user-history'
import { formatShortDate } from '@/features/user-history/utils/format'

const chartConfig = {
  count: {
    label: 'Resolved',
    color: 'hsl(168 65% 38%)',
  },
} as const

type ResolvedPerDayChartProps = {
  data: ResolvedPerDay[]
}

export function ResolvedPerDayChart({ data }: ResolvedPerDayChartProps) {
  const chartData = data.map((point) => ({
    ...point,
    label: formatShortDate(point.date),
  }))

  return (
    <Card className="border-border/80 bg-card/95 shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold tracking-tight">Resolutions per day</CardTitle>
        <CardDescription>Daily count of assigned tickets resolved in the selected window</CardDescription>
      </CardHeader>
      <CardContent>
        {chartData.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">No resolutions recorded in this window.</p>
        ) : (
          <ChartContainer
            config={chartConfig}
            className="aspect-[4/3] min-h-[220px] w-full min-w-0 sm:aspect-[5/2] sm:min-h-[200px]"
          >
            <BarChart data={chartData} margin={{ top: 8, right: 4, left: -12, bottom: 4 }}>
              <CartesianGrid vertical={false} strokeDasharray="4 4" />
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                fontSize={10}
                interval="preserveStartEnd"
                minTickGap={8}
                angle={-32}
                textAnchor="end"
                height={52}
              />
              <YAxis allowDecimals={false} tickLine={false} axisLine={false} fontSize={10} width={24} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="count" fill="var(--color-count)" radius={[6, 6, 0, 0]} maxBarSize={42} />
            </BarChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  )
}
