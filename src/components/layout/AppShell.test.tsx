import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { Route, Routes } from 'react-router-dom'

import { makeAuthSession } from '@/test/fixtures/auth'
import { renderWithProviders } from '@/test/render-with-providers'
import { useAuthStore } from '@/store/auth-store'

vi.mock('@/features/notifications/components/NotificationBell', () => ({
  NotificationBell: () => <div data-testid="notification-bell">Notifications</div>,
}))

vi.mock('@/features/pwa/components/PwaInstallBanner', () => ({
  PwaInstallBanner: () => null,
}))

import { AppShell } from './AppShell'

describe('AppShell', () => {
  it('renders header with user name and outlet content', () => {
    useAuthStore.getState().setSession(makeAuthSession({ user: { id: '1', name: 'Alex Worker', role: 'WORKER' } }))

    renderWithProviders(
      <Routes>
        <Route path="/" element={<AppShell />}>
          <Route index element={<div>Dashboard content</div>} />
        </Route>
      </Routes>,
      { route: '/' },
    )

    expect(screen.getByText('Alex Worker')).toBeInTheDocument()
    expect(screen.getByTestId('notification-bell')).toBeInTheDocument()
    expect(screen.getByText('Dashboard content')).toBeInTheDocument()
  })
})
