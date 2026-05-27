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

import { BusNoPage } from '@/pages/masters/BusNoPage'

import { EmployeesPage } from '@/pages/masters/EmployeesPage'

import { ServiceForPage } from '@/pages/masters/ServiceForPage'

import { ServiceNoPage } from '@/pages/masters/ServiceNoPage'

import { CreateJobPage } from '@/pages/garage/CreateJobPage'

import { GarageMastersPage } from '@/pages/garage/GarageMastersPage'

import { GarageReportsPage } from '@/pages/garage/GarageReportsPage'

import { RepairTrackingPage } from '@/pages/garage/RepairTrackingPage'

import { ApplicationAccessPage } from '@/pages/ApplicationAccessPage'



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

        errorElement: <NotFoundPage embedded />,

        children: [

          { index: true, element: <RoleHomeRedirect /> },

          { path: 'tickets', element: <TicketsPage /> },

          {

            path: 'tickets/by-status/:statusFilter',

            element: (

              <RoleGuard allowedRoles={['ADMIN']}>

                <TicketsByStatusPage />

              </RoleGuard>

            ),

          },

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

              <RoleGuard allowedRoles={['ADMIN']}>

                <ServiceForPage />

              </RoleGuard>

            ),

          },

          {

            path: 'masters/bus-no',

            element: (

              <RoleGuard allowedRoles={['ADMIN']}>

                <BusNoPage />

              </RoleGuard>

            ),

          },

          {

            path: 'masters/service-no',

            element: (

              <RoleGuard allowedRoles={['ADMIN']}>

                <ServiceNoPage />

              </RoleGuard>

            ),

          },

          {

            path: 'masters/employees',

            element: (

              <RoleGuard allowedRoles={['ADMIN']}>

                <EmployeesPage />

              </RoleGuard>

            ),

          },

          {

            path: 'garage/create-job',

            element: (

              <RoleGuard allowedRoles={['ADMIN', 'SUPERVISOR']}>

                <CreateJobPage />

              </RoleGuard>

            ),

          },

          {

            path: 'garage/repair-tracking',

            element: (

              <RoleGuard allowedRoles={['ADMIN']}>

                <RepairTrackingPage />

              </RoleGuard>

            ),

          },

          {

            path: 'garage/reports',

            element: (

              <RoleGuard allowedRoles={['ADMIN']}>

                <GarageReportsPage />

              </RoleGuard>

            ),

          },

          {

            path: 'garage/masters',

            element: (

              <RoleGuard allowedRoles={['ADMIN']}>

                <GarageMastersPage />

              </RoleGuard>

            ),

          },

          {

            path: 'application-access',

            element: (

              <RoleGuard allowedRoles={['ADMIN']}>

                <ApplicationAccessPage />

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


