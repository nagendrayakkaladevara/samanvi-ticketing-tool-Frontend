export type Permission = {
  id: string
  module: string
  submodule: string
  action: string
  label?: string
  key?: string
}

export type PermissionTreeGroup = {
  module: string
  label: string
  submodules: PermissionTreeSubmodule[]
}

export type PermissionTreeSubmodule = {
  submodule: string
  label: string
  permissions: Permission[]
}

export type PermissionsCatalog = {
  items: Permission[]
  tree: PermissionTreeGroup[]
}
