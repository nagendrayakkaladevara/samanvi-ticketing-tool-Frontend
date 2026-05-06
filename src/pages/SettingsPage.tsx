import { useEffect, useState } from 'react'
import { Check, MoonStar, SunMedium, UserRound } from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
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
        <p className="text-sm text-muted-foreground">
          Clean profile overview from `GET /profile` and personal appearance preferences.
        </p>
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
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="profile-username">Username</Label>
                  <Input id="profile-username" value={profile.username} readOnly />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="profile-display-name">Display name</Label>
                  <Input id="profile-display-name" value={profile.displayName} readOnly />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="profile-email">Email</Label>
                  <Input id="profile-email" value={profile.email ?? '-'} readOnly />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="profile-role">Role</Label>
                  <Input id="profile-role" value={profile.role.label} readOnly />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="profile-status">Status</Label>
                  <Input id="profile-status" value={profile.isActive ? 'Active' : 'Inactive'} readOnly />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="profile-updated-at">Last updated</Label>
                  <Input id="profile-updated-at" value={formatDate(profile.updatedAt)} readOnly />
                </div>
              </div>
            ) : null}

            <p className="text-xs text-muted-foreground">
              {isFetching ? 'Refreshing profile...' : 'Profile updates are disabled here (read-only).'}
            </p>
          </CardContent>
        </Card>

        <Card className="xl:col-span-2">
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

            <p className="pt-1 text-xs text-muted-foreground">
              Theme is saved in local storage and applied immediately.
            </p>
          </CardContent>
        </Card>
      </div>
    </section>
  )
}
