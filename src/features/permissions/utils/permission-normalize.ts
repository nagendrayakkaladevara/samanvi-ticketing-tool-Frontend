import type {
  Permission,
  PermissionTreeGroup,
  PermissionTreeSubmodule,
  PermissionsCatalog,
} from '@/features/application-users/types/permission'
import { formatPermissionToken } from '@/features/application-users/utils/permission-labels'

function normalizeString(value: unknown): string | undefined {
  if (typeof value !== 'string') {
    return undefined
  }

  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : undefined
}

export function normalizePermission(raw: unknown): Permission | null {
  if (!raw || typeof raw !== 'object') {
    return null
  }

  const value = raw as Record<string, unknown>
  const idCandidate = value.id ?? value.permissionId ?? value._id
  const id =
    typeof idCandidate === 'string' ? idCandidate : typeof idCandidate === 'number' ? String(idCandidate) : undefined

  const moduleName = normalizeString(value.module)
  const action = normalizeString(value.action)

  if (!id || !moduleName || !action) {
    return null
  }

  return {
    id,
    module: moduleName,
    submodule: normalizeString(value.submodule) ?? '',
    action,
    label: normalizeString(value.label) ?? normalizeString(value.name),
    key: normalizeString(value.key),
  }
}

export function extractPermissionPayload(raw: unknown): Record<string, unknown> {
  if (!raw || typeof raw !== 'object') {
    return {}
  }

  const record = raw as Record<string, unknown>
  if (record.data && typeof record.data === 'object') {
    return record.data as Record<string, unknown>
  }

  return record
}

export function extractPermissionItems(raw: unknown): unknown[] {
  const payload = extractPermissionPayload(raw)
  if (Array.isArray(payload.items)) {
    return payload.items
  }
  if (Array.isArray(payload.permissions)) {
    return payload.permissions
  }
  if (Array.isArray(raw)) {
    return raw
  }
  return []
}

export function buildPermissionTreeFromItems(items: Permission[]): PermissionTreeGroup[] {
  const moduleMap = new Map<string, Map<string, Permission[]>>()

  for (const item of items) {
    if (!moduleMap.has(item.module)) {
      moduleMap.set(item.module, new Map())
    }

    const submoduleMap = moduleMap.get(item.module)!
    const submoduleKey = item.submodule || ''
    if (!submoduleMap.has(submoduleKey)) {
      submoduleMap.set(submoduleKey, [])
    }

    submoduleMap.get(submoduleKey)!.push(item)
  }

  return Array.from(moduleMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([module, submoduleMap]) => ({
      module,
      label: formatPermissionToken(module),
      submodules: Array.from(submoduleMap.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([submodule, permissions]) => ({
          submodule,
          label: submodule ? formatPermissionToken(submodule) : 'General',
          permissions: [...permissions].sort((a, b) => a.action.localeCompare(b.action)),
        })),
    }))
}

function normalizeTreeSubmodule(raw: unknown): PermissionTreeSubmodule | null {
  if (!raw || typeof raw !== 'object') {
    return null
  }

  const value = raw as Record<string, unknown>
  const submodule = normalizeString(value.submodule) ?? ''
  const permissionsSource = Array.isArray(value.permissions)
    ? value.permissions
    : Array.isArray(value.actions)
      ? value.actions
      : []

  const permissions = permissionsSource
    .map(normalizePermission)
    .filter((permission): permission is Permission => Boolean(permission))

  if (permissions.length === 0) {
    return null
  }

  return {
    submodule,
    label: normalizeString(value.label) ?? (submodule ? formatPermissionToken(submodule) : 'General'),
    permissions,
  }
}

function normalizeTreeGroup(raw: unknown): PermissionTreeGroup | null {
  if (!raw || typeof raw !== 'object') {
    return null
  }

  const value = raw as Record<string, unknown>
  const moduleName = normalizeString(value.module)
  if (!moduleName) {
    return null
  }

  const submodulesSource = Array.isArray(value.submodules) ? value.submodules : []
  const submodules = submodulesSource
    .map(normalizeTreeSubmodule)
    .filter((submodule): submodule is PermissionTreeSubmodule => Boolean(submodule))

  if (submodules.length === 0) {
    return null
  }

  return {
    module: moduleName,
    label: normalizeString(value.label) ?? formatPermissionToken(moduleName),
    submodules,
  }
}

export function normalizePermissionTree(raw: unknown, items: Permission[]): PermissionTreeGroup[] {
  const payload = extractPermissionPayload(raw)
  const treeSource = Array.isArray(payload.tree) ? payload.tree : []

  const tree = treeSource
    .map(normalizeTreeGroup)
    .filter((group): group is PermissionTreeGroup => Boolean(group))

  return tree.length > 0 ? tree : buildPermissionTreeFromItems(items)
}

export function normalizePermissionsCatalog(raw: unknown): PermissionsCatalog {
  const items = extractPermissionItems(raw)
    .map(normalizePermission)
    .filter((permission): permission is Permission => Boolean(permission))

  return {
    items,
    tree: normalizePermissionTree(raw, items),
  }
}

export function buildPermissionKey(module: string, submodule: string, action: string): string {
  return `${module}:${submodule}:${action}`
}

export function buildPermissionKeySet(items: Permission[]): Set<string> {
  const set = new Set<string>()
  for (const item of items) {
    set.add(item.key ?? buildPermissionKey(item.module, item.submodule, item.action))
  }
  return set
}
