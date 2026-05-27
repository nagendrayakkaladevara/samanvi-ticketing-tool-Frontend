export type RepairCategory = {
  id: string
  name: string
  level: number
  parentId: string | null
  createdAt: string
  updatedAt: string
}

export type RepairCategoryTreeNode = RepairCategory & {
  children: RepairCategoryTreeNode[]
}

export type RepairCategoryListResponse = {
  items: RepairCategory[]
  tree: RepairCategoryTreeNode[]
}

export type LeafRepairCategoryOption = {
  id: string
  label: string
  level: number
}
