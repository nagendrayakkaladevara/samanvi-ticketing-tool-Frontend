import type { RepairCategory, RepairCategoryTreeNode } from '@/features/garage/types/repair-category'

export type RepairCategoryOption = {
  id: string
  label: string
  level: number
}

export function formatRepairCategoryUpdatedAt(value?: string): string {
  if (!value) return '—'
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return '—'

  return new Intl.DateTimeFormat(undefined, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(parsed)
}

export function flattenRepairCategoryOptions(
  nodes: RepairCategoryTreeNode[],
  path: string[] = [],
): RepairCategoryOption[] {
  const result: RepairCategoryOption[] = []

  for (const node of nodes) {
    const currentPath = [...path, node.name]
    if (node.level < 5) {
      result.push({
        id: node.id,
        label: currentPath.join(' › '),
        level: node.level,
      })
    }
    if (node.children.length > 0) {
      result.push(...flattenRepairCategoryOptions(node.children, currentPath))
    }
  }

  return result
}

export function countRepairCategoryNodes(nodes: RepairCategoryTreeNode[]): number {
  return nodes.reduce((total, node) => total + 1 + countRepairCategoryNodes(node.children), 0)
}

export function findRepairCategoryById(
  nodes: RepairCategoryTreeNode[],
  categoryId: string,
): RepairCategoryTreeNode | null {
  for (const node of nodes) {
    if (node.id === categoryId) return node
    const nested = findRepairCategoryById(node.children, categoryId)
    if (nested) return nested
  }
  return null
}

export function validateRepairCategoryName(name: string): string | null {
  const trimmed = name.trim()
  if (!trimmed) return 'Category name is required.'
  if (trimmed.length > 120) return 'Category name must be 120 characters or fewer.'
  return null
}

export function canAddChildCategory(category: Pick<RepairCategory, 'level'>): boolean {
  return category.level < 5
}
