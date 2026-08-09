import type { ReactNode } from 'react'

export function ResponsiveContainer({ children }: { children: ReactNode }) {
  return <div data-testid="recharts-responsive">{children}</div>
}

export function BarChart({ children }: { children: ReactNode }) {
  return <div data-testid="recharts-bar-chart">{children}</div>
}

export function Bar() {
  return null
}

export function XAxis() {
  return null
}

export function YAxis() {
  return null
}

export function CartesianGrid() {
  return null
}
