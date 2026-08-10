/* eslint-disable react-refresh/only-export-components */

import { Navigate, createBrowserRouter } from 'react-router-dom'

import type { ReactNode } from 'react'

import { PermissionGuard } from '@/components/auth/PermissionGuard'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { PublicOnlyRoute } from '@/components/auth/PublicOnlyRoute'
import { AppShell } from '@/components/layout/AppShell'
import {
  BUS_NO_VIEW_CHECKS,
  EMPLOYEE_VIEW_CHECKS,
  GARAGE_MASTERS_VIEW_CHECKS,
} from '@/config/nav-registry'
import { useCurrentUser } from '@/hooks/use-current-user'

import { SettingsPage } from '@/pages/SettingsPage'
import { WelcomePage } from '@/pages/WelcomePage'
import { DashboardPage } from '@/pages/DashboardPage'
import { TicketsPage } from '@/pages/TicketsPage'
import { TicketsByStatusPage } from '@/pages/TicketsByStatusPage'
import { TicketDetailsPage } from '@/pages/TicketDetailsPage'
import { CreateTicketPage } from '@/pages/CreateTicketPage'
import { BusesPage } from '@/pages/BusesPage'
import { BusTicketHistoryPage } from '@/pages/BusTicketHistoryPage'
import { BoardPage } from '@/pages/BoardPage'
import { UsersPage } from '@/pages/UsersPage'
import { UserHistoryPage } from '@/pages/UserHistoryPage'
import { LoginPage } from '@/pages/LoginPage'
import { NotFoundPage } from '@/pages/NotFoundPage'
import { RouteErrorPage } from '@/pages/RouteErrorPage'
import { BusNoPage } from '@/pages/masters/BusNoPage'
import { EmployeesPage } from '@/pages/masters/EmployeesPage'
import { ServiceForPage } from '@/pages/masters/ServiceForPage'
import { ServiceNoPage } from '@/pages/masters/ServiceNoPage'
import { CreateJobPage } from '@/pages/garage/CreateJobPage'
import { EditJobPage } from '@/pages/garage/EditJobPage'
import { GarageMastersPage } from '@/pages/garage/GarageMastersPage'
import { GarageReportsPage } from '@/pages/garage/GarageReportsPage'
import { JobDetailsPage } from '@/pages/garage/JobDetailsPage'
import { RepairTrackingPage } from '@/pages/garage/RepairTrackingPage'
import { ApplicationAccessPage } from '@/pages/ApplicationAccessPage'
import {
  CreateApplicationUserPage,
  EditApplicationUserPage,
} from '@/pages/application-access/ApplicationUserFormPage'
import { ApplicationUserViewPage } from '@/pages/application-access/ApplicationUserViewPage'

function RoleGuard({
  allowedRoles,
  children,
}: {
  allowedRoles: string[]
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
        errorElement: <RouteErrorPage embedded />,
        children: [
          { index: true, element: <WelcomePage /> },
          {
            path: 'tickets',
            element: (
              <PermissionGuard module="tickets">
                <TicketsPage />
              </PermissionGuard>
            ),
          },
          {
            path: 'tickets/by-status/:statusFilter',
            element: (
              <PermissionGuard module="tickets">
                <TicketsByStatusPage />
              </PermissionGuard>
            ),
          },
          {
            path: 'tickets/create',
            element: (
              <PermissionGuard module="tickets" action="create">
                <CreateTicketPage />
              </PermissionGuard>
            ),
          },
          {
            path: 'tickets/:ticketId',
            element: (
              <PermissionGuard module="tickets">
                <TicketDetailsPage />
              </PermissionGuard>
            ),
          },
          { path: 'settings', element: <SettingsPage /> },
          {
            path: 'dashboard',
            element: (
              <PermissionGuard module="tickets">
                <DashboardPage />
              </PermissionGuard>
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
            path: 'users/:userId/history',
            element: (
              <RoleGuard allowedRoles={['ADMIN']}>
                <UserHistoryPage />
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
          {
            path: 'masters/service-for',
            element: (
              <PermissionGuard module="masters" submodule="service_for">
                <ServiceForPage />
              </PermissionGuard>
            ),
          },
          {
            path: 'masters/bus-no',
            element: (
              <PermissionGuard requirement={{ anyOf: BUS_NO_VIEW_CHECKS }}>
                <BusNoPage />
              </PermissionGuard>
            ),
          },
          {
            path: 'masters/service-no',
            element: (
              <PermissionGuard module="masters" submodule="service_number">
                <ServiceNoPage />
              </PermissionGuard>
            ),
          },
          {
            path: 'masters/employees',
            element: (
              <PermissionGuard requirement={{ anyOf: EMPLOYEE_VIEW_CHECKS }}>
                <EmployeesPage />
              </PermissionGuard>
            ),
          },
          {
            path: 'garage/create-job',
            element: (
              <PermissionGuard module="garage" submodule="repair_job" action="create">
                <CreateJobPage />
              </PermissionGuard>
            ),
          },
          {
            path: 'garage/repair-tracking',
            element: (
              <PermissionGuard module="garage" submodule="repair_job">
                <RepairTrackingPage />
              </PermissionGuard>
            ),
          },
          {
            path: 'garage/repair-tracking/:jobId/edit',
            element: (
              <PermissionGuard module="garage" submodule="repair_job" action="edit">
                <EditJobPage />
              </PermissionGuard>
            ),
          },
          {
            path: 'garage/repair-tracking/:jobId',
            element: (
              <PermissionGuard module="garage" submodule="repair_job">
                <JobDetailsPage />
              </PermissionGuard>
            ),
          },
          {
            path: 'garage/reports',
            element: (
              <PermissionGuard module="garage" submodule="repair_job">
                <GarageReportsPage />
              </PermissionGuard>
            ),
          },
          {
            path: 'garage/masters',
            element: (
              <PermissionGuard requirement={{ anyOf: GARAGE_MASTERS_VIEW_CHECKS }}>
                <GarageMastersPage />
              </PermissionGuard>
            ),
          },
          {
            path: 'application-access/create',
            element: (
              <PermissionGuard module="users" action="create">
                <CreateApplicationUserPage />
              </PermissionGuard>
            ),
          },
          {
            path: 'application-access/:userId/edit',
            element: (
              <PermissionGuard module="users" action="edit">
                <EditApplicationUserPage />
              </PermissionGuard>
            ),
          },
          {
            path: 'application-access/:userId',
            element: (
              <PermissionGuard module="users">
                <ApplicationUserViewPage />
              </PermissionGuard>
            ),
          },
          {
            path: 'application-access',
            element: (
              <PermissionGuard module="users">
                <ApplicationAccessPage />
              </PermissionGuard>
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
