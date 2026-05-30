import { useCurrentUser } from '@/hooks/use-current-user'

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
  const displayName = currentUser?.name?.trim() || 'there'

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
          Welcome to your workspace. Use the sidebar to open tickets, garage jobs, and other tools
          available to your account.
        </p>

        <div className="welcome-page__meta">
          {currentUser?.role ? (
            <span className="welcome-page__role">{currentUser.role}</span>
          ) : null}
          <span className="welcome-page__hint">Home page placeholder — more content coming soon.</span>
        </div>
      </div>
    </section>
  )
}
