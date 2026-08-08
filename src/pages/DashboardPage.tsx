import { useCurrentUser } from '@/hooks/use-current-user'

import { AdminDashboard } from '@/pages/dashboard/AdminDashboard'
import { OperationsDashboard } from '@/pages/dashboard/OperationsDashboard'

export function DashboardPage() {
  const currentUser = useCurrentUser()

  if (currentUser?.isAdmin) {
    return <AdminDashboard />
  }

  return <OperationsDashboard />
}
