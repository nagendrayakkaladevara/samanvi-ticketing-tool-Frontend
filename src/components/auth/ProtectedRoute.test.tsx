import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it } from 'vitest'

import { makeAuthSession } from '@/test/fixtures/auth'
import { useAuthStore } from '@/store/auth-store'

import { ProtectedRoute } from './ProtectedRoute'

function renderProtectedRoute(allowedRoles?: string[], initialPath = '/private') {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route element={<ProtectedRoute allowedRoles={allowedRoles} />}>
          <Route path="/private" element={<div>Private Content</div>} />
        </Route>
        <Route path="/login" element={<div>Login Page</div>} />
        <Route path="/" element={<div>Home</div>} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('ProtectedRoute', () => {
  it('redirects unauthenticated users to login with redirect query', () => {
    renderProtectedRoute(undefined, '/private?tab=1')

    expect(screen.getByText('Login Page')).toBeInTheDocument()
  })

  it('renders outlet when authenticated', () => {
    useAuthStore.getState().setSession(makeAuthSession({ user: { id: '1', name: 'User', role: 'WORKER' } }), true)

    renderProtectedRoute()

    expect(screen.getByText('Private Content')).toBeInTheDocument()
  })

  it('redirects to home when role is not allowed', () => {
    useAuthStore.getState().setSession(makeAuthSession({ user: { id: '1', name: 'User', role: 'WORKER' } }), true)

    renderProtectedRoute(['ADMIN'])

    expect(screen.getByText('Home')).toBeInTheDocument()
  })

  it('allows access when user role matches allowedRoles', () => {
    useAuthStore.getState().setSession(makeAuthSession({ user: { id: '1', name: 'User', role: 'ADMIN' } }), true)

    renderProtectedRoute(['ADMIN'])

    expect(screen.getByText('Private Content')).toBeInTheDocument()
  })
})
