import type { ColDef, ICellRendererParams } from 'ag-grid-community'

import type { EmployeeMobileField } from '@/features/employees/components/employees-grid'
import {
  applicationUserTypeLabels,
  type ApplicationUser,
} from '@/features/application-users/types/application-user'
import { cn } from '@/lib/utils'

function StatusBadge({ isActive }: { isActive: boolean }) {
  return (
    <span
      className={cn(
        'inline-flex rounded-full px-2 py-1 text-xs font-medium',
        isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-700',
      )}
    >
      {isActive ? 'Active' : 'Inactive'}
    </span>
  )
}

function textColumn(field: keyof ApplicationUser, headerName: string, minWidth = 140): ColDef<ApplicationUser> {
  return {
    field,
    headerName,
    headerClass: 'ticket-grid__header-cell',
    minWidth,
    flex: 1,
    sortable: true,
    filter: true,
    valueFormatter: (params) => (params.value?.toString().trim() ? String(params.value) : '—'),
  }
}

export const applicationUserDataColumnDefs: ColDef<ApplicationUser>[] = [
  textColumn('displayName', 'Name', 160),
  textColumn('username', 'Username', 130),
  textColumn('mobileNumber', 'Mobile', 130),
  textColumn('email', 'Email', 180),
  {
    field: 'userType',
    headerName: 'User Type',
    headerClass: 'ticket-grid__header-cell',
    minWidth: 150,
    flex: 1,
    sortable: true,
    filter: true,
    valueFormatter: (params) =>
      params.value ? (applicationUserTypeLabels[params.value as ApplicationUser['userType']] ?? String(params.value)) : '—',
  },
  {
    colId: 'permissionOverrides',
    headerName: 'Overrides',
    headerClass: 'ticket-grid__header-cell',
    minWidth: 110,
    maxWidth: 130,
    sortable: true,
    filter: true,
    valueGetter: (params) => params.data?.permissionIds.length ?? 0,
    valueFormatter: (params) => (params.value > 0 ? String(params.value) : '—'),
    cellClass: 'text-muted-foreground',
  },
  {
    field: 'isActive',
    headerName: 'Status',
    headerClass: 'ticket-grid__header-cell',
    minWidth: 110,
    maxWidth: 120,
    sortable: true,
    filter: true,
    valueFormatter: (params) => (params.value ? 'Active' : 'Inactive'),
    cellRenderer: ({ value }: ICellRendererParams<ApplicationUser, boolean>) => (
      <StatusBadge isActive={Boolean(value)} />
    ),
  },
]

export const applicationUserMobileFields: EmployeeMobileField<ApplicationUser>[] = [
  { label: 'Name', getValue: (item) => item.displayName },
  { label: 'Username', getValue: (item) => item.username || '—' },
  { label: 'Mobile', getValue: (item) => item.mobileNumber },
  { label: 'Email', getValue: (item) => item.email ?? '—' },
  {
    label: 'User Type',
    getValue: (item) => applicationUserTypeLabels[item.userType] ?? item.userType,
  },
  {
    label: 'Overrides',
    getValue: (item) => (item.permissionIds.length > 0 ? String(item.permissionIds.length) : '—'),
  },
]

export function applicationUserMobileBadge(item: ApplicationUser) {
  return <StatusBadge isActive={item.isActive} />
}
