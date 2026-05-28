import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

const accentStyles = {
  violet: {
    gradient: 'from-violet-500/10 to-sky-500/10',
    blurRight: 'bg-violet-400/25 dark:bg-violet-500/15',
    blurLeft: 'bg-sky-400/20 dark:bg-sky-500/10',
    eyebrow: 'text-violet-700 dark:text-violet-400',
  },
  sky: {
    gradient: 'from-sky-500/10 to-violet-500/10',
    blurRight: 'bg-sky-400/25 dark:bg-sky-500/15',
    blurLeft: 'bg-violet-400/20 dark:bg-violet-500/10',
    eyebrow: 'text-sky-700 dark:text-sky-400',
  },
  amber: {
    gradient: 'from-amber-500/10 to-teal-500/10',
    blurRight: 'bg-amber-400/25 dark:bg-amber-500/15',
    blurLeft: 'bg-teal-400/20 dark:bg-teal-500/10',
    eyebrow: 'text-amber-700 dark:text-amber-400',
  },
  emerald: {
    gradient: 'from-emerald-500/10 to-rose-500/10',
    blurRight: 'bg-emerald-400/25 dark:bg-emerald-500/15',
    blurLeft: 'bg-rose-400/20 dark:bg-rose-500/10',
    eyebrow: 'text-emerald-700 dark:text-emerald-400',
  },
  orange: {
    gradient: 'from-orange-500/10 to-rose-500/10',
    blurRight: 'bg-orange-400/25 dark:bg-orange-500/15',
    blurLeft: 'bg-rose-400/20 dark:bg-rose-500/10',
    eyebrow: 'text-orange-700 dark:text-orange-400',
  },
} as const

export type PageGradientHeaderAccent = keyof typeof accentStyles

type PageGradientHeaderProps = {
  eyebrow: string
  title: string
  description: string
  actions?: ReactNode
  accent?: PageGradientHeaderAccent
}

export function PageGradientHeader({
  eyebrow,
  title,
  description,
  actions,
  accent = 'violet',
}: PageGradientHeaderProps) {
  const colors = accentStyles[accent]

  return (
    <header
      className={cn(
        'relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br via-background p-6 shadow-sm',
        colors.gradient,
      )}
    >
      <div
        aria-hidden
        className={cn(
          'pointer-events-none absolute -right-20 -top-20 h-52 w-52 rounded-full blur-3xl',
          colors.blurRight,
        )}
      />
      <div
        aria-hidden
        className={cn(
          'pointer-events-none absolute -bottom-16 left-12 h-48 w-48 rounded-full blur-3xl',
          colors.blurLeft,
        )}
      />
      <div className="relative flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1.5">
          <p className={cn('text-xs font-semibold uppercase tracking-[0.2em]', colors.eyebrow)}>{eyebrow}</p>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">{title}</h1>
          <p className="max-w-xl text-sm text-muted-foreground">{description}</p>
        </div>
        {actions ? (
          <div className="flex w-full items-stretch justify-end gap-2 sm:w-auto sm:items-center">{actions}</div>
        ) : null}
      </div>
    </header>
  )
}
