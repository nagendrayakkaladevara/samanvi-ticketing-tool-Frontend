import type { ComponentType } from 'react'
import {
  Bus,
  Clipboard,
  KeyRound,
  LayoutDashboard,
  Mic,
  Settings,
  Ticket,
  Users,
} from 'lucide-react'

export type NavGroup = 'main' | 'masters' | 'garage'

export type PermissionCheck = {
  module: string
  submodule?: string
  action?: string
}

export type RoutePermissionRequirement = {
  module?: string
  submodule?: string
  action?: string
  authOnly?: boolean
  /** User needs at least one of these checks (used for tabbed screens spanning multiple submodules). */
  anyOf?: PermissionCheck[]
}

export type NavRegistryEntry = {
  id: string
  to: string
  label: string
  icon?: ComponentType
  group: NavGroup
  sortOrder: number
  end?: boolean
  external?: boolean
  hidden?: boolean
  authOnly?: boolean
  permission?: RoutePermissionRequirement
}

export const HOME_ROUTE_PRIORITY = ['/dashboard', '/tickets', '/application-access'] as const

export const EMPLOYEE_VIEW_CHECKS: PermissionCheck[] = [
  { module: 'masters', submodule: 'driver', action: 'view' },
  { module: 'masters', submodule: 'helper', action: 'view' },
  { module: 'masters', submodule: 'office_staff', action: 'view' },
]

export const BUS_NO_VIEW_CHECKS: PermissionCheck[] = [
  { module: 'masters', submodule: 'bus_number', action: 'view' },
  { module: 'masters', submodule: 'spare_tank', action: 'view' },
]

export const GARAGE_MASTERS_VIEW_CHECKS: PermissionCheck[] = [
  { module: 'garage', submodule: 'repair_category', action: 'view' },
  { module: 'garage', submodule: 'repair_part', action: 'view' },
]

export const NAV_REGISTRY: NavRegistryEntry[] = [
  {
    id: 'dashboard',
    to: '/dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
    group: 'main',
    sortOrder: 10,
    permission: { module: 'tickets', submodule: '', action: 'view' },
  },
  {
    id: 'tickets',
    to: '/tickets',
    label: 'Tickets',
    icon: Ticket,
    group: 'main',
    sortOrder: 20,
    end: true,
    permission: { module: 'tickets', submodule: '', action: 'view' },
  },
  {
    id: 'users',
    to: '/users',
    label: 'Users',
    icon: Users,
    group: 'main',
    sortOrder: 30,
    hidden: true,
    authOnly: true,
    permission: { authOnly: true },
  },
  {
    id: 'buses',
    to: '/buses',
    label: 'Buses',
    icon: Bus,
    group: 'main',
    sortOrder: 40,
    hidden: true,
    authOnly: true,
    permission: { authOnly: true },
  },
  {
    id: 'board',
    to: '/board',
    label: 'Board',
    icon: Clipboard,
    group: 'main',
    sortOrder: 50,
    hidden: true,
    authOnly: true,
    permission: { authOnly: true },
  },
  {
    id: 'application-access',
    to: '/application-access',
    label: 'Application Access',
    icon: KeyRound,
    group: 'main',
    sortOrder: 60,
    permission: { module: 'users', submodule: '', action: 'view' },
  },
  {
    id: 'voice-app-access',
    to: 'https://samanvidashboard.netlify.app/voice-app-access',
    label: 'Voice app access',
    icon: Mic,
    group: 'main',
    sortOrder: 70,
    external: true,
    permission: { module: 'users', submodule: '', action: 'view' },
  },
  {
    id: 'settings',
    to: '/settings',
    label: 'Settings',
    icon: Settings,
    group: 'main',
    sortOrder: 80,
    authOnly: true,
    permission: { authOnly: true },
  },
  {
    id: 'masters-service-for',
    to: '/masters/service-for',
    label: 'Service For',
    group: 'masters',
    sortOrder: 10,
    permission: { module: 'masters', submodule: 'service_for', action: 'view' },
  },
  {
    id: 'masters-bus-no',
    to: '/masters/bus-no',
    label: 'Bus No',
    group: 'masters',
    sortOrder: 20,
    permission: { anyOf: BUS_NO_VIEW_CHECKS },
  },
  {
    id: 'masters-service-no',
    to: '/masters/service-no',
    label: 'Service No',
    group: 'masters',
    sortOrder: 30,
    permission: { module: 'masters', submodule: 'service_number', action: 'view' },
  },
  {
    id: 'masters-employees',
    to: '/masters/employees',
    label: 'Employees',
    group: 'masters',
    sortOrder: 40,
    permission: { anyOf: EMPLOYEE_VIEW_CHECKS },
  },
  {
    id: 'garage-create-job',
    to: '/garage/create-job',
    label: 'Create Repair Job',
    group: 'garage',
    sortOrder: 10,
    permission: { module: 'garage', submodule: 'repair_job', action: 'view' },
  },
  {
    id: 'garage-repair-tracking',
    to: '/garage/repair-tracking',
    label: 'Repair Tracking',
    group: 'garage',
    sortOrder: 20,
    permission: { module: 'garage', submodule: 'repair_job', action: 'view' },
  },
  {
    id: 'garage-reports',
    to: '/garage/reports',
    label: 'Reports',
    group: 'garage',
    sortOrder: 30,
    permission: { module: 'garage', submodule: 'repair_job', action: 'view' },
  },
  {
    id: 'garage-masters',
    to: '/garage/masters',
    label: 'Garage Masters',
    group: 'garage',
    sortOrder: 40,
    permission: { anyOf: GARAGE_MASTERS_VIEW_CHECKS },
  },
]

export const ROUTE_GUARD_REGISTRY: Array<{
  pathPrefix: string
  permission: RoutePermissionRequirement
}> = [
  { pathPrefix: '/masters/service-for', permission: { module: 'masters', submodule: 'service_for', action: 'view' } },
  { pathPrefix: '/masters/bus-no', permission: { anyOf: BUS_NO_VIEW_CHECKS } },
  { pathPrefix: '/masters/service-no', permission: { module: 'masters', submodule: 'service_number', action: 'view' } },
  { pathPrefix: '/masters/employees', permission: { anyOf: EMPLOYEE_VIEW_CHECKS } },
  { pathPrefix: '/garage/create-job', permission: { module: 'garage', submodule: 'repair_job', action: 'view' } },
  { pathPrefix: '/garage/repair-tracking', permission: { module: 'garage', submodule: 'repair_job', action: 'view' } },
  { pathPrefix: '/garage/reports', permission: { module: 'garage', submodule: 'repair_job', action: 'view' } },
  { pathPrefix: '/garage/masters', permission: { anyOf: GARAGE_MASTERS_VIEW_CHECKS } },
  { pathPrefix: '/application-access/create', permission: { module: 'users', submodule: '', action: 'create' } },
  { pathPrefix: '/application-access/', permission: { module: 'users', submodule: '', action: 'view' } },
  { pathPrefix: '/application-access', permission: { module: 'users', submodule: '', action: 'view' } },
]

export function getNavEntryByPath(pathname: string): NavRegistryEntry | undefined {
  const normalized = pathname.replace(/\/+$/, '') || '/'
  return NAV_REGISTRY.find((entry) => {
    if (entry.external) {
      return false
    }
    const entryPath = entry.to.replace(/\/+$/, '') || '/'
    return normalized === entryPath || normalized.startsWith(`${entryPath}/`)
  })
}

export function getSubmoduleLabelFromTree(
  tree: import('@/features/application-users/types/permission').PermissionTreeGroup[],
  module: string,
  submodule: string,
): string | undefined {
  const group = tree.find((item) => item.module === module)
  const match = group?.submodules.find((item) => item.submodule === submodule)
  return match?.label
}
