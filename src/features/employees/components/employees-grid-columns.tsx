import { BriefcaseBusiness, HardHat } from 'lucide-react'
import type { ColDef, ColDefField, ICellRendererParams } from 'ag-grid-community'
import type { ComponentType } from 'react'

import { SteeringWheelIcon } from '@/components/icons/steering-wheel-icon'
import { MasterDateCell } from '@/features/master-buses/components/master-date-display'
import type { Driver } from '@/features/employees/types/driver'
import type { Helper } from '@/features/employees/types/helper'
import type { OfficeStaff } from '@/features/employees/types/office-staff'
import type { EmployeeMobileField } from '@/features/employees/components/employee-mobile-card'
import { formatMasterDateDisplay } from '@/lib/utils/master-dates'

function EmployeeIdBadge({
  icon: Icon,
  value,
}: {
  icon: ComponentType<{ className?: string }>
  value: string
}) {
  return (
    <span className="ticket-grid__bus-badge inline-flex items-center gap-1.5">
      <Icon className="h-3 w-3 shrink-0 opacity-70" />
      {value}
    </span>
  )
}

function idBadgeColumn<T extends { id: string }>(
  field: ColDefField<T>,
  headerName: string,
  icon: ComponentType<{ className?: string }>,
): ColDef<T> {
  return {
    field,
    headerName,
    headerClass: 'ticket-grid__header-cell',
    cellRenderer: ({ value }: ICellRendererParams<T>) =>
      value ? <EmployeeIdBadge icon={icon} value={String(value)} /> : '—',
    minWidth: 140,
    maxWidth: 170,
    pinned: 'left',
    sortable: true,
    filter: true,
  }
}

function textColumn<T extends { id: string }>(
  field: ColDefField<T>,
  headerName: string,
  minWidth = 140,
): ColDef<T> {
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

export const driverDataColumnDefs: ColDef<Driver>[] = [
  idBadgeColumn('driverIdNumber', 'Driver ID', SteeringWheelIcon),
  textColumn('aadharName', 'Aadhar Name'),
  textColumn('mobileNumber', 'Mobile Number', 130),
  textColumn('dlName', 'DL Name'),
  textColumn('dlNumber', 'DL Number'),
  {
    field: 'transportValidTo',
    headerName: 'Transport Valid To',
    headerClass: 'ticket-grid__header-cell',
    minWidth: 160,
    flex: 1,
    sortable: true,
    filter: true,
    valueFormatter: (params) => formatMasterDateDisplay(params.value),
    cellRenderer: ({ value }: ICellRendererParams<Driver, string>) => (
      <MasterDateCell label={formatMasterDateDisplay(value)} dateValue={value} />
    ),
  },
]

export const helperDataColumnDefs: ColDef<Helper>[] = [
  idBadgeColumn('helperIdNumber', 'Helper ID', HardHat),
  textColumn('aadharName', 'Aadhar Name'),
  textColumn('mobileNumber', 'Mobile Number', 130),
  textColumn('aadharNumber', 'Aadhar Number', 150),
]

export const officeStaffDataColumnDefs: ColDef<OfficeStaff>[] = [
  idBadgeColumn('staffIdNumber', 'Staff ID', BriefcaseBusiness),
  textColumn('aadharName', 'Full Name'),
  textColumn('mobileNumber', 'Mobile Number', 130),
  textColumn('designation', 'Designation'),
]

export const driverMobileFields: EmployeeMobileField<Driver>[] = [
  { label: 'Aadhar Name', getValue: (item) => item.aadharName, fullWidth: true },
  { label: 'Mobile Number', getValue: (item) => item.mobileNumber },
  { label: 'DL Name', getValue: (item) => item.dlName },
  { label: 'DL Number', getValue: (item) => item.dlNumber },
  {
    label: 'Transport Valid To',
    getValue: (item) => formatMasterDateDisplay(item.transportValidTo),
    getDateValue: (item) => item.transportValidTo,
    fullWidth: true,
  },
]

export const helperMobileFields: EmployeeMobileField<Helper>[] = [
  { label: 'Aadhar Name', getValue: (item) => item.aadharName, fullWidth: true },
  { label: 'Mobile Number', getValue: (item) => item.mobileNumber },
  { label: 'Aadhar Number', getValue: (item) => item.aadharNumber },
]

export const officeStaffMobileFields: EmployeeMobileField<OfficeStaff>[] = [
  { label: 'Full Name', getValue: (item) => item.aadharName, fullWidth: true },
  { label: 'Mobile Number', getValue: (item) => item.mobileNumber },
  { label: 'Designation', getValue: (item) => item.designation },
]

export function driverMobileBadge(item: Driver) {
  return <EmployeeIdBadge icon={SteeringWheelIcon} value={item.driverIdNumber} />
}

export function helperMobileBadge(item: Helper) {
  return <EmployeeIdBadge icon={HardHat} value={item.helperIdNumber} />
}

export function officeStaffMobileBadge(item: OfficeStaff) {
  return <EmployeeIdBadge icon={BriefcaseBusiness} value={item.staffIdNumber} />
}

export function driverMobileMeta(item: Driver) {
  return item.mobileNumber
}

export function helperMobileMeta(item: Helper) {
  return item.mobileNumber
}

export function officeStaffMobileMeta(item: OfficeStaff) {
  return item.mobileNumber
}
