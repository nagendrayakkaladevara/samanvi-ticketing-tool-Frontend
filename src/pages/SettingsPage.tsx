import { useEffect, useState } from 'react'
import { Check, MoonStar, SunMedium, UserRound } from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { ReportingPeriodDefaultSettingsSection } from '@/features/preferences/components/reporting-period-default-settings-section'
import { PwaInstallSettingsSection } from '@/features/pwa/components/PwaInstallSettingsSection'
import { TicketsAutoRefreshSettingsSection } from '@/features/tickets/components/tickets-auto-refresh-settings-section'
import { useProfileQuery } from '@/features/profile/hooks/use-profile-query'

type ThemeMode = 'light' | 'dark'

const THEME_STORAGE_KEY = 'samanvi.theme.mode'

function getInitialTheme(): ThemeMode {
  if (typeof window === 'undefined') {
    return 'light'
  }

  const stored = window.localStorage.getItem(THEME_STORAGE_KEY)
  if (stored === 'dark' || stored === 'light') {
    return stored
  }

  return 'light'
}

function formatDate(dateString: string): string {
  if (!dateString) {
    return '-'
  }

  const date = new Date(dateString)
  if (Number.isNaN(date.getTime())) {
    return '-'
  }

  return date.toLocaleString()
}

function getInitials(displayName: string, fallback: string): string {
  const parts = displayName
    .split(' ')
    .map((part) => part.trim())
    .filter(Boolean)

  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
  }

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase()
  }

  return fallback.slice(0, 2).toUpperCase()
}

export function SettingsPage() {
  const { data: profile, isLoading, isError, error, refetch, isFetching } = useProfileQuery()
  const [theme, setTheme] = useState<ThemeMode>(getInitialTheme)

  useEffect(() => {
    const root = document.documentElement
    root.classList.toggle('dark', theme === 'dark')
    window.localStorage.setItem(THEME_STORAGE_KEY, theme)
  }, [theme])

  return (
    <section className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
      </header>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-5">
        <Card className="xl:col-span-3">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-base">
              <UserRound className="h-4 w-4" />
              Profile
            </CardTitle>
            <p className="text-sm text-muted-foreground">Fields are read-only in this screen.</p>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 6 }).map((_, index) => (
                  <Skeleton key={index} className="h-10 w-full" />
                ))}
              </div>
            ) : null}

            {isError ? (
              <div className="rounded-md border border-destructive/40 bg-destructive/5 p-4 text-sm">
                <p className="font-medium text-destructive">Failed to load profile.</p>
                <p className="mt-1 text-muted-foreground">
                  {(error as Error)?.message ?? 'Unexpected error occurred.'}
                </p>
                <button
                  type="button"
                  onClick={() => refetch()}
                  className="mt-3 text-sm font-medium text-primary underline-offset-4 hover:underline"
                >
                  Retry
                </button>
              </div>
            ) : null}

            {!isLoading && !isError && profile ? (
              <div className="space-y-4 sm:space-y-5">
                <div className="relative overflow-hidden rounded-2xl border border-primary/25 bg-gradient-to-br from-primary/15 via-primary/10 to-background p-4 sm:p-5">
                  <div className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-primary/20 blur-2xl" />
                  <div className="pointer-events-none absolute -bottom-12 left-8 h-24 w-24 rounded-full bg-primary/25 blur-2xl" />
                  <div className="relative flex flex-col gap-3 sm:gap-4 md:flex-row md:items-center md:justify-between">
                    <div className="flex items-center gap-3 sm:gap-4">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-primary/40 bg-background/70 text-base font-semibold tracking-wider text-primary shadow-sm backdrop-blur sm:h-14 sm:w-14 sm:text-lg">
                        {getInitials(profile.displayName, profile.username)}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-base font-semibold tracking-tight sm:text-lg">{profile.displayName}</p>
                        <p className="truncate text-xs text-muted-foreground sm:text-sm">@{profile.username}</p>
                      </div>
                    </div>
                    <span
                      className={`inline-flex w-fit max-w-full items-center rounded-full border px-3 py-1 text-[11px] font-medium sm:text-xs ${
                        profile.isActive
                          ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                          : 'border-zinc-500/30 bg-zinc-500/10 text-zinc-700 dark:text-zinc-300'
                      }`}
                    >
                      {profile.isActive ? 'Account active' : 'Account inactive'}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="rounded-xl border bg-muted/20 p-3">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Email</p>
                    <p className="mt-1 break-all text-sm font-medium leading-snug">{profile.email ?? '-'}</p>
                  </div>
                  <div className="rounded-xl border bg-muted/20 p-3">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Role</p>
                    <p className="mt-1 text-sm font-medium">{profile.role.label}</p>
                  </div>
                  <div className="rounded-xl border bg-muted/20 p-3">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Status</p>
                    <p className="mt-1 text-sm font-medium">{profile.isActive ? 'Active' : 'Inactive'}</p>
                  </div>
                  <div className="rounded-xl border bg-muted/20 p-3">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Last updated</p>
                    <p className="mt-1 break-words text-sm font-medium leading-snug">{formatDate(profile.updatedAt)}</p>
                  </div>
                </div>
              </div>
            ) : null}

            <p className="text-xs text-muted-foreground">
              {isFetching ? 'Refreshing profile...' : 'Profile updates are disabled here (read-only).'}
            </p>
          </CardContent>
        </Card>

        <div className="flex flex-col gap-4 xl:col-span-2">
          <ReportingPeriodDefaultSettingsSection />

          <TicketsAutoRefreshSettingsSection />

          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-base">Appearance</CardTitle>
              <p className="text-sm text-muted-foreground">Switch between dark and light theme.</p>
            </CardHeader>
            <CardContent className="space-y-3">
              <button
                type="button"
                onClick={() => setTheme('light')}
                className={`flex w-full items-start justify-between rounded-lg border p-3 text-left transition-colors ${
                  theme === 'light'
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/40 hover:bg-accent/30'
                }`}
              >
                <span>
                  <span className="flex items-center gap-2 font-medium">
                    <SunMedium className="h-4 w-4" />
                    Light
                  </span>
                  <span className="mt-1 block text-xs text-muted-foreground">Bright workspace for daytime usage.</span>
                </span>
                {theme === 'light' ? <Check className="h-4 w-4 text-primary" /> : null}
              </button>

              <button
                type="button"
                onClick={() => setTheme('dark')}
                className={`flex w-full items-start justify-between rounded-lg border p-3 text-left transition-colors ${
                  theme === 'dark'
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/40 hover:bg-accent/30'
                }`}
              >
                <span>
                  <span className="flex items-center gap-2 font-medium">
                    <MoonStar className="h-4 w-4" />
                    Dark
                  </span>
                  <span className="mt-1 block text-xs text-muted-foreground">Low-glare workspace for long sessions.</span>
                </span>
                {theme === 'dark' ? <Check className="h-4 w-4 text-primary" /> : null}
              </button>
            </CardContent>
          </Card>
        </div>

        <PwaInstallSettingsSection />
      </div>
    </section>
  )
}
