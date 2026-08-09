import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { SidebarProvider } from '@/components/ui/sidebar'
import { makeAuthSession } from '@/test/fixtures/auth'
import { renderWithProviders } from '@/test/render-with-providers'
import { useAuthStore } from '@/store/auth-store'

import { AppSidebar } from './app-sidebar'

describe('AppSidebar', () => {
  it('renders navigation and logout', async () => {
    const user = userEvent.setup()
    const logout = vi.spyOn(useAuthStore.getState(), 'logout')
    useAuthStore.getState().setSession(makeAuthSession({ user: { id: '1', name: 'Admin', role: 'ADMIN' } }))

    renderWithProviders(
      <SidebarProvider>
        <AppSidebar />
      </SidebarProvider>,
    )

    expect(screen.getByText('Navigation')).toBeInTheDocument()
    expect(screen.getByText('Masters')).toBeInTheDocument()
    expect(screen.getByText('Logout')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Logout' }))
    expect(logout).toHaveBeenCalled()
  })
})
