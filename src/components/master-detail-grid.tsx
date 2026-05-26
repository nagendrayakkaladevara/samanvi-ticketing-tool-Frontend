import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

/** Ticket-style detail grids: two columns on mobile, more on large screens. */
export const masterDetailGridClass = {
  twoCol: 'grid grid-cols-2 gap-2 sm:gap-3',
  threeColLg: 'grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-3',
} as const

type MasterDetailGridProps = {
  children: ReactNode
  columns?: keyof typeof masterDetailGridClass
  className?: string
}

export function MasterDetailGrid({
  children,
  columns = 'twoCol',
  className,
}: MasterDetailGridProps) {
  return <div className={cn(masterDetailGridClass[columns], className)}>{children}</div>
}
