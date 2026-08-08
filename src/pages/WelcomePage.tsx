import { Link } from 'react-router-dom'
import { ArrowRight, LayoutDashboard } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { useCurrentUser } from '@/hooks/use-current-user'
import { usePermissions } from '@/hooks/use-permissions'

import './welcome-page.css'

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

export function WelcomePage() {
  const currentUser = useCurrentUser()
  const { canAccess } = usePermissions()
  const displayName = currentUser?.name?.trim() || 'there'
  const canOpenDashboard = canAccess({ module: 'tickets', submodule: '', action: 'view' })

  return (
    <section className="welcome-page" aria-labelledby="welcome-heading">
      <div className="welcome-page__backdrop" aria-hidden="true" />
      <div className="welcome-page__grid" aria-hidden="true" />
      <div className="welcome-page__stripe" aria-hidden="true" />

      <div className="welcome-page__panel">
        <p className="welcome-page__eyebrow">
          <span className="welcome-page__eyebrow-mark" aria-hidden="true" />
          Samanvi Internal Tool
        </p>

        <h1 id="welcome-heading" className="welcome-page__title">
          {getGreeting()},
          <span className="welcome-page__name">{displayName}</span>
        </h1>

        <p className="welcome-page__subtitle">
          Welcome to your workspace. Open the dashboard for live metrics, or use the sidebar for
          tickets, garage jobs, and other tools available to your account.
        </p>

        <div className="welcome-page__meta">
          {currentUser?.role ? (
            <span className="welcome-page__role">{currentUser.role}</span>
          ) : null}
          {canOpenDashboard ? (
            <Button asChild size="sm" className="gap-2">
              <Link to="/dashboard">
                <LayoutDashboard className="size-4" aria-hidden />
                Open dashboard
                <ArrowRight className="size-4" aria-hidden />
              </Link>
            </Button>
          ) : (
            <span className="welcome-page__hint">Use the sidebar to open your available tools.</span>
          )}
        </div>
      </div>
    </section>
  )
}
