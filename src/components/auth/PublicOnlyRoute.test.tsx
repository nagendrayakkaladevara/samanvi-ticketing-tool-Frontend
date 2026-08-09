import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it } from 'vitest'

import { makeAuthSession } from '@/test/fixtures/auth'
import { useAuthStore } from '@/store/auth-store'

import { PublicOnlyRoute } from './PublicOnlyRoute'

function renderPublicOnly(initialPath = '/login') {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route element={<PublicOnlyRoute />}>
          <Route path="/login" element={<div>Login Form</div>} />
        </Route>
        <Route path="/tickets" element={<div>Tickets</div>} />
        <Route path="/" element={<div>Home</div>} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('PublicOnlyRoute', () => {
  it('renders outlet for unauthenticated users', () => {
    renderPublicOnly()

    expect(screen.getByText('Login Form')).toBeInTheDocument()
  })

  it('redirects authenticated users using safe post-login redirect', () => {
    useAuthStore.getState().setSession(makeAuthSession(), true)

    renderPublicOnly('/login?redirect=/tickets')

    expect(screen.getByText('Tickets')).toBeInTheDocument()
  })

  it('rejects unsafe redirect and falls back to /', () => {
    useAuthStore.getState().setSession(makeAuthSession(), true)

    renderPublicOnly('/login?redirect=//evil.com')

    expect(screen.getByText('Home')).toBeInTheDocument()
  })
})
