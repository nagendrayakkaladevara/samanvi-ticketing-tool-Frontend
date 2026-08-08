import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { useAppNavigation } from '@/hooks/use-app-navigation'
import { useCurrentUser } from '@/hooks/use-current-user'
import { cn } from '@/lib/utils'

function getGreeting(): string {
  const hour = new Date().getHours()

  if (hour < 12) {
    return 'Good morning'
  }

  if (hour < 17) {
    return 'Good afternoon'
  }

  return 'Good evening'
}

function formatRoleLabel(role: string): string {
  return role
    .trim()
    .toLowerCase()
    .split(/[_\s]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

export function WelcomePage() {
  const currentUser = useCurrentUser()
  const displayName = currentUser?.name?.trim() || 'there'
  const { mainItems, mastersItems, garageItems } = useAppNavigation()

  const quickLinks = [
    ...mainItems.filter((item) => item.id !== 'welcome' && item.id !== 'settings'),
    ...garageItems.slice(0, 2),
    ...mastersItems.slice(0, 2),
  ].slice(0, 6)

  const primaryLink = quickLinks.find((item) => !item.external) ?? null

  return (
    <section
      className="mx-auto flex w-full max-w-3xl flex-col gap-8 py-2 md:gap-10 md:py-4"
      aria-labelledby="welcome-heading"
    >
      <header className="space-y-4">
        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Home</p>
          <h1 id="welcome-heading" className="text-3xl font-semibold tracking-tight text-foreground">
            {getGreeting()}, {displayName}
          </h1>
          <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
            Welcome to Samanvi Internal Tool. Use the sidebar or a quick link below to open tickets,
            garage jobs, and other tools available to your account.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {currentUser?.role ? (
            <span className="inline-flex items-center rounded-md border border-border bg-muted px-2.5 py-1 text-xs font-medium text-foreground">
              {formatRoleLabel(currentUser.role)}
            </span>
          ) : null}
          {primaryLink ? (
            <Button asChild size="sm" className="gap-2">
              <Link to={primaryLink.to}>
                Open {primaryLink.label}
                <ArrowRight className="size-4" aria-hidden />
              </Link>
            </Button>
          ) : null}
        </div>
      </header>

      <Separator />

      <div className="space-y-4">
        <div className="space-y-1">
          <h2 className="text-xl font-semibold text-foreground">Quick links</h2>
          <p className="text-sm text-muted-foreground">
            Shortcuts to modules you can access. Everything else stays in the sidebar.
          </p>
        </div>

        {quickLinks.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border px-4 py-10 text-center">
            <p className="text-sm font-medium text-foreground">No modules available yet</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Ask an administrator if you need access to tickets, garage, or masters.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-border overflow-hidden rounded-lg border border-border" role="list">
            {quickLinks.map((item) => {
              const Icon = item.icon
              const content = (
                <>
                  <span className="flex min-w-0 items-center gap-3">
                    {Icon ? (
                      <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground [&>svg]:size-4">
                        <Icon />
                      </span>
                    ) : null}
                    <span className="truncate text-sm font-medium text-foreground">{item.label}</span>
                  </span>
                  <ArrowRight
                    className="size-4 shrink-0 text-muted-foreground transition-colors group-hover:text-foreground"
                    aria-hidden
                  />
                </>
              )

              return (
                <li key={item.id}>
                  {item.external ? (
                    <a
                      href={item.to}
                      target="_blank"
                      rel="noreferrer"
                      className={cn(
                        'group flex items-center justify-between gap-4 px-4 py-3 transition-colors',
                        'hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                      )}
                    >
                      {content}
                    </a>
                  ) : (
                    <Link
                      to={item.to}
                      className={cn(
                        'group flex items-center justify-between gap-4 px-4 py-3 transition-colors',
                        'hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                      )}
                    >
                      {content}
                    </Link>
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </section>
  )
}
