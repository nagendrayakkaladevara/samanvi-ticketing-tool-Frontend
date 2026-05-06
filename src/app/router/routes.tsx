/* eslint-disable react-refresh/only-export-components */
import { Navigate, createBrowserRouter } from 'react-router-dom'
import type { ReactNode } from 'react'

import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { PublicOnlyRoute } from '@/components/auth/PublicOnlyRoute'
import { AppShell } from '@/components/layout/AppShell'
import { useCurrentUser } from '@/hooks/use-current-user'
import { SettingsPage } from '@/pages/SettingsPage'
import { DashboardPage } from '@/pages/DashboardPage'
import { TicketsPage } from '@/pages/TicketsPage'
import { TicketDetailsPage } from '@/pages/TicketDetailsPage'
import { CreateTicketPage } from '@/pages/CreateTicketPage'
import { BusesPage } from '@/pages/BusesPage'
import { BusTicketHistoryPage } from '@/pages/BusTicketHistoryPage'
import { BoardPage } from '@/pages/BoardPage'
import { UsersPage } from '@/pages/UsersPage'
import { LoginPage } from '@/pages/LoginPage'
import { NotFoundPage } from '@/pages/NotFoundPage'

function RoleHomeRedirect() {
  const currentUser = useCurrentUser()
  return <Navigate to={currentUser?.role === 'ADMIN' ? '/dashboard' : '/tickets'} replace />
}

function RoleGuard({
  allowedRoles,
  children,
}: {
  allowedRoles: Array<'ADMIN' | 'SUPERVISOR' | 'WORKER' | 'VIEWER'>
  children: ReactNode
}) {
  const currentUser = useCurrentUser()

  if (!currentUser || !allowedRoles.includes(currentUser.role)) {
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}

export const appRouter = createBrowserRouter([
  {
    element: <PublicOnlyRoute />,
    children: [{ path: '/login', element: <LoginPage /> }],
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        path: '/',
        element: <AppShell />,
        errorElement: <NotFoundPage />,
        children: [
          { index: true, element: <RoleHomeRedirect /> },
          { path: 'tickets', element: <TicketsPage /> },
          {
            path: 'tickets/create',
            element: (
              <RoleGuard allowedRoles={['ADMIN', 'SUPERVISOR']}>
                <CreateTicketPage />
              </RoleGuard>
            ),
          },
          { path: 'tickets/:ticketId', element: <TicketDetailsPage /> },
          { path: 'settings', element: <SettingsPage /> },
          {
            path: 'dashboard',
            element: (
              <RoleGuard allowedRoles={['ADMIN']}>
                <DashboardPage />
              </RoleGuard>
            ),
          },
          {
            path: 'board',
            element: (
              <RoleGuard allowedRoles={['ADMIN']}>
                <BoardPage />
              </RoleGuard>
            ),
          },
          {
            path: 'users',
            element: (
              <RoleGuard allowedRoles={['ADMIN']}>
                <UsersPage />
              </RoleGuard>
            ),
          },
          {
            path: 'buses',
            element: (
              <RoleGuard allowedRoles={['ADMIN', 'SUPERVISOR']}>
                <BusesPage />
              </RoleGuard>
            ),
          },
          {
            path: 'buses/:busId/tickets',
            element: (
              <RoleGuard allowedRoles={['ADMIN', 'SUPERVISOR']}>
                <BusTicketHistoryPage />
              </RoleGuard>
            ),
          },
        ],
      },
    ],
  },
  {
    errorElement: <NotFoundPage />,
    path: '*',
    element: <NotFoundPage />,
  },
])
